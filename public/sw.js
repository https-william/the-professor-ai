const CACHE_NAME = 'professor-v5';
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/favicon.ico',
  '/site.webmanifest',
  '/logo.svg',
  '/dashboard',
  '/create',
  '/library',
  '/hub'
];

// Maximum dynamic items to store in cache on 1GB RAM / budget devices
const MAX_DYNAMIC_CACHE_ITEMS = 50;
// 15-second timeout for navigation requests to accommodate cold-starts/flaky networks
const NAVIGATION_TIMEOUT_MS = 15000;

// In-memory request de-duplication map to prevent 2G connection storms
const activeRequests = new Map();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW: Some static assets failed to cache', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * LRU Cache Cleanup for 1GB RAM / storage-constrained devices
 */
async function enforceCacheQuota() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    if (keys.length > MAX_DYNAMIC_CACHE_ITEMS) {
      // Delete older dynamic requests beyond the static assets
      const dynamicKeys = keys.filter(req => !STATIC_ASSETS.includes(new URL(req.url).pathname));
      const itemsToDelete = dynamicKeys.slice(0, dynamicKeys.length - MAX_DYNAMIC_CACHE_ITEMS);
      for (const req of itemsToDelete) {
        await cache.delete(req);
      }
    }
  } catch (e) {
    console.warn('SW Quota Cleanup Error:', e);
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // 1. Bypass Service Worker entirely for Localhost dev server to prevent caching traps
  if (url.hostname === 'localhost') return;

  // 2. Bypass WebSockets, SSE streams, and Range requests (WASM/media byte-resumes)
  if (
    event.request.headers.get('Upgrade') === 'websocket' ||
    event.request.headers.get('Accept')?.includes('text/event-stream') ||
    event.request.headers.has('range')
  ) {
    return;
  }

  // 3. API requests — network only, no cache, with offline JSON fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'offline', message: 'The Professor is operating in offline mode.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // 4. Static, media, and document assets — stale-while-revalidate with de-duplication
  if (url.pathname.startsWith('/_next/static/') || url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|pdf|mp4|webm|mov|mp3|wav|ogg|json|webmanifest)$/i)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchKey = event.request.url;
        if (!activeRequests.has(fetchKey)) {
          const fetchPromise = fetch(event.request).then((networkResponse) => {
            activeRequests.delete(fetchKey);
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone);
                enforceCacheQuota();
              });
            }
            return networkResponse;
          }).catch(() => {
            activeRequests.delete(fetchKey);
            return cached || new Response('', { status: 503, statusText: 'Offline' });
          });
          activeRequests.set(fetchKey, fetchPromise);
        }
        return cached || activeRequests.get(fetchKey);
      })
    );
    return;
  }

  // 5. Navigation pages — network-first with 5-second 2G timeout and offline fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      new Promise((resolve) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), NAVIGATION_TIMEOUT_MS);

        fetch(event.request, { signal: controller.signal })
          .then((response) => {
            clearTimeout(timeoutId);
            if (response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            resolve(response);
          })
          .catch(() => {
            clearTimeout(timeoutId);
            caches.match(event.request).then((cached) => {
              if (cached) {
                resolve(cached);
              } else {
                caches.match('/offline.html').then((offlineRes) => {
                  resolve(offlineRes || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } }));
                });
              }
            });
          });
      })
    );
    return;
  }

  // 6. Everything else — network-first with stale fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || new Response('', { status: 503, statusText: 'Offline' });
        });
      })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'The Professor', body: 'New update from the academy!' };
  const options = {
    body: data.body,
    icon: '/logo.svg',
    badge: '/logo.svg',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-study-data') {
    event.waitUntil(syncStudyData());
  }
});

async function syncStudyData() {
  console.log('SW: Background syncing study data...');
}