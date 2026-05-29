/**
 * Early globals before legacy app.js / online.js load on game pages.
 */
(function () {
    const mode = window.__DAKHEEL_GAME_MODE;
    if (!mode) return;

    window.getCurrentGameMode = function getCurrentGameMode() {
        return window.__DAKHEEL_GAME_MODE;
    };

    window.setGameMode = function setGameMode(m, goSetup) {
        if (m !== window.__DAKHEEL_GAME_MODE) return;
        if (typeof window.__legacySetGameMode === 'function') {
            window.__legacySetGameMode(m, goSetup);
        }
    };

    window.__DAKHEEL_FIXED_MODE = true;
})();
