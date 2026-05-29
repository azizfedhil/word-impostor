/** @param {string} swPath - path to sw.js relative to current page */
export function registerServiceWorker(swPath = './sw.js') {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register(swPath).catch((err) => console.warn('SW failed:', err));
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            window.location.reload();
        }
    });
}
