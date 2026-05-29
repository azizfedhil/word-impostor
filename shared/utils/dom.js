export function escapeHtml(value = '') {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
    });
}

/** Load classic (non-module) scripts in order relative to site root. */
export async function loadClassicScripts(paths, rootPrefix = '../../') {
    for (const p of paths) {
        await loadScript(rootPrefix + p.replace(/^\//, ''));
    }
}

/** Run callback when DOM is ready (works after dynamic script injection). */
export function onDomReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
        fn();
    }
}
