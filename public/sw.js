/// <reference lib="webworker" />

const CACHE_NAME = 'professor-v1';
const OFFLINE_URL = '/';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
    '/',
    '/icon.svg',
    '/manifest.webmanifest',
];

// @ts-ignore
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // @ts-ignore
    self.skipWaiting();
});

// @ts-ignore
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            )
        )
    );
    // @ts-ignore
    self.clients.claim();
});

// @ts-ignore
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip API calls — always go to network
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return;

    // Network-first strategy for HTML pages
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request).then((r) => r || caches.match(OFFLINE_URL)))
        );
        return;
    }

    // Cache-first for static assets (JS, CSS, images, fonts)
    event.respondWith(
        caches.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
                if (response.ok && (
                    url.pathname.match(/\.(js|css|png|jpg|svg|woff2?|ttf)$/) ||
                    url.hostname === 'fonts.googleapis.com' ||
                    url.hostname === 'fonts.gstatic.com'
                )) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                }
                return response;
            });
        })
    );
});
