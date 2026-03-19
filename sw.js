const CACHE_NAME = 'bcxq-cache-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  let cacheUpdatePromise = Promise.resolve();
  const responsePromise = caches.match(event.request).then((cached) => {
    if (cached) {
      return cached;
    }
    return fetch(event.request)
      .then((response) => {
        const cloned = response.clone();
        cacheUpdatePromise = caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return response;
      })
      .catch((error) => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        throw error;
      });
  });
  event.respondWith(responsePromise);
  event.waitUntil(
    responsePromise
      .then(() => cacheUpdatePromise)
      .catch(() => undefined)
  );
});
