'use strict';

// ============================================================
// SOUND EFFECTS
// ============================================================
const _sfx = (() => {
    let _ctx = null;
    function _getCtx() {
        if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (_ctx.state === 'suspended') _ctx.resume();
        return _ctx;
    }
    function _osc(type, freq, start, dur, gainPeak, ctx, dest) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, start);
        g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(gainPeak, start + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        o.connect(g); g.connect(dest); o.start(start); o.stop(start + dur + 0.01);
    }
    function _ramp(type, f0, f1, start, dur, peak, ctx, dest) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type; o.frequency.setValueAtTime(f0, start);
        o.frequency.exponentialRampToValueAtTime(f1, start + dur);
        g.gain.setValueAtTime(peak, start); g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        o.connect(g); g.connect(dest); o.start(start); o.stop(start + dur + 0.01);
    }
    function _noise(start, dur, peak, ctx, dest) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buf.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        src.buffer = buf; f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 0.8;
        g.gain.setValueAtTime(peak, start); g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        src.connect(f); f.connect(g); g.connect(dest); src.start(start);
    }
    function _master(ctx) { const m = ctx.createGain(); m.gain.value = 0.55; m.connect(ctx.destination); return m; }
    function tap() { try { const ctx = _getCtx(), d = _master(ctx), t = ctx.currentTime; _osc('sine',820,t,0.06,0.038,ctx,d); _osc('sine',540,t+0.018,0.05,0.022,ctx,d); } catch(e){} }
    function cardFlip() { try { const ctx = _getCtx(), d = _master(ctx), t = ctx.currentTime; _noise(t,0.09,0.22,ctx,d); _ramp('sine',520,260,t,0.12,0.15,ctx,d); } catch(e){} }
    function gameStart() { try { const ctx = _getCtx(), d = _master(ctx), t = ctx.currentTime; [523,659,784].forEach((f,i)=>_osc('sine',f,t+i*0.1,0.22,0.22,ctx,d)); } catch(e){} }
    function tick() { try { const ctx = _getCtx(), m = ctx.createGain(); m.gain.value = 0.3; m.connect(ctx.destination); _osc('sine',1200,ctx.currentTime,0.03,0.08,ctx,m); } catch(e){} }
    function tickUrgent() { try { const ctx = _getCtx(), d = _master(ctx), t = ctx.currentTime; _osc('square',880,t,0.04,0.13,ctx,d); _osc('sine',440,t+0.02,0.06,0.08,ctx,d); } catch(e){} }
    function timerEnd() { try { const ctx = _getCtx(), d = _master(ctx), t = ctx.currentTime; [0,0.13,0.26].forEach(off=>_osc('sine',880,t+off,0.1,0.28,ctx,d)); } catch(e){} }
    function vote() { try { const ctx = _getCtx(), d = _master(ctx), t = ctx.currentTime; _ramp('sine',300,180,t,0.12,0.25,ctx,d); _osc('sine',600,t,0.06,0.12,ctx,d); } catch(e){} }
    function win() { try { const ctx = _getCtx(), d = _master(ctx), t = ctx.currentTime; [523,659,784,1047].forEach((f,i)=>{_osc('sine',f,t+i*0.09,0.3,0.25,ctx,d);_osc('triangle',f*2,t+i*0.09,0.18,0.10,ctx,d);}); } catch(e){} }
    function lose() { try { const ctx = _getCtx(), d = _master(ctx), t = ctx.currentTime; [392,349,294,247].forEach((f,i)=>{_osc('sine',f,t+i*0.11,0.28,0.22,ctx,d);_osc('triangle',f,t+i*0.11,0.26,0.08,ctx,d);}); } catch(e){} }
    function notify() { try { const ctx = _getCtx(), d = _master(ctx), t = ctx.currentTime; _osc('sine',1318,t,0.18,0.20,ctx,d); _osc('sine',988,t+0.08,0.20,0.18,ctx,d); } catch(e){} }
    function error() { try { const ctx = _getCtx(), d = _master(ctx), t = ctx.currentTime; _osc('sawtooth',180,t,0.08,0.20,ctx,d); _osc('sawtooth',160,t+0.06,0.09,0.15,ctx,d); } catch(e){} }
    function swoosh() { try { const ctx = _getCtx(), d = _master(ctx), t = ctx.currentTime; _ramp('sine',200,600,t,0.1,0.10,ctx,d); _noise(t,0.08,0.06,ctx,d); } catch(e){} }
    function modalOpen() { try { const ctx = _getCtx(), d = _master(ctx), t = ctx.currentTime; _ramp('sine',400,800,t,0.07,0.14,ctx,d); } catch(e){} }
    function modalClose() { try { const ctx = _getCtx(), d = _master(ctx), t = ctx.currentTime; _ramp('sine',700,350,t,0.07,0.12,ctx,d); } catch(e){} }
    function reaction(kind) {
        try {
            const ctx = _getCtx(), d = _master(ctx), t = ctx.currentTime;
            if (kind === 'suspect') { _osc('triangle',360,t,0.08,0.16,ctx,d); _ramp('sine',720,420,t+0.04,0.16,0.12,ctx,d); return; }
            if (kind === 'laugh') { [660,760,690].forEach((f,i)=>_osc('sine',f,t+i*0.055,0.08,0.14,ctx,d)); return; }
            if (kind === 'hurry') { [1050,1050].forEach((f,i)=>_osc('square',f,t+i*0.11,0.07,0.12,ctx,d)); return; }
            if (kind === 'caught') { _ramp('sine',420,980,t,0.11,0.18,ctx,d); _osc('triangle',1200,t+0.1,0.1,0.13,ctx,d); return; }
            if (kind === 'quiet') { _noise(t,0.08,0.05,ctx,d); _ramp('sine',520,260,t,0.18,0.09,ctx,d); return; }
            if (kind === 'fire') { _noise(t,0.16,0.12,ctx,d); [523,659,784].forEach((f,i)=>_osc('sawtooth',f,t+i*0.055,0.12,0.10,ctx,d)); return; }
            notify();
        } catch(e){}
    }
    return { tap, cardFlip, gameStart, tick, tickUrgent, timerEnd, vote, win, lose, notify, error, swoosh, modalOpen, modalClose, reaction };
})();
