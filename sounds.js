// ============================================================
// sounds.js — iOS-style Sound Effects for لعبة الدخيل
// Pure Web Audio API — no audio files needed
// ============================================================

const _sfx = (() => {
    let _ctx = null;

    function _getCtx() {
        if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
        // Resume if suspended (browser autoplay policy)
        if (_ctx.state === 'suspended') _ctx.resume();
        return _ctx;
    }

    // ── Core helpers ──────────────────────────────────────────

    function _osc(type, freq, start, dur, gainPeak, ctx, dest) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type      = type;
        o.frequency.setValueAtTime(freq, start);
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(gainPeak, start + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        o.connect(g);
        g.connect(dest);
        o.start(start);
        o.stop(start + dur + 0.01);
    }

    function _freqRamp(type, f0, f1, start, dur, gainPeak, ctx, dest) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f0, start);
        o.frequency.exponentialRampToValueAtTime(f1, start + dur);
        g.gain.setValueAtTime(gainPeak, start);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        o.connect(g);
        g.connect(dest);
        o.start(start);
        o.stop(start + dur + 0.01);
    }

    function _noise(start, dur, gainPeak, ctx, dest) {
        const buf    = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data   = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const src    = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const g      = ctx.createGain();
        src.buffer      = buf;
        filter.type     = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value  = 0.8;
        g.gain.setValueAtTime(gainPeak, start);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        src.connect(filter);
        filter.connect(g);
        g.connect(dest);
        src.start(start);
    }

    // ── Master volume ─────────────────────────────────────────

    function _master(ctx) {
        const m = ctx.createGain();
        m.gain.value = 0.55;
        m.connect(ctx.destination);
        return m;
    }

    // ── Individual sounds ─────────────────────────────────────

    /** Short tap — buttons, toggles */
    function tap() {
        const ctx  = _getCtx();
        const dest = _master(ctx);
        const t    = ctx.currentTime;
        _osc('sine', 1050, t,        0.055, 0.18, ctx, dest);
        _osc('sine',  880, t + 0.01, 0.04,  0.10, ctx, dest);
    }

    /** Card flip — whoosh + soft thud */
    function cardFlip() {
        const ctx  = _getCtx();
        const dest = _master(ctx);
        const t    = ctx.currentTime;
        _noise(t, 0.09, 0.22, ctx, dest);
        _freqRamp('sine', 520, 260, t, 0.12, 0.15, ctx, dest);
    }

    /** Game start — ascending 3-note chime */
    function gameStart() {
        const ctx   = _getCtx();
        const dest  = _master(ctx);
        const t     = ctx.currentTime;
        const notes = [523, 659, 784];
        notes.forEach((f, i) => _osc('sine', f, t + i * 0.1, 0.22, 0.22, ctx, dest));
    }

    /** Timer tick — ultra-soft click (played every second) */
    function tick() {
        const ctx  = _getCtx();
        const dest = _master(ctx);
        const t    = ctx.currentTime;
        const m    = ctx.createGain();
        m.gain.value = 0.3;
        m.connect(ctx.destination);
        _osc('sine', 1200, t, 0.03, 0.08, ctx, m);
    }

    /** Timer urgent — sharper tick for last 10s */
    function tickUrgent() {
        const ctx  = _getCtx();
        const dest = _master(ctx);
        const t    = ctx.currentTime;
        _osc('square', 880, t,       0.04, 0.13, ctx, dest);
        _osc('sine',   440, t + 0.02, 0.06, 0.08, ctx, dest);
    }

    /** Timer end — alarm ping */
    function timerEnd() {
        const ctx  = _getCtx();
        const dest = _master(ctx);
        const t    = ctx.currentTime;
        [0, 0.13, 0.26].forEach(offset => {
            _osc('sine', 880, t + offset, 0.1, 0.28, ctx, dest);
        });
    }

    /** Vote cast — satisfying pop */
    function vote() {
        const ctx  = _getCtx();
        const dest = _master(ctx);
        const t    = ctx.currentTime;
        _freqRamp('sine', 300, 180, t, 0.12, 0.25, ctx, dest);
        _osc('sine', 600, t, 0.06, 0.12, ctx, dest);
    }

    /** Win — bright ascending arpeggio */
    function win() {
        const ctx   = _getCtx();
        const dest  = _master(ctx);
        const t     = ctx.currentTime;
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => {
            _osc('sine',     f,       t + i * 0.09, 0.3,  0.25, ctx, dest);
            _osc('triangle', f * 2,   t + i * 0.09, 0.18, 0.10, ctx, dest);
        });
    }

    /** Lose — descending minor */
    function lose() {
        const ctx   = _getCtx();
        const dest  = _master(ctx);
        const t     = ctx.currentTime;
        const notes = [392, 349, 294, 247];
        notes.forEach((f, i) => {
            _osc('sine',     f, t + i * 0.11, 0.28, 0.22, ctx, dest);
            _osc('triangle', f, t + i * 0.11, 0.26, 0.08, ctx, dest);
        });
    }

    /** Notification — iOS-style soft ping (room join, player joins) */
    function notify() {
        const ctx  = _getCtx();
        const dest = _master(ctx);
        const t    = ctx.currentTime;
        _osc('sine', 1318, t,        0.18, 0.20, ctx, dest);
        _osc('sine',  988, t + 0.08, 0.20, 0.18, ctx, dest);
    }

    /** Error — short buzz */
    function error() {
        const ctx  = _getCtx();
        const dest = _master(ctx);
        const t    = ctx.currentTime;
        _osc('sawtooth', 180, t,        0.08, 0.20, ctx, dest);
        _osc('sawtooth', 160, t + 0.06, 0.09, 0.15, ctx, dest);
    }

    /** Screen transition — soft swoosh */
    function swoosh() {
        const ctx  = _getCtx();
        const dest = _master(ctx);
        const t    = ctx.currentTime;
        _freqRamp('sine', 200, 600, t, 0.1, 0.10, ctx, dest);
        _noise(t, 0.08, 0.06, ctx, dest);
    }

    /** Modal open — gentle pop */
    function modalOpen() {
        const ctx  = _getCtx();
        const dest = _master(ctx);
        const t    = ctx.currentTime;
        _freqRamp('sine', 400, 800, t, 0.07, 0.14, ctx, dest);
    }

    /** Modal close */
    function modalClose() {
        const ctx  = _getCtx();
        const dest = _master(ctx);
        const t    = ctx.currentTime;
        _freqRamp('sine', 700, 350, t, 0.07, 0.12, ctx, dest);
    }

    return { tap, cardFlip, gameStart, tick, tickUrgent, timerEnd,
             vote, win, lose, notify, error, swoosh, modalOpen, modalClose };
})();

// ============================================================
// HOOK INTO THE GAME
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

    // ── Generic tap on every primary/secondary/danger button ──
    document.addEventListener('pointerdown', e => {
        const btn = e.target.closest('button, .setting-card, .lang-pill-btn, .vote-btn');
        if (btn) _sfx.tap();
    }, { passive: true });

    // ── Modals ────────────────────────────────────────────────
    const _watchModal = (openId, closeId) => {
        const obs = new MutationObserver(() => {
            const el = document.getElementById(openId);
            if (!el) return;
            if (el.classList.contains('active')) _sfx.modalOpen();
        });
        const el = document.getElementById(openId);
        if (el) obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    };
    _watchModal('edit-modal');
    _watchModal('info-modal');
    _watchModal('password-modal');

    document.getElementById('btn-confirm')       ?.addEventListener('click', _sfx.modalClose);
    document.getElementById('close-info-btn')    ?.addEventListener('click', _sfx.modalClose);
    document.getElementById('password-cancel-btn')?.addEventListener('click', _sfx.modalClose);

    // ── Card flip ─────────────────────────────────────────────
    // Intercept touchstart/mousedown on flip cards (delegated)
    document.addEventListener('mousedown', e => {
        if (e.target.closest('.flip-card')) _sfx.cardFlip();
    }, { passive: true });
    document.addEventListener('touchstart', e => {
        if (e.target.closest('.flip-card')) _sfx.cardFlip();
    }, { passive: true });

    // ── Game start ────────────────────────────────────────────
    document.getElementById('start-game-btn')?.addEventListener('click', () => {
        setTimeout(_sfx.gameStart, 80); // slight delay so tap doesn't clash
    });
    document.getElementById('online-start-btn')?.addEventListener('click', () => {
        setTimeout(_sfx.gameStart, 80);
    });

    // ── Screen transitions — watch .screen.active changes ─────
    let _lastScreen = '';
    const _screenObs = new MutationObserver(() => {
        const active = document.querySelector('.screen.active');
        if (!active || active.id === _lastScreen) return;
        _lastScreen = active.id;

        if (['result-screen'].includes(active.id)) return; // result has its own sounds
        if (active.id !== 'setup-screen') _sfx.swoosh();
    });
    document.querySelectorAll('.screen').forEach(s =>
        _screenObs.observe(s, { attributes: true, attributeFilter: ['class'] })
    );

    // ── Result screen — win / lose ────────────────────────────
    // Patch triggerAnimation (defined in app.js)
    if (typeof triggerAnimation === 'function') {
        const _orig = triggerAnimation;
        window.triggerAnimation = function(type) {
            _orig(type);
            if (type === 'win')  _sfx.win();
            if (type === 'lose') _sfx.lose();
        };
    }

    // ── Timer ticks ───────────────────────────────────────────
    // Patch updateTimerDisplay (defined in app.js)
    if (typeof updateTimerDisplay === 'function') {
        const _origTimer = updateTimerDisplay;
        window.updateTimerDisplay = function() {
            _origTimer();
            if (typeof remainingTime === 'undefined') return;
            if (remainingTime === 0)            _sfx.timerEnd();
            else if (remainingTime <= 10)       _sfx.tickUrgent();
            else if (remainingTime % 1 === 0)   _sfx.tick();
        };
    }

    // ── Vote cast ─────────────────────────────────────────────
    document.getElementById('voting-list')?.addEventListener('click', e => {
        if (e.target.classList.contains('vote-btn') && !e.target.disabled) {
            _sfx.vote();
        }
    });

    // ── Online: room created / player joins ───────────────────
    document.getElementById('create-room-btn')?.addEventListener('click', () => {
        setTimeout(() => {
            // Only play if we actually moved to lobby (no error)
            const lobby = document.getElementById('online-lobby-screen');
            if (lobby?.classList.contains('active')) _sfx.notify();
        }, 600);
    });

    // Watch lobby player list for new players joining
    const lobbyList = document.getElementById('lobby-players-list');
    if (lobbyList) {
        let _prevCount = 0;
        new MutationObserver(() => {
            const count = lobbyList.children.length;
            if (count > _prevCount) _sfx.notify();
            _prevCount = count;
        }).observe(lobbyList, { childList: true });
    }

    // ── Error messages ────────────────────────────────────────
    const _watchError = (id) => {
        const el = document.getElementById(id);
        if (!el) return;
        new MutationObserver(() => {
            if (el.innerText.trim()) _sfx.error();
        }).observe(el, { childList: true, characterData: true, subtree: true });
    };
    _watchError('setup-error');
    _watchError('online-setup-error');
    _watchError('password-error');
});
