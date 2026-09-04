// ============================================================
// SamasyaSetu — Progressive Web App Service Worker
// ============================================================

const CACHE_NAME = "samasyasetu-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/favicon-32x32.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest"
];

// Install: Cache essential shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[SW] Some assets failed to pre-cache:", err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old cache generations
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first for API requests, Stale-while-revalidate for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome-extension requests and non-GET requests
  if (request.method !== "GET" || url.protocol.startsWith("chrome-extension")) {
    return;
  }

  // Network-first for all API calls
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // Stale-while-revalidate for app shell & static assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
