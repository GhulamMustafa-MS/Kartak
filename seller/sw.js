/*
 * seller/sw.js - service worker for the seller app.
 *
 * Purpose:    Does nothing except exist: Android only offers "Install app" when a page has one.
 *             Nothing is cached, so the seller always sees live codes.
 * Used by:    seller/js/seller.js.
 */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
