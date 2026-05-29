import { mountGameHeader } from '../ui/layout.js';
import { installScreenGlobals } from '../ui/screen.js';
import { registerServiceWorker } from './register-sw.js';
import { resolveRoomDeepLink, stripRoomFromUrl } from '../navigation.js';
import { loadClassicScripts } from '../utils/dom.js';
import { GAME_SCRIPTS } from './game-scripts.js';

/**
 * Initialize a fixed-mode game entry page.
 * @param {object} config
 * @param {string} config.slug
 * @param {string} config.gameMode
 * @param {string} config.title
 * @param {string[]} config.scripts - classic scripts relative to repo root
 * @param {() => Promise<void>} [config.afterScripts]
 * @param {boolean} [config.onlineOnly]
 */
async function bootLegacyRuntime() {
    if (typeof window.__dakheelBootApp === 'function') {
        await window.__dakheelBootApp();
    }
    if (typeof window.__dakheelBootOnlineExtras === 'function') {
        window.__dakheelBootOnlineExtras();
    }
    if (typeof window.__dakheelBootAnalytics === 'function') {
        await window.__dakheelBootAnalytics();
    }
}

export async function bootstrapGamePage(config) {
    const { slug, gameMode, title, scripts = [], afterScripts, onlineOnly = false } = config;

    const rootPrefix = '../../';

    window.__DAKHEEL_GAME_MODE = gameMode;
    window.__DAKHEEL_GAME_SLUG = slug;
    window.__DAKHEEL_ONLINE_ONLY = onlineOnly;
    window.__DAKHEEL_ASSET_ROOT = rootPrefix;

    document.body.classList.add(`game-${slug}`, `game-mode-${gameMode}`, `game-${gameMode}`);

    mountGameHeader({ title });
    installScreenGlobals();
    registerServiceWorker('../../sw.js');

    const scriptList = scripts.length ? scripts : GAME_SCRIPTS[gameMode] || GAME_SCRIPTS[slug] || GAME_SCRIPTS.impostor;
    await loadClassicScripts(['shared/runtime/bridge.js', ...scriptList], rootPrefix);

    if (typeof afterScripts === 'function') {
        await afterScripts();
    }

    await bootLegacyRuntime();

    if (typeof window._fetchRoom === 'function') {
        const { code, redirected } = await resolveRoomDeepLink({
            expectedGameMode: gameMode,
            fetchRoom: window._fetchRoom,
        });
        if (!redirected && code && typeof window._checkAutoJoin === 'function') {
            await window._checkAutoJoin();
        }
        if (!redirected && code) stripRoomFromUrl();
    }
}
