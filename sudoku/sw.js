// Service Worker for offline caching
const CACHE_NAME = 'sudoku-v1';

// Install event - prepare cache
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(() => {
            // Cache will be populated on first fetch
            return Promise.resolve();
        })
    );
    // Force the waiting service worker to become the active service worker immediately
    self.skipWaiting();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request, { ignoreSearch: true })
            .then((response) => {
                // Return cached version if available
                if (response) {
                    return response;
                }
                // Otherwise fetch from network and cache it
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses or opaque responses
                        if (!response || response.status !== 200 || response.type === 'opaque') {
                            return response;
                        }
                        // Clone the response before caching
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                // Cache all successful responses
                                cache.put(event.request, responseToCache);
                            })
                            .catch(() => {
                                // Ignore cache errors
                            });
                        return response;
                    })
                    .catch((error) => {
                        // If fetch fails (offline), try to find any cached HTML
                        if (event.request.mode === 'navigate' || event.request.destination === 'document') {
                            // For navigation requests, search cache for any HTML file
                            return caches.open(CACHE_NAME)
                                .then((cache) => {
                                    return cache.keys()
                                        .then((keys) => {
                                            // Find any HTML file in cache
                                            for (const key of keys) {
                                                if (key.url.includes('index.html') ||
                                                    key.headers.get('content-type')?.includes('text/html')) {
                                                    return cache.match(key);
                                                }
                                            }
                                            // If no HTML found, try common paths
                                            return cache.match('./index.html')
                                                .then((cached) => {
                                                    if (cached) return cached;
                                                    return cache.match('index.html')
                                                        .then((cached2) => {
                                                            if (cached2) return cached2;
                                                            return cache.match(event.request.url)
                                                                .then((cached3) => cached3 || null);
                                                        });
                                                });
                                        });
                                })
                                .then((cached) => {
                                    if (cached) return cached;
                                    // Last resort: return a basic offline message
                                    return new Response('Offline - please check your connection', {
                                        status: 503,
                                        statusText: 'Service Unavailable',
                                        headers: { 'Content-Type': 'text/html' }
                                    });
                                });
                        }
                        // For other requests, just fail
                        throw error;
                    });
            })
    );
});

// Activate event - clean up old caches
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
    // Take control of all pages immediately
    return self.clients.claim();
});

