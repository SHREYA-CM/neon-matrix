// public/sw.js
const CACHE_NAME = 'neon-matrix-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css'
];

// Install Event - Caching basic app shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clearing old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic Network-First Strategy for offline play
self.addEventListener('fetch', (e) => {
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Clone the response and save to cache dynamically
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          if (e.request.method === 'GET' && e.request.url.startsWith(self.location.origin)) {
            cache.put(e.request, resClone);
          }
        });
        return res;
      })
      .catch(() => caches.match(e.request)) // If offline, serve from cache
  );
});