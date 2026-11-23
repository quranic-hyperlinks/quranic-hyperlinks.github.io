/* Quran Term Tracer — offline helper.
   Keeps a copy of the (encrypted) site so the installed app opens without internet.
   Always tries the network first, so updates arrive as soon as you are online.
   Recitation audio comes from other sites and is never cached here. */
var CACHE = "qtt-v3";
var FILES = [
  "./", "index.html", "payload.bin", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
  "fonts/amiri-quran-arabic.woff2", "fonts/amiri-400-arabic.woff2", "fonts/amiri-400-latin.woff2",
  "fonts/amiri-400-latinext.woff2", "fonts/amiri-700-latin.woff2", "fonts/amiri-700-latinext.woff2"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// Only the tracer's own files; other apps in this site (such as notes/) are left alone.
var SCOPE = self.registration.scope;
var OWN = new Set(FILES.map(function (f) { return new URL(f, SCOPE).href; }));
self.addEventListener("fetch", function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || !OWN.has(url.origin + url.pathname)) return; // audio, other apps etc. go straight to the network
  e.respondWith(
    fetch(req).then(function (res) {
      if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || caches.match("index.html"); });
    })
  );
});
