// Bump this cache name whenever cached app files change.
const CACHE_NAME = 'dakheel-v18';

// All files to be cached for offline use
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon192.png',
  './icon512.png',
  './word list.json',
  './adult_words_data.js',
  './sounds.js',
  './online.js',
  './voice.js',
  './analytics.js'
];

// Install: Cache the files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: Delete old caches (v1, v2)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: Network First, then Cache (Prevents aggressive Safari caching of HTML)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
