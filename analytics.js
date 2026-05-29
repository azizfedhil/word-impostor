// ============================================================
// analytics.js — Game Analytics for الدخيل
// Tracks page visits, game sessions, and online activity
// All data is sent to Supabase (anon INSERT only)
// ============================================================

const _analytics = (() => {
    // Reuse the global Supabase client from online.js.
    // Falls back to its own instance if _supa isn't available.
    const SUPA_URL = 'https://rcxaxblhgpauodmcfetb.supabase.co';
    const SUPA_KEY = 'sb_publishable_3xg9qkdYGUoaRdflCW58rg_xRdqg6ox';

    function _client() {
        // typeof guard works on undeclared variables without throwing
        if (typeof _supa !== 'undefined') return _supa;
        if (!window.__anSupa)
            window.__anSupa = window.supabase.createClient(SUPA_URL, SUPA_KEY);
        return window.__anSupa;
    }

    // ── Persistent visitor session ID (survives page reloads) ──
    function _readSid() {
        try { return localStorage.getItem('dk_sid'); }
        catch (_) { return sessionStorage.getItem('dk_sid') || null; }
    }

    function _writeSid(value) {
        try { localStorage.setItem('dk_sid', value); }
        catch (_) {
            try { sessionStorage.setItem('dk_sid', value); }
            catch (_) {}
        }
    }

    let _sid = _readSid();
    if (!_sid) {
        _sid = 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        _writeSid(_sid);
    }

    let _pendingGame  = null;
    let _gameStart    = null;

    // Fire-and-forget: never throw, never block the game
    async function _ins(table, row) {
        try {
            await _client().from(table).insert(row);
        } catch (_) { /* silent */ }
    }

    // ── Detect device type from user agent ────────────────────
    function _deviceType(ua) {
        if (/iPad|Tablet/i.test(ua))  return 'tablet';
        if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
        return 'desktop';
    }

    // ── Detect browser name ───────────────────────────────────
    function _browser(ua) {
        if (/Firefox/i.test(ua))  return 'Firefox';
        if (/Edg/i.test(ua))      return 'Edge';
        if (/Chrome/i.test(ua))   return 'Chrome';
        if (/Safari/i.test(ua))   return 'Safari';
        if (/OPR|Opera/i.test(ua))return 'Opera';
        return 'Other';
    }

    // ── Detect OS ─────────────────────────────────────────────
    function _os(ua) {
        if (/Android/i.test(ua))  return 'Android';
        if (/iPhone|iPad/i.test(ua)) return 'iOS';
        if (/Windows/i.test(ua))  return 'Windows';
        if (/Mac/i.test(ua))      return 'macOS';
        if (/Linux/i.test(ua))    return 'Linux';
        return 'Other';
    }

    // ============================================================
    // PUBLIC API
    // ============================================================

    /** Called once on page load */
    function trackVisit() {
        const ua = navigator.userAgent;
        _ins('analytics_visits', {
            session_id   : _sid,
            user_agent   : ua.slice(0, 250),
            device_type  : _deviceType(ua),
            browser      : _browser(ua),
            os           : _os(ua),
            language     : navigator.language || '',
            screen_width : screen.width,
            screen_height: screen.height,
            timezone     : Intl.DateTimeFormat().resolvedOptions().timeZone || '',
            referrer     : (document.referrer || '').slice(0, 200),
            is_pwa       : (window.matchMedia('(display-mode: standalone)').matches ||
                            window.navigator.standalone === true)
        });
    }

    /** Called when a local game is confirmed started */
    function trackGameStart(cfg) {
        _gameStart   = Date.now();
        _pendingGame = {
            session_id            : _sid,
            player_count          : cfg.playerCount,
            impostor_count        : cfg.impostorCount,
            word_list             : cfg.wordList,
            word                  : cfg.word,
            timer_mins            : cfg.timerMins,
            mode_elimination      : !!cfg.elimination,
            mode_no_hints         : !!cfg.noHints,
            mode_random_impostors : !!cfg.randomImpostors,
            mode_chaos            : !!cfg.chaos,
            mode_all_hints        : !!cfg.allHints
        };
    }

    /** Called when triggerAnimation fires ('win' | 'lose') */
    function trackGameEnd(result) {
        if (!_pendingGame) return;
        const dur = _gameStart ? Math.round((Date.now() - _gameStart) / 1000) : null;
        _ins('analytics_games', { ..._pendingGame, result, duration_secs: dur });
        _pendingGame = null;
        _gameStart   = null;
    }

    /** Called for online room events */
    function trackOnlineEvent(event, roomCode, playerCount, wordList) {
        _ins('analytics_online', {
            session_id  : _sid,
            event,                          // 'room_created' | 'room_joined' | 'game_started'
            room_code   : roomCode,
            player_count: playerCount,
            word_list   : wordList || 'tn'
        });
    }

    return { trackVisit, trackGameStart, trackGameEnd, trackOnlineEvent };
})();


// ============================================================
// DOM HOOKS — wired after page load
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const _activeToggle = id => document.getElementById(id)?.classList.contains('active') || false;

    // ── 1. Track every page visit ─────────────────────────────
    _analytics.trackVisit();

    // ── 2. Local game start ───────────────────────────────────
    // We listen to the button then wait ~250ms for app.js to
    // finish validation and set globals (players, currentWordObj, etc.)
    document.getElementById('start-game-btn')?.addEventListener('click', () => {
        setTimeout(() => {
            // Only fire if the game actually started (not rejected with an error)
            if (!document.getElementById('reveal-screen')?.classList.contains('active')) return;
            _analytics.trackGameStart({
                playerCount    : typeof players         !== 'undefined' ? players.length : 0,
                impostorCount  : typeof players         !== 'undefined' ? players.filter(p => p.isImpostor).length : 0,
                wordList       : typeof currentLang     !== 'undefined' ? currentLang : 'tn',
                word           : typeof currentWordObj  !== 'undefined' ? (currentWordObj?.word || '') : '',
                timerMins      : typeof timerConfig     !== 'undefined' ? timerConfig : 3,
                elimination    : _activeToggle('t-elimination'),
                noHints        : _activeToggle('t-nohint'),
                randomImpostors: _activeToggle('t-random'),
                chaos          : _activeToggle('t-chaos'),
                allHints       : _activeToggle('t-allhint')
            });
        }, 250);
    });

    // ── 3. Game result — wrap triggerAnimation ────────────────
    // Chain-safe: sounds.js already wrapped it in its own DOMContentLoaded
    // (which ran before ours since sounds.js loads first). We wrap the
    // already-wrapped version; both layers execute.
    const _prevTrigger = window.triggerAnimation;
    window.triggerAnimation = function (type) {
        if (_prevTrigger) _prevTrigger(type);
        // Only track local games; online game results come through online events
        if (!window.onlineMode) {
            _analytics.trackGameEnd(type === 'win' ? 'citizens_win' : 'impostors_win');
        }
    };

    // ── 4. Online: room created ───────────────────────────────
    document.getElementById('create-room-btn')?.addEventListener('click', () => {
        // Wait for lobby to be active (Supabase round-trip takes ~1s)
        setTimeout(() => {
            const lobbyActive = document.getElementById('online-lobby-screen')?.classList.contains('active');
            const code = document.getElementById('display-room-code')?.innerText?.trim();
            if (lobbyActive && code && code !== '------') {
                _analytics.trackOnlineEvent('room_created', code, 1,
                    typeof currentLang !== 'undefined' ? currentLang : 'tn');
            }
        }, 1500);
    });

    // ── 5. Online: player joined ──────────────────────────────
    document.getElementById('join-room-btn')?.addEventListener('click', () => {
        setTimeout(() => {
            const lobbyActive = document.getElementById('online-lobby-screen')?.classList.contains('active');
            const code = document.getElementById('display-room-code')?.innerText?.trim();
            if (lobbyActive && code && code !== '------') {
                _analytics.trackOnlineEvent('room_joined', code, 1,
                    typeof currentLang !== 'undefined' ? currentLang : 'tn');
            }
        }, 1500);
    });

    // ── 6. Online: host started the game ─────────────────────
    document.getElementById('online-start-btn')?.addEventListener('click', () => {
        const code        = document.getElementById('display-room-code')?.innerText?.trim();
        const playerCount = document.getElementById('lobby-players-list')?.children.length || 0;
        if (code && code !== '------') {
            _analytics.trackOnlineEvent('game_started', code, playerCount,
                typeof currentLang !== 'undefined' ? currentLang : 'tn');
        }
    });
});
