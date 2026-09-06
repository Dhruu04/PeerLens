// PeerLens Lightweight Offline Caching Service Worker
const CACHE_NAME = 'peerlens-offline-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clear all previous caches to prevent stale script/module collisions
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http://') && !event.request.url.startsWith('https://')) return;

  const url = new URL(event.request.url);

  // Completely bypass service worker on local development environments or for development modules
  if (
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.port === '5173' ||
    url.port === '3000' ||
    url.pathname.includes('/@') ||
    url.pathname.includes('/src/') ||
    url.pathname.includes('node_modules')
  ) {
    return;
  }

  // Production caching for static build assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then((response) => {
        if (
          response &&
          response.status === 200 &&
          (url.pathname.startsWith('/assets/') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg'))
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return response;
      }).catch(async () => {
        if (event.request.mode === 'navigate') {
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
        }

        const offlineFallback = await caches.match(event.request);
        if (offlineFallback) return offlineFallback;

        return new Response('Network offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});
