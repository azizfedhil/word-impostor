'use strict';

// ============================================================
// VOICE CHAT
// ============================================================
const _ICE = { iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:stun1.l.google.com:19302'}] };
let _vc=null, _localStream=null, _peers={}, _localAnalyser=null, _muted=false, _voiceOn=false, _vcCode=null, _speakTick=null;

async function initVoice(roomCode) {
    if (_voiceOn) return; _vcCode = roomCode;
    try { _localStream = await navigator.mediaDevices.getUserMedia({audio:true,video:false}); }
    catch(e) { showToast('ما قدرناش نوصلو للميكروفون 🎙️'); return; }
    _voiceOn=true; _muted=false; _buildVoiceUI(); _signalSubscribe(roomCode);
    _sig({type:'voice-join',from:_myId});
    _localAnalyser = _makeAnalyser(_localStream);
    _speakTick = setInterval(_detectSpeaking, 120);
}
function stopVoice() {
    if (!_voiceOn) return; _sig({type:'voice-leave',from:_myId});
    clearInterval(_speakTick); Object.keys(_peers).forEach(_closePeer);
    if (_localStream) { _localStream.getTracks().forEach(t=>t.stop()); _localStream=null; }
    if (_vc) { _supa.removeChannel(_vc); _vc=null; }
    _voiceOn=false; _vcCode=null; document.getElementById('voice-panel')?.remove();
    const btn = document.getElementById('join-voice-btn'); if(btn){btn.innerText='🎙️ انضم للصوت';btn.dataset.active='';}
}
function toggleMute() { if(!_localStream)return; _muted=!_muted; _localStream.getAudioTracks().forEach(t=>{t.enabled=!_muted;}); _refreshMicBtn(); }
function _signalSubscribe(code) {
    if(_vc)_supa.removeChannel(_vc);
    _vc=_supa.channel('voice:'+code).on('broadcast',{event:'sig'},({payload})=>{if(payload.to&&payload.to!==_myId)return;if(payload.from===_myId)return;_handleVoiceSig(payload);}).subscribe();
}
function _sig(payload){if(_vc)_vc.send({type:'broadcast',event:'sig',payload});}
async function _handleVoiceSig({type,from,sdp,candidate}){switch(type){case'voice-join':await _sendOffer(from);break;case'offer':await _handleOffer(from,sdp);break;case'answer':await _handleAnswer(from,sdp);break;case'ice':await _handleIce(from,candidate);break;case'voice-leave':_closePeer(from);break;}}
function _getOrMakePeer(pid){if(_peers[pid])return _peers[pid].pc;const pc=new RTCPeerConnection(_ICE),ae=new Audio();ae.autoplay=true;if(_localStream)_localStream.getTracks().forEach(t=>pc.addTrack(t,_localStream));pc.ontrack=({streams})=>{ae.srcObject=streams[0];_peers[pid].analyser=_makeAnalyser(streams[0]);};pc.onicecandidate=({candidate})=>{if(candidate)_sig({type:'ice',from:_myId,to:pid,candidate});};pc.onconnectionstatechange=()=>{if(['disconnected','failed','closed'].includes(pc.connectionState))_closePeer(pid);};_peers[pid]={pc,audioEl:ae,analyser:null};return pc;}
async function _sendOffer(pid){const pc=_getOrMakePeer(pid);const o=await pc.createOffer();await pc.setLocalDescription(o);_sig({type:'offer',from:_myId,to:pid,sdp:o});}
async function _handleOffer(pid,sdp){const pc=_getOrMakePeer(pid);await pc.setRemoteDescription(new RTCSessionDescription(sdp));const a=await pc.createAnswer();await pc.setLocalDescription(a);_sig({type:'answer',from:_myId,to:pid,sdp:a});}
async function _handleAnswer(pid,sdp){const peer=_peers[pid];if(peer)await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));}
async function _handleIce(pid,candidate){const peer=_peers[pid];if(peer)try{await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));}catch(_){}}
function _closePeer(pid){const peer=_peers[pid];if(!peer)return;try{peer.pc.close();}catch(_){}if(peer.audioEl)peer.audioEl.srcObject=null;delete _peers[pid];}
function _makeAnalyser(stream){try{const ctx=new AudioContext(),src=ctx.createMediaStreamSource(stream),an=ctx.createAnalyser();an.fftSize=256;src.connect(an);return an;}catch(_){return null;}}
function _getVolume(an){if(!an)return 0;const buf=new Uint8Array(an.frequencyBinCount);an.getByteFrequencyData(buf);return buf.reduce((a,b)=>a+b,0)/buf.length;}
function _detectSpeaking(){_setSpeaking('local',_getVolume(_localAnalyser)>12&&!_muted);Object.entries(_peers).forEach(([id,p])=>_setSpeaking(id,_getVolume(p.analyser)>12));}
function _setSpeaking(id,isSpeaking){if(id==='local')document.getElementById('voice-mute-btn')?.classList.toggle('speaking',isSpeaking&&!_muted);const tid=id==='local'?_myId:id;let dot=document.querySelector(`.speak-dot[data-pid="${tid}"]`);if(!dot){document.querySelectorAll('.lobby-item,.seen-status-item').forEach(el=>{if(!el.querySelector('.speak-dot')&&el.innerHTML.includes(tid)){dot=document.createElement('span');dot.className='speak-dot';dot.dataset.pid=tid;el.prepend(dot);}});}dot?.classList.toggle('active',isSpeaking);}
function _buildVoiceUI(){document.getElementById('voice-panel')?.remove();const panel=document.createElement('div');panel.id='voice-panel';panel.innerHTML=`<div class="vc-live"><span class="vc-live-dot"></span>صوت</div><div class="vc-sep"></div><button id="voice-mute-btn" title="كتم/فتح الميكروفون">🎙️</button><button id="voice-leave-btn" title="قطع الصوت">✕</button>`;document.body.appendChild(panel);document.getElementById('voice-mute-btn').addEventListener('click',toggleMute);document.getElementById('voice-leave-btn').addEventListener('click',stopVoice);}
function _refreshMicBtn(){const btn=document.getElementById('voice-mute-btn');if(!btn)return;btn.textContent=_muted?'🔇':'🎙️';btn.classList.toggle('muted',_muted);if(_muted)btn.classList.remove('speaking');}
