/**
 * LocalKart Service Worker v3.0
 * Provides robust offline fallback, asset caching, and network resilience
 * Strict privacy: Never caches credentials, authentication tokens, or payment APIs.
 */

const CACHE_NAME = 'localkart-static-v3.0.0';
const OFFLINE_FALLBACK = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.svg',
];

// URLs that must NEVER be cached by the service worker
const SENSITIVE_URL_PATTERNS = [
  /\/api\/v1\/orders/,
  /\/api\/v1\/auth/,
  /\/api\/v1\/payments/,
  /\/api\/v1\/owner\/khata/,
  /\/api\/v1\/owner\/expenses/,
  /\/login/,
  /\/register/,
];

// Install Event: Precaches App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Purges Stale Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Message Event: Allows UI to trigger instant skipWaiting update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch Event: Intelligent Strategy Dispatcher
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Skip non-GET requests (mutations like POST, PUT, DELETE must go straight to network)
  if (req.method !== 'GET') {
    return;
  }

  // 2. Do not cache sensitive endpoints
  const isSensitive = SENSITIVE_URL_PATTERNS.some((pattern) => pattern.test(url.pathname));
  if (isSensitive) {
    return; // allow browser default network fetch
  }

  // 3. Navigation requests (HTML documents) -> Network-First with Offline.html fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          // If valid response, clone into cache
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(async () => {
          // Fallback to cache or offline page
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match(OFFLINE_FALLBACK);
          return fallback || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        })
    );
    return;
  }

  // 4. Static assets (JS, CSS, Images, Fonts) -> Stale-While-Revalidate or Cache-First
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
     url.pathname.startsWith('/icons/') ||
     url.pathname.endsWith('.svg') ||
     url.pathname.endsWith('.png') ||
     url.pathname.endsWith('.jpg') ||
     url.pathname.endsWith('.woff2'))
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) {
          // Revalidate in background
          fetch(req).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkRes));
            }
          }).catch(() => {});
          return cached;
        }
        return fetch(req).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // 5. Default: Network with Cache Fallback for public CDN resources (fonts, leaflet)
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com') || url.origin.includes('unpkg.com')) {
    event.respondWith(
      caches.match(req).then((cached) => {
        return (
          cached ||
          fetch(req).then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return response;
          }).catch(() => cached)
        );
      })
    );
  }
});
