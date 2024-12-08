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

// Font domains to handle
const FONT_DOMAINS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com'
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
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !FONT_DOMAINS.some(url => event.request.url.startsWith(url))) {
    return;
  }

  // Network-first strategy for API calls
  if (event.request.url.includes('/.netlify/functions/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first strategy for static assets and fonts
  event.respondWith(
    (async () => {
      try {
        // Try cache first
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          console.log('[ServiceWorker] Return from cache:', event.request.url);
          return cachedResponse;
        }

        // If not in cache, try network
        const response = await fetch(event.request);
        
        // Cache successful responses
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }
        
        return response;
      } catch (error) {
        console.log('[ServiceWorker] Fetch failed, serving offline page');
        
        // If it's a page navigation, show offline page
        if (event.request.mode === 'navigate') {
          const cache = await caches.open(CACHE_NAME);
          return cache.match(OFFLINE_URL);
        }
        
        throw error;
      }
    })()
  );
});
