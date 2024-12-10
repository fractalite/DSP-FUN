const CACHE_NAME = 'deepr-love-cache-v1';
const OFFLINE_URL = '/offline.html';

// Resources to cache
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/assets/Logo.png',
  '/assets/favicon.svg'
];

self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    (async () => {
      console.log('[ServiceWorker] Caching app shell');
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(STATIC_RESOURCES);
      console.log('[ServiceWorker] Cache populated');
    })()
  );
});

self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
      
      console.log('[ServiceWorker] Claiming clients');
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Conditional logging based on environment
    if (process.env.NODE_ENV === 'development') {
        console.debug(`[ServiceWorker] Fetch intercepted for: ${url.href}`);
    }

    // Skip API requests (expected behavior)
    if (url.pathname.startsWith('/api')) {
        if (process.env.NODE_ENV === 'development') {
            console.info(`[ServiceWorker] Skipping cache for API request: ${url.href}`);
        }
        return; // Let browser handle API requests directly
    }

    event.respondWith(
        (async () => {
            try {
                const response = await fetch(event.request);
                if (process.env.NODE_ENV === 'development') {
                    console.debug(`[ServiceWorker] Response status for ${url.href}: ${response.status}`);
                }

                // Check if response is cacheable
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    if (process.env.NODE_ENV === 'development') {
                        console.debug(`[ServiceWorker] Non-cacheable response for: ${url.href}`);
                    }
                    return response;
                }

                const responseToCache = response.clone();
                const cache = await caches.open(CACHE_NAME);
                await cache.put(event.request, responseToCache);
                if (process.env.NODE_ENV === 'development') {
                    console.debug(`[ServiceWorker] Cached response for: ${url.href}`);
                }

                return response;
            } catch (error) {
                console.error('[ServiceWorker] Fetch failed:', error);
                const cache = await caches.open(CACHE_NAME);
                return await cache.match(event.request) || new Response('Offline content unavailable', { status: 503 });
            }
        })()
    );
});