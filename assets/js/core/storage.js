'use strict';

// ============================================================
// CORE — Storage
// IndexedDB-backed settings persistence.
// Reads/writes use the GameState API, not bare globals.
// ============================================================

const _dbPromise = new Promise((resolve) => {
    try {
        const req = indexedDB.open('DakheelLocalDB', 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore('settingsStore');
        req.onsuccess = () => resolve(req.result);
        req.onerror  = () => resolve(null);
    } catch (e) { resolve(null); }
});

// Helper: read a toggle's active state from the DOM
function _togActive(id) {
    return document.getElementById(id)?.classList.contains('active') || false;
}
window._togActive = _togActive;

async function saveSettings() {
    const settings = {
        players:        Array.from(document.querySelectorAll('.player-input')).map(i => i.value),
        impostors:      GameState.getImpostorConfig(),
        timer:          GameState.getTimerConfig(),
        lang:           GameState.getLang(),
        randomImpostors: _togActive('t-random'),
        chaos:           _togActive('t-chaos'),
        elimination:     _togActive('t-elimination'),
        noHints:         _togActive('t-nohint'),
        allCorrect:      _togActive('t-allhint'),
    };
    try {
        const db = await _dbPromise;
        if (!db) return;
        db.transaction('settingsStore', 'readwrite')
          .objectStore('settingsStore')
          .put(settings, 'game_settings');
    } catch (e) {}
}

async function loadSettings() {
    try {
        const db = await _dbPromise;
        if (!db) return null;
        return new Promise(resolve => {
            const req = db.transaction('settingsStore', 'readonly')
                          .objectStore('settingsStore')
                          .get('game_settings');
            req.onsuccess = () => resolve(req.result);
            req.onerror   = () => resolve(null);
        });
    } catch (e) { return null; }
}

async function clearSettings() {
    try {
        const db = await _dbPromise;
        if (!db) return;
        db.transaction('settingsStore', 'readwrite')
          .objectStore('settingsStore')
          .delete('game_settings');
    } catch (e) {}
}

// Expose globally
window.saveSettings  = saveSettings;
window.loadSettings  = loadSettings;
window.clearSettings = clearSettings;

// Keep the old dbPromise reference alive for any code that still
// accesses it directly (e.g. the reset handler in shared.js).
window.dbPromise = _dbPromise;

// Helper: set a toggle's active state on the DOM
// (companion to _togActive; used by shared.js checkRules and initSharedSetup)
function _togSet(id, active) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('active', !!active);
}
window._togSet = _togSet;
