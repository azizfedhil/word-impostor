import { launcherHref } from '../navigation.js';

/**
 * Mount game header: title + back to launcher (no multi-game switcher).
 */
export function mountGameHeader({ title, headerSelector = '#app-header' }) {
    const header = document.querySelector(headerSelector);
    if (!header) return;

    header.innerHTML = `
        <a href="${launcherHref()}" class="game-title-btn game-back-link" style="text-decoration:none;">
            <h1>${title}</h1>
            <span class="game-title-chevron">🎲 ارجع للألعاب</span>
        </a>
    `;
}

export function mountLauncherHeader({ title = '🎲 اختار لعبة' } = {}) {
    const header = document.querySelector('#app-header');
    if (!header) return;
    header.innerHTML = `<h1 style="margin:0;">${title}</h1>`;
}
