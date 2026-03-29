const CACHE_NAME = 'mantap-ksc-Sv1';
const urlsToCache = [
  '/MANTAP_S1/',
  '/MANTAP_S1/index.html',
  '/MANTAP_S1/manifest.json',
  '/MANTAP_S1/assets/icons/ptksc192.ico',
  '/MANTAP_S1/assets/icons/ptksc256.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

/*
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
*/

self.addEventListener('fetch', event => {
  // 🚀 JURUS BYPASS: Jika request menuju ke Google Script, LANGSUNG tembak ke internet.
  // Jangan biarkan Service Worker (cache) ikut campur.
  if (event.request.url.includes("script.google.com")) {
    return; // Keluar dari listener, biarkan browser menangani secara normal
  }

  // 📦 LOGIKA CACHE BIASA: Untuk file HTML, CSS, JS, dan Icons kamu
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
