// Bump this cache name whenever cached app files change.
const CACHE_NAME = 'dakheel-v30';

const ASSETS = [
  './',
  './index.html',
  './style.css',
  './chkobba.css',
  './manifest.json',
  './icon192.png',
  './icon512.png',
  './word list.json',
  './adult_words_data.js',
  './spyfall_tunisia_100_locations.json',
  './sounds.js',
  './app.js',
  './online.js',
  './voice.js',
  './analytics.js',
  './chkobba_logic.js',
  './shared/navigation.js',
  './shared/runtime/bridge.js',
  './shared/bootstrap/game-bootstrap.js',
  './shared/bootstrap/game-scripts.js',
  './shared/ui/screen.js',
  './shared/ui/layout.js',
  './shared/launcher/bootstrap.js',
  './games/chkobba/index.html',
  './games/chkobba/bootstrap.js',
  './games/koul-w-bou3/index.html',
  './games/koul-w-bou3/bootstrap.js',
  './games/shkounou-houa/index.html',
  './games/shkounou-houa/bootstrap.js',
  './games/manash-houni/index.html',
  './games/manash-houni/bootstrap.js',
  './games/sare9-hakem-jalled/index.html',
  './games/sare9-hakem-jalled/bootstrap.js',
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
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
