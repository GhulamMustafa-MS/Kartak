/*
 * sw.js - service worker for the worker app (registered by js/app.js).
 *
 * Purpose:    Lets phones install the app and keeps it working offline. Network first: when online,
 *             people always get the newest files and questions; the saved copy is used only offline.
 *             /api/ calls are never cached. Every page visit falls back to the saved "/".
 * Used by:    js/app.js (navigator.serviceWorker.register("/sw.js")).
 */
const CACHE = "kartak-v2"; // change the number to drop old saved copies after a big change
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req.mode === "navigate" ? "/" : req, copy)); }
      return res;
    }).catch(() => caches.match(req.mode === "navigate" ? "/" : req))
  );
});
