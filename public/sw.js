const CACHE_NAME = 'sylvia-cache-v3';
const OFFLINE_URL = '/offline.html';

// Only precache truly static offline fallback assets - NEVER dynamic Next.js HTML routes
const STATIC_ASSETS = [
  OFFLINE_URL,
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting legacy cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Never intercept API requests, authentication routes, or Next.js HMR
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next/webpack-hmr')) {
    return;
  }

  // For page navigations (HTML documents): NETWORK FIRST
  // Ensures fresh HTML and valid chunk references are always loaded from the server when online
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedOffline = await cache.match(OFFLINE_URL);
        return cachedOffline || new Response('Offline', { 
          status: 503, 
          headers: { 'Content-Type': 'text/plain' } 
        });
      })
    );
    return;
  }

  // For static assets (CSS, JS, fonts, images), try network first, falling back to cache if present
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful immutable static assets
        if (response.status === 200 && url.pathname.startsWith('/_next/static/')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response('', { status: 408 });
      })
  );
});
