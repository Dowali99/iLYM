
const CACHE_NAME = 'ilym-pizza-v2';

const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith('ilym-pizza-') &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // لا نخزّن الصور أو الملفات الخارجية داخل كاش التطبيق.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(request).then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });
        }

        return response;
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }

        return new Response('غير متصل بالإنترنت', {
          status: 503,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8'
          }
        });
      });
    })
  );
});
