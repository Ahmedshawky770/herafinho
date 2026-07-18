/* Harfino service worker (hand-written for Next 16 + Turbopack).
   Provides offline fallback + runtime caching without next-pwa. */
const VERSION = 'v1';
const STATIC_CACHE = `harfino-static-${VERSION}`;
const RUNTIME_CACHE = `harfino-runtime-${VERSION}`;
const OFFLINE_URL = '/_offline';

const PRECACHE = [
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

const STATIC_ASSET_RE = /\.(?:js|css|woff2?|png|jpeg|jpg|gif|svg|webp|ico|ttf)$/i;
const IMAGE_HOST_RE = /amazonaws\.com$|googleusercontent\.com$/i;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    // Cross-origin (S3 images): cache-first, never block the network.
    if (IMAGE_HOST_RE.test(url.hostname)) {
      event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    }
    return;
  }

  // Network-first for navigations, fall back to cache then offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((r) => r || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Cache-first for same-origin static assets.
  if (STATIC_ASSET_RE.test(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Stale-while-revalidate for same-origin GET API/data responses.
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res.ok) {
      const copy = res.clone();
      caches.open(cacheName).then((c) => c.put(request, copy));
    }
    return res;
  } catch {
    return cached ?? Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(cacheName).then((c) => c.put(request, copy));
      }
      return res;
    })
    .catch(() => cached);
  return cached ?? network;
}
