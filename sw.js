/* Service worker: network-first with cache fallback.
   Bump CACHE_NAME whenever assets change so clients pick up the new version. */
var CACHE_NAME = 'vbj-portfolio-v16';
var ASSETS = [
  '/',
  '/index.html',
  '/404.html',
  '/manifest.json',
  '/assets/css/main.css',
  '/assets/js/main.js',
  '/assets/js/analytics.js',
  '/assets/img/favicon.svg',
  '/assets/img/og-image.svg',
  '/data/data.json'
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
  // Only handle same-origin GET requests; leave analytics/ads/CDNs alone.
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res.ok) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(e.request, clone); });
      }
      return res;
    }).catch(function () {
      return caches.match(e.request).then(function (hit) {
        return hit || caches.match('/404.html');
      });
    })
  );
});
