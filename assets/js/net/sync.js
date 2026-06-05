'use strict';

// ============================================================
// NET — Sync / Supabase Init
// Initializes the Supabase client and declares all shared
// online constants and mutable globals that net/room.js and
// the game online modules depend on.
//
// Must be loaded BEFORE net/room.js and any game online file.
// Load order:
//   core/* → game_registry → games/*/logic →
//   games/coup/coup_online → games/chkobba/chkobba_online →
//   [THIS FILE] → net/auth → net/friends → net/room → online → shared → *_init
// ============================================================

// ── Supabase client ──────────────────────────────────────────
// Replace these values with your project's URL and anon key.
// Find them at: https://supabase.com/dashboard → Project Settings → API
const SUPABASE_URL  = 'https://rcxaxblhgpauodmcfetb.supabase.co';
const SUPABASE_ANON = 'sb_publishable_3xg9qkdYGUoaRdflCW58rg_xRdqg6ox';

// supabase is the global from the CDN script tag (supabase-js UMD build)
const _supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
window._supa = _supa;

// ── Persistent identity keys ─────────────────────────────────
const ONLINE_PLAYER_ID_KEY = 'dakheel_player_id';
const ONLINE_NAME_KEY      = 'dakheel_online_name';
const ONLINE_LAST_ROOM_KEY = 'dakheel_last_room';

window.ONLINE_PLAYER_ID_KEY = ONLINE_PLAYER_ID_KEY;
window.ONLINE_NAME_KEY      = ONLINE_NAME_KEY;
window.ONLINE_LAST_ROOM_KEY = ONLINE_LAST_ROOM_KEY;

// ── Server-time sync state ───────────────────────────────────
// Used by _syncServerTime() and _syncedNow() in net/room.js
let _serverTimeOffset = 0;
let _hasSynced        = false;

window._serverTimeOffset = _serverTimeOffset;
window._hasSynced        = _hasSynced;

// ── Player identity ──────────────────────────────────────────
let _myName = '';
try { _myName = localStorage.getItem(ONLINE_NAME_KEY) || ''; } catch(_) {}
window._myName = _myName;

let _myId = null;
try { _myId = localStorage.getItem(ONLINE_PLAYER_ID_KEY) || sessionStorage.getItem(ONLINE_PLAYER_ID_KEY); } catch(_) {}
if (!_myId) _myId = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

function _storeMyId(id) {
    _myId = id;
    try { sessionStorage.setItem(ONLINE_PLAYER_ID_KEY, id); } catch(_) {}
    try { localStorage.setItem(ONLINE_PLAYER_ID_KEY, id); } catch(_) {}
}
_storeMyId(_myId);

function _saveOnlineName(name) {
    const clean = (name || '').trim();
    if (!clean) return;
    _myName = clean;
    window._myName = clean;
    try { localStorage.setItem(ONLINE_NAME_KEY, clean); } catch(_) {}
}

function _restoreOnlineName() {
    try {
        const saved = localStorage.getItem(ONLINE_NAME_KEY);
        const input = document.getElementById('online-player-name');
        if (saved && input && !input.value) input.value = saved;
        const code = localStorage.getItem(ONLINE_LAST_ROOM_KEY);
        const codeInput = document.getElementById('room-code-input');
        if (code && codeInput && !codeInput.value) codeInput.value = code;
    } catch(_) {}
}

window._myId = _myId;
window._storeMyId = _storeMyId;
window._saveOnlineName = _saveOnlineName;
window._restoreOnlineName = _restoreOnlineName;

// ── Game Mode Helpers ────────────────────────────────────────
function _getRoomGameMode(room) {
    return ['thief','spyfall','coup','chkobba'].includes(room?.config?.gameMode) ? room.config.gameMode : 'impostor';
}
function _isThiefRoom(room) { return _getRoomGameMode(room) === 'thief'; }
function _isSpyfallRoom(room) { return _getRoomGameMode(room) === 'spyfall'; }
function _isCoupRoom(room) { return _getRoomGameMode(room) === 'coup'; }
function _isChkobbaRoom(room) { return _getRoomGameMode(room) === 'chkobba'; }

window._getRoomGameMode = _getRoomGameMode;
window._isThiefRoom     = _isThiefRoom;
window._isSpyfallRoom   = _isSpyfallRoom;
window._isCoupRoom      = _isCoupRoom;
window._isChkobbaRoom   = _isChkobbaRoom;
