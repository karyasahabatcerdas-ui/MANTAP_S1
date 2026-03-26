const CACHE_NAME = 'mantap-ksc-Sv1';
const urlsToCache = [
  '/MANTAP_S1/',
  '/MANTAP_S1/index.html',
  '/MANTAP_S1/manifest.json',
  '/MANTAP_S1/icon-192.png',
  '/MANTAP_S1/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
