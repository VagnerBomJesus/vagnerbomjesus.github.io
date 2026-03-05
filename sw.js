var CACHE_NAME = 'vbj-portfolio-v2';
var ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/data.json',
  '/manifest.json',
  '/404.html',
  '/ads-init.js',
  '/analytics.js'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) { return n !== CACHE_NAME; })
          .map(function (n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  e.respondWith(
    fetch(e.request).then(function (res) {
      // Update cache with fresh response
      if (res.ok && e.request.method === 'GET') {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(e.request, clone);
        });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});
