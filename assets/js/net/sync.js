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
//   [THIS FILE] → net/room → online → shared → *_init
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
// _myId is generated/restored in net/room.js after this file loads.
// Declare it here so room.js can assign to it without a ReferenceError.
let _myId = null;
window._myId = _myId;
