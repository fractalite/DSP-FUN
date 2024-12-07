const CACHE_NAME = 'deepr-love-v1';
const OFFLINE_URL = '/offline.html';

// Resources to pre-cache
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/styles.css',
  '/js/utils/retryUtils.js',
  '/js/services/affirmationService.js',
  '/voice-enhancer.js',
  '/voice-recording.js',
  '/session-tracker.js',
  '/audio-tracks.js',
  '/assets/favicon.svg',
  '/assets/Logo.png',
  OFFLINE_URL
];

// Install event - pre-cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Pre-cache offline page and essential resources
      await cache.addAll(PRECACHE_RESOURCES);
      // Force service worker to become active
      await self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Enable navigation preload if supported
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      // Remove old caches
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );

      // Take control of all pages immediately
      await self.clients.claim();
    })()
  );
});

// Fetch event - handle offline functionality
self.addEventListener('fetch', event => {
  event.respondWith(
    (async () => {
      try {
        // Try to use navigation preload response if available
        const preloadResponse = await event.preloadResponse;
        if (preloadResponse) {
          return preloadResponse;
        }

        // Try the network first
        const networkResponse = await fetch(event.request);
        
        // Cache successful GET requests
        if (event.request.method === 'GET') {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        
        // Check if the request is for an API endpoint
        if (event.request.url.includes('/api/')) {
          // For API requests, return a custom offline response
          return new Response(
            JSON.stringify({
              error: 'offline',
              message: 'You are currently offline'
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        // Try to get the resource from cache
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If resource not in cache, show offline page
        return cache.match(OFFLINE_URL);
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
