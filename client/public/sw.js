const CACHE_NAME = 'penny-pulse-v2';
const SHELL_ASSETS = ['/', '/index.html', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isDocument = req.mode === 'navigate';
  const isAsset =
    sameOrigin &&
    (url.pathname.startsWith('/assets/') ||
      /\.(?:js|css|png|jpg|jpeg|svg|webp|ico|woff2?)$/i.test(url.pathname));

  // Keep app shell fresh so users see new UI without manual cache clears.
  if (isDocument) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          return cached || caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // Fast loads for static assets while still refreshing in background.
  if (isAsset) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
    return;
  }

  // Do not cache API/data requests; always hit network.
  event.respondWith(
    fetch(req).catch(async () => {
      const cached = await caches.match(req);
      return cached || caches.match('/index.html') || caches.match('/');
    })
  );
});
