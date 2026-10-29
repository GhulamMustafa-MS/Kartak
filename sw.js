/*
 * sw.js - service worker for the worker app (registered by js/app.js).
 *
 * Purpose:    Lets phones install the app and keeps it working offline. Network first: when online,
 *             people always get the newest files and questions; the saved copy is used only offline.
 *             /api/ calls are never cached. Every page visit falls back to the saved "/". On install it
 *             saves FILES (the app and all questions), so offline works after the very first visit.
 *             Fonts come from Google Fonts and are not saved: offline, the phone's own fonts are used.
 * Used by:    js/app.js (navigator.serviceWorker.register("/sw.js")).
 */
const CACHE = "kartak-v7"; // change the number to drop old saved copies after a big change
// Saved as soon as the app is first opened, so it works offline straight away (not only from the 2nd visit).
const FILES = ["/", "/css/app.css", "/js/i18n.js", "/js/app.js", "/data/questions.json", "/data/words.json", "/manifest.webmanifest",
  "/icons/icon-192.png", "/icons/icon-512.png", "/icons/apple-touch-icon.png", "/icons/favicon-32.png"];
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(FILES.map((f) => c.add(f).catch(() => null)))));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
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
