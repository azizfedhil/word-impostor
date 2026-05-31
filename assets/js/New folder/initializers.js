/**
 * Initializers for each game mode.
 * These are called when the respective game HTML file is loaded.
 */

function initImpostor() {
    console.log("Initializing Impostor game...");
    _setGameMode('impostor');
}

function initHakem() {
    console.log("Initializing Thief (Hakem) game...");
    _setGameMode('thief');
}

function initSpyfall() {
    console.log("Initializing Spyfall game...");
    _setGameMode('spyfall');
}

function initCoup() {
    console.log("Initializing Coup game...");
    _setGameMode('coup');
}

function initChkobba() {
    console.log("Initializing Chkobba game...");
    _setGameMode('chkobba');
}

/**
 * Internal helper to set game mode and navigate to setup screen.
 * Since the app.js is likely handling the actual logic, we try to 
 * interface with the globals it sets.
 */
function _setGameMode(mode) {
    localStorage.setItem('dakheel_game_mode', mode);
    
    // If setGameMode exists (from app.js), call it
    if (typeof window.setGameMode === 'function') {
        window.setGameMode(mode);
    } else {
        // Fallback: Try to find the button and click it to trigger logic in app.js
        const btn = document.querySelector(`.mode-choice-card[data-game-mode="${mode}"]`);
        if (btn) {
            btn.click();
        }
    }
}
