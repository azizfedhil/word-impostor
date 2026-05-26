// ============================================================
// voice.js — WebRTC Voice Chat for لعبة الدخيل
// Depends on: _supa, _myId, _showToast (from online.js)
// ============================================================

const _ICE = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// ---- State ----
let _vc            = null;
let _localStream   = null;
let _peers         = {};
let _localAnalyser = null;
let _muted         = false;
let _voiceOn       = false;
let _vcCode        = null;
let _speakTick     = null;

// ============================================================
// PUBLIC API
// ============================================================

async function initVoice(roomCode) {
    if (_voiceOn) return;
    _vcCode = roomCode;

    try {
        _localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (e) {
        _showToast('ما قدرناش نوصلو للميكروفون 🎙️');
        return;
    }

    _voiceOn = true;
    _muted   = false;

    _buildVoiceUI();
    _signalSubscribe(roomCode);
    _sig({ type: 'voice-join', from: _myId });

    _localAnalyser = _makeAnalyser(_localStream);
    _speakTick = setInterval(_detectSpeaking, 120);
}

function stopVoice() {
    if (!_voiceOn) return;
    _sig({ type: 'voice-leave', from: _myId });
    clearInterval(_speakTick);
    Object.keys(_peers).forEach(_closePeer);
    if (_localStream) { _localStream.getTracks().forEach(t => t.stop()); _localStream = null; }
    if (_vc) { _supa.removeChannel(_vc); _vc = null; }
    _voiceOn = false;
    _vcCode  = null;
    document.getElementById('voice-panel')?.remove();
    // Reset lobby button
    const btn = document.getElementById('join-voice-btn');
    if (btn) { btn.innerText = '🎙️ انضم للصوت'; btn.dataset.active = ''; }
}

function toggleMute() {
    if (!_localStream) return;
    _muted = !_muted;
    _localStream.getAudioTracks().forEach(t => { t.enabled = !_muted; });
    _refreshMicBtn();
}

// ============================================================
// SIGNALING
// ============================================================

function _signalSubscribe(code) {
    if (_vc) _supa.removeChannel(_vc);
    _vc = _supa
        .channel('voice:' + code)
        .on('broadcast', { event: 'sig' }, ({ payload }) => {
            if (payload.to && payload.to !== _myId) return;
            if (payload.from === _myId) return;
            _handleSig(payload);
        })
        .subscribe();
}

function _sig(payload) {
    if (!_vc) return;
    _vc.send({ type: 'broadcast', event: 'sig', payload });
}

async function _handleSig({ type, from, sdp, candidate }) {
    switch (type) {
        case 'voice-join':  await _sendOffer(from);          break;
        case 'offer':       await _handleOffer(from, sdp);   break;
        case 'answer':      await _handleAnswer(from, sdp);  break;
        case 'ice':         await _handleIce(from, candidate); break;
        case 'voice-leave': _closePeer(from);                break;
    }
}

// ============================================================
// WEBRTC
// ============================================================

function _getOrMakePeer(peerId) {
    if (_peers[peerId]) return _peers[peerId].pc;
    const pc      = new RTCPeerConnection(_ICE);
    const audioEl = new Audio();
    audioEl.autoplay = true;
    if (_localStream) _localStream.getTracks().forEach(t => pc.addTrack(t, _localStream));
    pc.ontrack = ({ streams }) => {
        audioEl.srcObject = streams[0];
        _peers[peerId].analyser = _makeAnalyser(streams[0]);
    };
    pc.onicecandidate = ({ candidate }) => {
        if (candidate) _sig({ type: 'ice', from: _myId, to: peerId, candidate });
    };
    pc.onconnectionstatechange = () => {
        if (['disconnected','failed','closed'].includes(pc.connectionState)) _closePeer(peerId);
    };
    _peers[peerId] = { pc, audioEl, analyser: null };
    return pc;
}

async function _sendOffer(peerId) {
    const pc = _getOrMakePeer(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    _sig({ type: 'offer', from: _myId, to: peerId, sdp: offer });
}
async function _handleOffer(peerId, sdp) {
    const pc = _getOrMakePeer(peerId);
    await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    _sig({ type: 'answer', from: _myId, to: peerId, sdp: answer });
}
async function _handleAnswer(peerId, sdp) {
    const peer = _peers[peerId];
    if (peer) await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
}
async function _handleIce(peerId, candidate) {
    const peer = _peers[peerId];
    if (peer) try { await peer.pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch(_){}
}
function _closePeer(peerId) {
    const peer = _peers[peerId];
    if (!peer) return;
    try { peer.pc.close(); } catch(_){}
    if (peer.audioEl) peer.audioEl.srcObject = null;
    delete _peers[peerId];
}

// ============================================================
// SPEAKING DETECTION
// ============================================================

function _makeAnalyser(stream) {
    try {
        const ctx = new AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        const an  = ctx.createAnalyser();
        an.fftSize = 256;
        src.connect(an);
        return an;
    } catch(_) { return null; }
}

function _getVolume(an) {
    if (!an) return 0;
    const buf = new Uint8Array(an.frequencyBinCount);
    an.getByteFrequencyData(buf);
    return buf.reduce((a,b) => a+b, 0) / buf.length;
}

function _detectSpeaking() {
    const localVol = _getVolume(_localAnalyser);
    _setSpeaking('local', localVol > 12 && !_muted);
    Object.entries(_peers).forEach(([id, p]) => _setSpeaking(id, _getVolume(p.analyser) > 12));
}

// ============================================================
// UI — iOS Control Center style
// ============================================================

const _VOICE_CSS = `
/* ── Voice Panel ─────────────────────────────── */
#voice-panel {
    position: fixed;
    bottom: env(safe-area-inset-bottom, 0px);
    bottom: calc(env(safe-area-inset-bottom, 0px) + 18px);
    left: 50%;
    transform: translateX(-50%) translateY(0);
    z-index: 9990;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 10px 14px 10px 18px;
    background: rgba(28, 28, 30, 0.82);
    backdrop-filter: saturate(180%) blur(24px);
    -webkit-backdrop-filter: saturate(180%) blur(24px);
    border: 1px solid rgba(255,255,255,0.10);
    border-radius: 999px;
    box-shadow:
        0 8px 32px rgba(0,0,0,0.45),
        0 2px 8px  rgba(0,0,0,0.25),
        inset 0 1px 0 rgba(255,255,255,0.06);
    animation: voicePanelIn 0.42s cubic-bezier(0.34,1.56,0.64,1) both;
    user-select: none;
    -webkit-user-select: none;
}
@keyframes voicePanelIn {
    from { opacity:0; transform:translateX(-50%) translateY(24px) scale(0.88); }
    to   { opacity:1; transform:translateX(-50%) translateY(0)    scale(1);    }
}

/* Live label */
#voice-panel .vc-live {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: rgba(255,255,255,0.55);
    letter-spacing: 0.3px;
    white-space: nowrap;
}
#voice-panel .vc-live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #30d158;
    flex-shrink: 0;
    box-shadow: 0 0 6px #30d158;
    animation: livePulse 2s ease-in-out infinite;
}
@keyframes livePulse {
    0%,100% { opacity:1; transform:scale(1);   }
    50%      { opacity:.5; transform:scale(0.75); }
}

/* Separator */
#voice-panel .vc-sep {
    width: 1px;
    height: 28px;
    background: rgba(255,255,255,0.12);
    border-radius: 1px;
    flex-shrink: 0;
}

/* Mic button */
#voice-mute-btn {
    all: unset;
    position: relative;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: #30d158;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.25s, transform 0.15s;
    box-shadow:
        0 2px 10px rgba(48,209,88,0.50),
        inset 0 1px 0 rgba(255,255,255,0.18);
    -webkit-tap-highlight-color: transparent;
}
#voice-mute-btn:active { transform: scale(0.88); }

/* speaking ring */
#voice-mute-btn::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2.5px solid #30d158;
    opacity: 0;
    transform: scale(0.85);
    transition: opacity 0.12s, transform 0.12s;
}
#voice-mute-btn.speaking::before {
    opacity: 0.65;
    transform: scale(1);
    animation: speakRing 0.9s ease-in-out infinite;
}
@keyframes speakRing {
    0%,100% { opacity:0.55; transform:scale(1);    }
    50%      { opacity:0.15; transform:scale(1.22); }
}

/* muted state */
#voice-mute-btn.muted {
    background: rgba(255,255,255,0.14);
    box-shadow: none;
}
#voice-mute-btn.muted::before { display:none; }

/* Leave button */
#voice-leave-btn {
    all: unset;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,0.10);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    cursor: pointer;
    flex-shrink: 0;
    color: rgba(255,255,255,0.55);
    transition: background 0.2s, color 0.2s, transform 0.15s;
    -webkit-tap-highlight-color: transparent;
    border: 1px solid rgba(255,255,255,0.08);
}
#voice-leave-btn:active { transform: scale(0.88); }
#voice-leave-btn:hover  { background: rgba(255,59,48,0.35); color: #ff3b30; }

/* Speaking dots on player names */
.speak-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #30d158;
    margin-left: 6px;
    opacity: 0;
    transform: scale(0.5);
    transition: opacity 0.12s, transform 0.12s;
    vertical-align: middle;
    box-shadow: 0 0 5px #30d158;
}
.speak-dot.active {
    opacity: 1;
    transform: scale(1);
}

/* Join voice button in lobby */
#join-voice-btn {
    background: linear-gradient(145deg, #1c6b38, #1a5c30) !important;
    box-shadow: 0 3px 12px rgba(28,107,56,0.4) !important;
    transition: background 0.25s, box-shadow 0.25s !important;
}
#join-voice-btn[data-active="1"] {
    background: linear-gradient(145deg, #8a2020, #6e1515) !important;
    box-shadow: 0 3px 12px rgba(138,32,32,0.4) !important;
}
`;

function _injectVoiceCss() {
    if (document.getElementById('voice-style')) return;
    const s = document.createElement('style');
    s.id = 'voice-style';
    s.textContent = _VOICE_CSS;
    document.head.appendChild(s);
}

function _buildVoiceUI() {
    _injectVoiceCss();
    document.getElementById('voice-panel')?.remove();

    const panel = document.createElement('div');
    panel.id = 'voice-panel';
    panel.innerHTML = `
        <div class="vc-live">
            <span class="vc-live-dot"></span>
            صوت
        </div>
        <div class="vc-sep"></div>
        <button id="voice-mute-btn" title="كتم/فتح الميكروفون">🎙️</button>
        <button id="voice-leave-btn" title="قطع الصوت">✕</button>
    `;
    document.body.appendChild(panel);

    document.getElementById('voice-mute-btn').addEventListener('click', toggleMute);
    document.getElementById('voice-leave-btn').addEventListener('click', stopVoice);
}

function _refreshMicBtn() {
    const btn = document.getElementById('voice-mute-btn');
    if (!btn) return;
    btn.textContent = _muted ? '🔇' : '🎙️';
    btn.classList.toggle('muted', _muted);
    if (_muted) btn.classList.remove('speaking');
}

function _setSpeaking(id, isSpeaking) {
    // Pulse mic button for local
    if (id === 'local') {
        document.getElementById('voice-mute-btn')
            ?.classList.toggle('speaking', isSpeaking && !_muted);
    }
    // Speaking dot on player rows
    const targetId = id === 'local' ? _myId : id;
    let dot = document.querySelector(`.speak-dot[data-pid="${targetId}"]`);
    if (!dot) {
        // Try to attach to a matching player row
        document.querySelectorAll('.lobby-player-item, .seen-status-item').forEach(el => {
            if (!el.querySelector('.speak-dot') && el.innerHTML.includes(targetId)) {
                dot = document.createElement('span');
                dot.className = 'speak-dot';
                dot.dataset.pid = targetId;
                el.prepend(dot);
            }
        });
    }
    dot?.classList.toggle('active', isSpeaking);
}

// ============================================================
// LOBBY BUTTON + AUTO-STOP
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    _injectVoiceCss();

    const lobbyScreen = document.getElementById('online-lobby-screen');
    if (lobbyScreen) {
        const vcBtn = document.createElement('button');
        vcBtn.id = 'join-voice-btn';
        vcBtn.className = 'primary-btn';
        vcBtn.style.marginTop = '12px';
        vcBtn.innerText = '🎙️ انضم للصوت';

        const leaveBtn = document.getElementById('leave-room-btn');
        if (leaveBtn) leaveBtn.before(vcBtn);
        else lobbyScreen.appendChild(vcBtn);

        vcBtn.addEventListener('click', () => {
            if (_voiceOn) {
                stopVoice();
            } else {
                const code = document.getElementById('display-room-code')?.innerText;
                if (!code || code === '------') { _showToast('ما لقيناش كود الغرفة'); return; }
                initVoice(code).then(() => {
                    if (_voiceOn) vcBtn.dataset.active = '1';
                });
            }
        });
    }

    // Auto-stop voice on leave (capture phase — runs before online.js handler)
    document.getElementById('leave-room-btn')?.addEventListener('click', () => {
        if (_voiceOn) stopVoice();
    }, true);
});
