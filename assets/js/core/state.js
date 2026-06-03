'use strict';

// ============================================================
// CORE — State
// Centralized, controlled state for the platform.
// Games read/write state through these APIs, not bare globals.
//
// MIGRATION NOTE: The old bare globals (players, currentLang,
// etc.) are still exposed on window for backward compatibility
// with online.js and game files that haven't been migrated yet.
// As each file migrates, the window.* aliases below can be
// removed one by one.
// ============================================================

// ── Platform state ────────────────────────────────────────────
let _currentLang        = 'tn';
let _x18Unlocked        = false;
let _currentGameMode    = 'impostor';

// ── Shared game-lobby state ───────────────────────────────────
let _players            = [];
let _currentWordObj     = null;
let _timerInterval      = null;
let _remainingTime      = 0;
let _isEliminationMode  = false;
let _noHintsMode        = false;
let _currentRevealIndex = 0;
let _impostorConfig     = 1;
let _timerConfig        = 3;
let _playerCount        = 0;

// ── Storage keys ─────────────────────────────────────────────
const X18_REMEMBER_KEY  = 'dakheel_x18_unlocked';
const GAME_MODE_KEY     = 'dakheel_game_mode';

// ── Game-mode metadata registry ──────────────────────────────
// Each game registers its own metadata via registerGame().
// This replaces the hard-coded gameModes object in shared.js.
const _gameModes = {
    impostor: { title: '🕵️‍♂️ شكونو هو؟',      start: '🚀 انافا',            online: '🌐 العب أونلاين مع أصحابك' },
    spyfall:  { title: 'ماناش هوني',            start: '🚀 وزّع الكوارط',     online: '🌐 العب أونلاين مع أصحابك' },
    coup:     { title: '👑 كول وبوّع',           start: '🚀 ابدا الكول',       online: '🌐 العب أونلاين مع أصحابك' },
    chkobba:  { title: '🃏 شكبّة',              start: '🚀 ابدا الشكبّة',     online: '🌐 العب أونلاين مع أصحابك' },
};

// ─────────────────────────────────────────────────────────────
// Public getters / setters
// ─────────────────────────────────────────────────────────────

function getLang()              { return _currentLang; }
function setLang(lang)          { _currentLang = lang; }

function isX18Unlocked()        { return _x18Unlocked; }
function _getX18Unlocked()      { return _x18Unlocked; }
function setX18Unlocked(val)    { _x18Unlocked = !!val; }

function getCurrentGameMode()   { return _currentGameMode; }
function setCurrentGameMode(m)  {
    _currentGameMode = ['impostor','spyfall','coup','chkobba'].includes(m) ? m : 'impostor';
    try { localStorage.setItem(GAME_MODE_KEY, _currentGameMode); } catch(_) {}
}

function getPlayers()           { return _players; }
function setPlayers(arr)        { _players = Array.isArray(arr) ? arr : []; }

function getCurrentWordObj()    { return _currentWordObj; }
function setCurrentWordObj(obj) { _currentWordObj = obj; }

function getTimerInterval()     { return _timerInterval; }
function setTimerInterval(id)   { _timerInterval = id; }

function getRemainingTime()     { return _remainingTime; }
function setRemainingTime(t)    { _remainingTime = t; }

function isEliminationMode()    { return _isEliminationMode; }
function _getEliminationMode()  { return _isEliminationMode; }
function setEliminationMode(v)  { _isEliminationMode = !!v; }

function isNoHintsMode()        { return _noHintsMode; }
function _getNoHintsMode()      { return _noHintsMode; }
function setNoHintsMode(v)      { _noHintsMode = !!v; }

function getCurrentRevealIndex()     { return _currentRevealIndex; }
function setCurrentRevealIndex(i)    { _currentRevealIndex = i; }
function incrementRevealIndex()      { _currentRevealIndex++; }

function getImpostorConfig()    { return _impostorConfig; }
function setImpostorConfig(n)   { _impostorConfig = n; }

function getTimerConfig()       { return _timerConfig; }
function setTimerConfig(n)      { _timerConfig = n; }

function getPlayerCount()       { return _playerCount; }
function setPlayerCount(n)      { _playerCount = n; }
function incrementPlayerCount() { _playerCount++; }

function getGameMeta(mode)      { return _gameModes[mode || _currentGameMode] || _gameModes.impostor; }

// ─────────────────────────────────────────────────────────────
// Persistence helpers
// ─────────────────────────────────────────────────────────────
function rememberX18Unlock()      { try { localStorage.setItem(X18_REMEMBER_KEY, '1'); } catch (_) {} }
function hasRememberedX18Unlock() { try { return localStorage.getItem(X18_REMEMBER_KEY) === '1'; } catch (_) { return false; } }

// ─────────────────────────────────────────────────────────────
// Expose public API globally
// ─────────────────────────────────────────────────────────────

// ── Backward-compat exports ───────────────────────────────────
// gameModes was previously a global const in shared.js.
// Expose it for any code that still reads window.gameModes directly.
window.gameModes = Object.fromEntries(
    Object.keys(_gameModes).map(k => [k, _gameModes[k]])
);
window.GameState = {
    // Lang
    getLang, setLang,
    isX18Unlocked, setX18Unlocked,
    // Game mode
    getCurrentGameMode, setCurrentGameMode, getGameMeta,
    // Players & round
    getPlayers, setPlayers,
    getCurrentWordObj, setCurrentWordObj,
    getTimerInterval, setTimerInterval,
    getRemainingTime, setRemainingTime,
    isEliminationMode, setEliminationMode,
    isNoHintsMode, setNoHintsMode,
    getCurrentRevealIndex, setCurrentRevealIndex, incrementRevealIndex,
    getImpostorConfig, setImpostorConfig,
    getTimerConfig, setTimerConfig,
    getPlayerCount, incrementPlayerCount, setPlayerCount,
    // Persistence
    rememberX18Unlock, hasRememberedX18Unlock,
    GAME_MODE_KEY, X18_REMEMBER_KEY,
};

// ─────────────────────────────────────────────────────────────
// Backward-compatibility: expose old bare globals as live
// proxies that read/write from the state module. Code that
// still uses `players = [...]` or `currentLang = 'x18'` will
// continue to work without changes.
// ─────────────────────────────────────────────────────────────
// Guard against re-definition errors when state.js is loaded more than once
// (e.g. after a soft navigation). Each property is only defined if it hasn't
// been set yet, or if it was previously defined as configurable.
[
    ['currentLang',        getLang,              setLang             ],
    ['x18Unlocked',        _getX18Unlocked,      setX18Unlocked      ],
    ['currentGameMode',    getCurrentGameMode,   setCurrentGameMode  ],
    ['players',            getPlayers,           setPlayers          ],
    ['currentWordObj',     getCurrentWordObj,    setCurrentWordObj   ],
    ['timerInterval',      getTimerInterval,     setTimerInterval    ],
    ['remainingTime',      getRemainingTime,     setRemainingTime    ],
    ['isEliminationMode',  _getEliminationMode,  setEliminationMode  ],
    ['noHintsMode',        _getNoHintsMode,      setNoHintsMode      ],
    ['currentRevealIndex', getCurrentRevealIndex,setCurrentRevealIndex],
    ['impostorConfig',     getImpostorConfig,    setImpostorConfig   ],
    ['timerConfig',        getTimerConfig,       setTimerConfig      ],
    ['playerCount',        getPlayerCount,       setPlayerCount      ],
].forEach(([key, getter, setter]) => {
    const existing = Object.getOwnPropertyDescriptor(window, key);
    if (!existing || existing.configurable) {
        Object.defineProperty(window, key, {
            get: getter, set: setter, enumerable: true, configurable: true
        });
    }
});

// Also expose getCurrentGameMode as a standalone function (used by online.js)
window.getCurrentGameMode = getCurrentGameMode;

// Expose persistence helpers as bare globals (used by shared.js and storage.js)
window.GAME_MODE_KEY          = GAME_MODE_KEY;
window.hasRememberedX18Unlock = hasRememberedX18Unlock;
window.rememberX18Unlock      = rememberX18Unlock;
