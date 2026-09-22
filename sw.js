/*
 * StepForge — service worker for offline PWA use.
 *
 * This only works once the app is hosted on a real server (GitHub Pages,
 * Firebase Hosting, your own domain, etc.) with this file placed in the
 * SAME FOLDER as the app's HTML file. It cannot run inside the claude.ai
 * artifact preview — browsers do not allow registering a service worker
 * from a sandboxed/blob context, so the app's registration call there is
 * a harmless no-op. Once self-hosted it gives: the app shell cached on
 * first load, then served from cache with a network-first refresh.
 *
 * Rename ASSETS below to match your actual filename if you don't call the
 * html file "index.html".
 */
const CACHE_NAME = "stepforge-v1";
const ASSETS = ["./", "./index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .catch(() => { /* ok if one of the guessed paths 404s */ })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
