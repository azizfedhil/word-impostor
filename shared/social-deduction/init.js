/**
 * Shared social-deduction entry (impostor, thief, spyfall).
 * Each game page sets a fixed mode and loads app.js + online.js with mode plugins.
 */
import { THIEF_PLUGIN } from './plugins/thief.js';
import { SPYFALL_PLUGIN } from './plugins/spyfall.js';
import { IMPOSTOR_PLUGIN } from './plugins/impostor.js';

const PLUGINS = {
    impostor: IMPOSTOR_PLUGIN,
    thief: THIEF_PLUGIN,
    spyfall: SPYFALL_PLUGIN,
};

export function getSocialDeductionPlugin(mode) {
    return PLUGINS[mode] || IMPOSTOR_PLUGIN;
}

/**
 * Called from game bootstrap after legacy scripts load.
 */
export function initSocialDeductionGame({ mode, title }) {
    const plugin = getSocialDeductionPlugin(mode);
    window.__DAKHEEL_SOCIAL_PLUGIN = plugin;

    document.body.classList.add(`social-mode-${mode}`);

    if (plugin.bodyClass) {
        document.body.classList.add(plugin.bodyClass);
    }

    const h1 = document.querySelector('header h1');
    if (h1 && title) h1.innerText = title;

    if (typeof window.__legacyApplyGameModeUI === 'function') {
        window.__legacyApplyGameModeUI();
    }
}
