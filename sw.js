const CACHE_NAME = 'chkounou-hu-v1.2';
const ASSETS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/css/chkobba.css',
  './assets/js/shared.js',
  './assets/js/online.js',
  './assets/js/sounds.js',
  './assets/js/core/state.js',
  './assets/js/core/storage.js',
  './assets/js/core/i18n.js',
  './assets/js/game_registry.js',
  './games/impostor.html',
  './games/spyfall.html',
  './games/coup.html',
  './games/chkobba.html',
  './assets/coup/contessa.png',
  './assets/coup/contessa512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Fallback for offline if needed
      });
    })
  );
});
