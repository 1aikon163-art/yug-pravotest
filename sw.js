// ЮГ-ПРАВО Service Worker • Performance & Offline Cache
const CACHE_NAME = 'yug-pravo-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/initiatives.html',
  '/events.html',
  '/knowledge.html',
  '/about.html',
  '/services.html',
  '/cases.html',
  '/disclosure.html',
  '/contacts.html',
  '/css/styles.css',
  '/css/shared.css',
  '/js/main.js',
  '/js/effects.js',
  '/js/articles-data.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Do not cache heavy videos or external dynamic analytics
  if (event.request.url.endsWith('.mp4')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || networked;
    })
  );
});
