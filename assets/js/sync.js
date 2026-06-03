'use strict';

// ============================================================
// NET — Sync
// Server time synchronisation and synced clock.
// Extracted from online.js Phase 3.
//
// Depends on: _supa (must be initialised before this runs —
//   kept in online.js because the Supabase client is shared)
// Exposes:
//   window._syncedNow()  — returns server-corrected ms timestamp
//   window._syncServerTime() — manual re-sync (called internally)
// ============================================================

// These variables are declared in online.js (shared scope).
// This module only wraps the logic; see online.js for declarations
// of _serverTimeOffset and _hasSynced.

// NOTE: Because all <script defer> tags share the same global scope
// and online.js declares _serverTimeOffset/_hasSynced as let vars,
// those vars are already accessible here.  If you ever split into
// ES modules, move the declarations into this file.

async function _syncServerTime() {
    try {
        const before = performance.now();
        const { data: serverTime, error } = await _supa.rpc('get_server_time');
        if (error) throw error;
        const after = performance.now();
        const latency = (after - before) / 2;
        const adjustedServerTime = Number(serverTime) + latency;
        const newOffset = adjustedServerTime - Date.now();
        if (_hasSynced) {
            _serverTimeOffset = (_serverTimeOffset * 0.9) + (newOffset * 0.1);
        } else {
            _serverTimeOffset = newOffset;
            _hasSynced = true;
        }
        console.log('[timer-sync] offset:', Math.round(_serverTimeOffset), 'latency:', Math.round(latency));
    } catch (e) {
        console.error('[timer-sync] failed:', e);
    }
}

function _syncedNow() {
    return Date.now() + _serverTimeOffset;
}

// Initial sync + periodic re-sync
_syncServerTime();
setInterval(_syncServerTime, 30000);

// Expose for shared.js (_now() helper) and voice.js
window._syncedNow      = _syncedNow;
window._syncServerTime = _syncServerTime;
