const CACHE_NAME = 'professor-v1';
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/favicon.ico',
  '/site.webmanifest',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
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

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip chrome-extension, supabase, etc.
  if (!url.protocol.startsWith('http')) return;

  // Caching strategy: Stale-while-revalidate for static assets
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Caching strategy: Network-first for pages and data
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for navigation
        if (event.request.mode === 'navigate' && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          
          if (event.request.mode === 'navigate') {
            return caches.match('/offline');
          }
          return null;
        });
      })
  );
});

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'The Professor', body: 'New update from the academy!' };
  
  const options = {
    body: data.body,
    icon: '/web-app-manifest-192x192.png',
    badge: '/favicon-16x16.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-study-data') {
    event.waitUntil(syncStudyData());
  }
});

async function syncStudyData() {
  // Logic to sync pending study data when back online
  console.log('Syncing study data...');
}
