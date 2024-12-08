const CACHE_NAME = 'deepr-love-cache-v3';
const OFFLINE_URL = '/offline.html';

const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/offline.html',
  '/assets/Logo.png',
  '/assets/favicon.svg'
];

const FONT_RESOURCES = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => 
      cache.addAll(STATIC_RESOURCES)
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => 
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Special handling for font resources
  if (FONT_RESOURCES.some(resource => url.href.startsWith(resource))) {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            caches.open(CACHE_NAME).then(cache => 
              cache.put(event.request, networkResponse.clone())
            );
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default fetch strategy
  event.respondWith(
    caches.match(event.request).then(response => 
      response || fetch(event.request)
    )
  );
});
