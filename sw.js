// Bump this cache name whenever cached app files change.
const CACHE_NAME = 'dakheel-v60';

// All files to be cached for offline use
const ASSETS = [
  './',
  './index.html',
  './assets/css/style.css',
  './assets/css/chkobba.css',
  './assets/js/app.js',
  './assets/js/main.js',
  './manifest.json',
  './assets/images/icon192.png',
  './assets/images/icon512.png',
  './assets/images/word list.json',
  './assets/js/adult_words_data.js',
  './assets/images/spyfall_tunisia_100_locations.json',
  './assets/js/sounds.js',
  './assets/js/online.js',
  './assets/js/voice.js',
  './assets/js/analytics.js',
  './assets/coup/duke.png',
  './assets/coup/duke512.png',
  './assets/coup/assassin.png',
  './assets/coup/assassin512.png',
  './assets/coup/contessa.png',
  './assets/coup/contessa512.png',
  './assets/coup/ambassador.png',
  './assets/coup/ambassador512.png',
  './assets/coup/captain.png',
  './assets/coup/captain512.png',
  './assets/coup/how-to-play.txt',
  './games/impostor.html',
  './games/thief.html',
  './games/spyfall.html',
  './games/coup.html',
  './games/chkobba.html'
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
