const CACHE_NAME = 'deepr-love-v1';
const OFFLINE_URL = '/offline.html';

// Resources to pre-cache
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/styles.css',
  '/ai-integration.js',
  '/affirmation-system.js',
  '/audioOptimizer.js',
  '/config.js',
  '/assets/Logo.png',
  OFFLINE_URL
];

// Install event - pre-cache resources
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[ServiceWorker] Caching app shell');
        await cache.addAll(PRECACHE_RESOURCES);
        console.log('[ServiceWorker] Cache populated');
      } catch (error) {
        console.error('[ServiceWorker] Install failed:', error);
      }
    })()
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    (async () => {
      try {
        // Get all cache keys
        const cacheKeys = await caches.keys();
        
        // Delete old caches
        await Promise.all(
          cacheKeys
            .filter(key => key !== CACHE_NAME)
            .map(key => {
              console.log('[ServiceWorker] Removing old cache', key);
              return caches.delete(key);
            })
        );
        
        console.log('[ServiceWorker] Claiming clients');
        await clients.claim();
      } catch (error) {
        console.error('[ServiceWorker] Activate failed:', error);
      }
    })()
  );
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip browser-sync requests in development
  if (event.request.url.includes('browser-sync')) return;

  // Skip Netlify function calls
  if (event.request.url.includes('/.netlify/functions/')) return;

  event.respondWith(
    (async () => {
      try {
        // Try to get from cache first
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        
        if (cachedResponse) {
          console.log('[ServiceWorker] Return from cache:', event.request.url);
          return cachedResponse;
        }

        try {
          // If not in cache, try network
          const networkResponse = await fetch(event.request);
          
          // Cache successful responses
          if (networkResponse.ok) {
            console.log('[ServiceWorker] Caching new resource:', event.request.url);
            await cache.put(event.request, networkResponse.clone());
          }
          
          return networkResponse;
        } catch (fetchError) {
          console.log('[ServiceWorker] Fetch failed, serving offline page');
          
          // If offline and requesting a page, show offline page
          if (event.request.mode === 'navigate') {
            return cache.match(OFFLINE_URL);
          }
          
          throw fetchError;
        }
      } catch (error) {
        console.error('[ServiceWorker] Fetch handler failed:', error);
        throw error;
      }
    })()
  );
});

// Background sync for failed requests
self.addEventListener('sync', event => {
  if (event.tag === 'sync-affirmations') {
    event.waitUntil(syncAffirmations());
  }
});

// Handle push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data.text(),
    icon: '/assets/Logo.png',
    badge: '/assets/favicon.svg'
  };

  event.waitUntil(
    self.registration.showNotification('deepr.love', options)
  );
});
