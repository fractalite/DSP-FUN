// Add diagnostic logging at the top of the file
self.addEventListener('install', (event) => {
  console.log('🔧 [ServiceWorker] DIAGNOSTIC: Installation started', {
    timestamp: new Date().toISOString(),
    cacheVersion: CACHE_NAME
  });
  console.log('[ServiceWorker] Install');
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(STATIC_RESOURCES);
        console.log('[ServiceWorker] Cache populated successfully');
      } catch (error) {
        console.error('[ServiceWorker] Installation cache error:', error);
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  console.log('🟢 [ServiceWorker] DIAGNOSTIC: Activation started', {
    timestamp: new Date().toISOString(),
    cacheVersion: CACHE_NAME
  });
  console.log('[ServiceWorker] Activate');
  event.waitUntil(
    (async () => {
      try {
        const cacheKeys = await caches.keys();
        await Promise.all(
          cacheKeys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        );
        await self.clients.claim();
        console.log('[ServiceWorker] Activation complete');
      } catch (error) {
        console.error('[ServiceWorker] Activation error:', error);
      }
    })()
  );
});

// Wrap existing fetch event listener with comprehensive logging
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  console.log('🌐 [ServiceWorker] DIAGNOSTIC: Fetch intercepted', {
    url: url.href,
    method: event.request.method,
    timestamp: new Date().toISOString()
  });

  // Special handling for font resources
  if (FONT_RESOURCES.some(resource => url.href.startsWith(resource))) {
    event.respondWith(
      (async () => {
        try {
          // Aggressive caching for font resources
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request);
          
          if (cachedResponse) {
            console.log('[ServiceWorker] Font served from cache:', url.href);
            return cachedResponse;
          }
          
          const networkResponse = await fetch(event.request, {
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
            console.log('[ServiceWorker] Font cached from network:', url.href);
          }
          
          return networkResponse;
        } catch (error) {
          console.error('[ServiceWorker] Font fetch failed:', url.href, error);
          return Response.error();
        }
      })()
    );
    return;
  }

  // Default fetch handling
  event.respondWith(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        const networkResponse = await fetch(event.request);
        
        if (networkResponse.ok && !networkResponse.type === 'opaque') {
          cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        console.error('[ServiceWorker] Fetch error:', error);
        return new Response('Offline', { status: 503 });
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

const CACHE_NAME = 'deepr-love-cache-v2';
const OFFLINE_URL = '/offline.html';

// Comprehensive resource list
const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/assets/Logo.png',
  '/assets/favicon.svg'
];

// Expanded font domains and resources
const FONT_RESOURCES = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];
