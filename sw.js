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
  const url = new URL(event.request.url);
  console.log('[ServiceWorker] Fetch:', url.pathname);
  
  // Handle font requests
  if (FONT_DOMAINS.some(domain => url.hostname === domain)) {
    console.log('[ServiceWorker] Font request:', url.pathname);
    event.respondWith(
      (async () => {
        try {
          // Try cache first for fonts
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            console.log('[ServiceWorker] Font from cache:', url.pathname);
            return cachedResponse;
          }

          console.log('[ServiceWorker] Fetching font from network:', url.pathname);
          // If not in cache, fetch from network
          const response = await fetch(event.request.clone(), {
            mode: 'cors',
            credentials: 'omit'
          });
          
          // Cache successful responses
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, response.clone());
            console.log('[ServiceWorker] Cached font:', url.pathname);
          } else {
            console.warn('[ServiceWorker] Bad font response:', response.status, url.pathname);
          }
          
          return response;
        } catch (error) {
          console.error('[ServiceWorker] Font fetch failed:', url.pathname, error);
          throw error;
        }
      })()
    );
    return;
  }

  // Handle API requests
  if (url.pathname.includes('/.netlify/functions/')) {
    console.log('[ServiceWorker] API request:', url.pathname);
    event.respondWith(
      fetch(event.request)
        .catch(error => {
          console.error('[ServiceWorker] API fetch failed:', url.pathname, error);
          return caches.match(event.request);
        })
    );
    return;
  }

  // Handle all other requests
  event.respondWith(
    (async () => {
      try {
        // Try cache first
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          console.log('[ServiceWorker] From cache:', url.pathname);
          return cachedResponse;
        }

        // If not in cache, try network
        console.log('[ServiceWorker] Fetching from network:', url.pathname);
        const response = await fetch(event.request);
        
        // Cache successful responses
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
          console.log('[ServiceWorker] Cached:', url.pathname);
        }
        
        return response;
      } catch (error) {
        console.error('[ServiceWorker] Fetch failed:', url.pathname, error);
        
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
