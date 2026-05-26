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
let _vc         = null;   // Supabase broadcast channel for signaling
let _localStream = null;
let _peers      = {};     // peerId → { pc, audioEl, analyser }
let _localAnalyser = null;
let _muted      = false;
let _voiceOn    = false;
let _vcCode     = null;
let _speakTick  = null;

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

    // Tell everyone already in the channel that we arrived
    _sig({ type: 'voice-join', from: _myId });

    // Speaking detection loop
    _localAnalyser = _makeAnalyser(_localStream);
    _speakTick = setInterval(_detectSpeaking, 120);
}

function stopVoice() {
    if (!_voiceOn) return;

    _sig({ type: 'voice-leave', from: _myId });

    clearInterval(_speakTick);

    Object.keys(_peers).forEach(_closePeer);

    if (_localStream) {
        _localStream.getTracks().forEach(t => t.stop());
        _localStream = null;
    }

    if (_vc) { _supa.removeChannel(_vc); _vc = null; }

    _voiceOn = false;
    _vcCode  = null;

    const panel = document.getElementById('voice-panel');
    if (panel) panel.remove();
}

function toggleMute() {
    if (!_localStream) return;
    _muted = !_muted;
    _localStream.getAudioTracks().forEach(t => { t.enabled = !_muted; });
    _refreshMuteBtn();
}

// ============================================================
// SIGNALING via Supabase Realtime broadcast
// ============================================================

function _signalSubscribe(code) {
    if (_vc) _supa.removeChannel(_vc);

    _vc = _supa
        .channel('voice:' + code)
        .on('broadcast', { event: 'sig' }, ({ payload }) => {
            // directed messages: only handle if addressed to me
            if (payload.to && payload.to !== _myId) return;
            // ignore own echoes
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
        case 'voice-join':
            // Someone new arrived — we send them an offer
            await _sendOffer(from);
            break;
        case 'offer':
            await _handleOffer(from, sdp);
            break;
        case 'answer':
            await _handleAnswer(from, sdp);
            break;
        case 'ice':
            await _handleIce(from, candidate);
            break;
        case 'voice-leave':
            _closePeer(from);
            break;
    }
}

// ============================================================
// WEBRTC PEER MANAGEMENT
// ============================================================

function _getOrMakePeer(peerId) {
    if (_peers[peerId]) return _peers[peerId].pc;

    const pc = new RTCPeerConnection(_ICE);

    // Attach local mic tracks
    if (_localStream) {
        _localStream.getTracks().forEach(t => pc.addTrack(t, _localStream));
    }

    // Play incoming audio
    const audioEl = new Audio();
    audioEl.autoplay = true;

    pc.ontrack = ({ streams }) => {
        audioEl.srcObject = streams[0];
        _peers[peerId].analyser = _makeAnalyser(streams[0]);
        _updateSpeakDot(peerId, false);
    };

    pc.onicecandidate = ({ candidate }) => {
        if (candidate) _sig({ type: 'ice', from: _myId, to: peerId, candidate });
    };

    pc.onconnectionstatechange = () => {
        if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
            _closePeer(peerId);
        }
    };

    _peers[peerId] = { pc, audioEl, analyser: null };
    return pc;
}

async function _sendOffer(peerId) {
    const pc    = _getOrMakePeer(peerId);
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
    if (!peer) return;
    await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
}

async function _handleIce(peerId, candidate) {
    const peer = _peers[peerId];
    if (!peer) return;
    try { await peer.pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
}

function _closePeer(peerId) {
    const peer = _peers[peerId];
    if (!peer) return;
    try { peer.pc.close(); } catch (_) {}
    if (peer.audioEl) { peer.audioEl.srcObject = null; }
    delete _peers[peerId];
    // Remove speaking dot
    const dot = document.querySelector(`.speak-dot[data-pid="${peerId}"]`);
    if (dot) dot.remove();
}

// ============================================================
// SPEAKING DETECTION
// ============================================================

function _makeAnalyser(stream) {
    try {
        const ctx      = new AudioContext();
        const src      = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        return analyser;
    } catch (_) { return null; }
}

function _getVolume(analyser) {
    if (!analyser) return 0;
    const buf = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(buf);
    return buf.reduce((a, b) => a + b, 0) / buf.length;
}

function _detectSpeaking() {
    // Local mic
    const localVol = _getVolume(_localAnalyser);
    _updateSpeakDot('local', localVol > 12 && !_muted);

    // Remote peers
    Object.entries(_peers).forEach(([id, peer]) => {
        const vol = _getVolume(peer.analyser);
        _updateSpeakDot(id, vol > 12);
    });
}

// ============================================================
// UI
// ============================================================

function _buildVoiceUI() {
    // Inject CSS once
    if (!document.getElementById('voice-style')) {
        const style = document.createElement('style');
        style.id = 'voice-style';
        style.textContent = `
            #voice-panel {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 999;
                background: rgba(20,20,20,0.92);
                border: 1px solid rgba(255,255,255,0.12);
                border-radius: 40px;
                padding: 10px 18px;
                display: flex;
                align-items: center;
                gap: 12px;
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 24px rgba(0,0,0,0.5);
                user-select: none;
            }
            #voice-panel .vc-label {
                font-size: 13px;
                opacity: 0.6;
                color: #fff;
            }
            #voice-mute-btn {
                background: #27ae60;
                color: #fff;
                border: none;
                border-radius: 24px;
                padding: 8px 18px;
                font-size: 14px;
                cursor: pointer;
                font-family: inherit;
                transition: background 0.2s;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            #voice-mute-btn.muted {
                background: #c0392b;
            }
            #voice-leave-btn {
                background: transparent;
                color: rgba(255,255,255,0.5);
                border: 1px solid rgba(255,255,255,0.15);
                border-radius: 24px;
                padding: 7px 14px;
                font-size: 13px;
                cursor: pointer;
                font-family: inherit;
                transition: color 0.2s, border-color 0.2s;
            }
            #voice-leave-btn:hover { color: #e74c3c; border-color: #e74c3c; }

            /* Speaking ring around player names */
            .speak-dot {
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #2ecc71;
                margin-right: 5px;
                opacity: 0;
                transition: opacity 0.15s;
                vertical-align: middle;
            }
            .speak-dot.active { opacity: 1; }

            /* Pulse on the mute button when speaking */
            #voice-mute-btn.speaking {
                box-shadow: 0 0 0 4px rgba(46,204,113,0.35);
            }
        `;
        document.head.appendChild(style);
    }

    let panel = document.getElementById('voice-panel');
    if (panel) panel.remove();

    panel = document.createElement('div');
    panel.id = 'voice-panel';
    panel.innerHTML = `
        <span class="vc-label">🎙️ صوت</span>
        <button id="voice-mute-btn">🎙️ شغال</button>
        <button id="voice-leave-btn">قطع</button>
    `;
    document.body.appendChild(panel);

    document.getElementById('voice-mute-btn').addEventListener('click', toggleMute);
    document.getElementById('voice-leave-btn').addEventListener('click', stopVoice);
}

function _refreshMuteBtn() {
    const btn = document.getElementById('voice-mute-btn');
    if (!btn) return;
    btn.innerHTML = _muted ? '🔇 صامت' : '🎙️ شغال';
    btn.classList.toggle('muted', _muted);
}

function _updateSpeakDot(id, isSpeaking) {
    // local player dot
    const targetId = (id === 'local') ? _myId : id;

    // Try to find a dot already attached to a player element
    let dot = document.querySelector(`.speak-dot[data-pid="${targetId}"]`);

    // If not found, try to inject one into a matching lobby/seen-status element
    if (!dot) {
        // lobby player items
        const items = document.querySelectorAll('.lobby-player-item, .seen-status-item');
        items.forEach(el => {
            // Match by player id stored in a data attribute, or fallback: skip if already has dot
            if (!el.querySelector('.speak-dot') && el.innerHTML.includes(targetId)) {
                dot = document.createElement('span');
                dot.className = 'speak-dot';
                dot.dataset.pid = targetId;
                el.prepend(dot);
            }
        });
    }

    if (dot) dot.classList.toggle('active', isSpeaking);

    // Also pulse the mute button for local speaking
    if (id === 'local') {
        const btn = document.getElementById('voice-mute-btn');
        if (btn) btn.classList.toggle('speaking', isSpeaking && !_muted);
    }
}

// ============================================================
// WIRE UP "join voice" BUTTON IN LOBBY
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // Inject "join voice" button into the lobby screen
    const lobbyScreen = document.getElementById('online-lobby-screen');
    if (lobbyScreen) {
        const vcBtn = document.createElement('button');
        vcBtn.id        = 'join-voice-btn';
        vcBtn.className = 'primary-btn';
        vcBtn.style.cssText = 'margin-top:12px; background:#27ae60;';
        vcBtn.innerText = '🎙️ انضم للصوت';

        // Insert before the leave button
        const leaveBtn = document.getElementById('leave-room-btn');
        if (leaveBtn) leaveBtn.before(vcBtn);
        else lobbyScreen.appendChild(vcBtn);

        vcBtn.addEventListener('click', () => {
            if (_voiceOn) {
                stopVoice();
                vcBtn.innerText = '🎙️ انضم للصوت';
                vcBtn.style.background = '#27ae60';
            } else {
                const code = document.getElementById('display-room-code').innerText;
                if (!code || code === '------') {
                    _showToast('ما لقيناش كود الغرفة');
                    return;
                }
                initVoice(code).then(() => {
                    if (_voiceOn) {
                        vcBtn.innerText = '🔴 قطع الصوت';
                        vcBtn.style.background = '#c0392b';
                    }
                });
            }
        });
    }

    // Auto-stop voice when leaving the room
    const leaveRoomBtn = document.getElementById('leave-room-btn');
    if (leaveRoomBtn) {
        leaveRoomBtn.addEventListener('click', () => {
            if (_voiceOn) stopVoice();
        }, true); // capture phase so it runs before online.js handler
    }
});
