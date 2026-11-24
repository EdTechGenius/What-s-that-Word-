/* Service worker: lets What's That Word? open and colour text offline.
 * App files: served from cache, refreshed in the background.
 * Dictionary/thesaurus answers: fetched live, with a cached copy as a fallback. */
const VERSION = 'wtw-v2';
const SHELL = [
  './', 'index.html', 'css/styles.css', 'js/app.js', 'js/grammar.js', 'js/lookup.js', 'js/wordparts.js',
  'vendor/compromise.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'fonts/opendyslexic-latin-400-normal.woff2', 'fonts/opendyslexic-latin-700-normal.woff2', 'fonts/opendyslexic-latin-400-italic.woff2',
];
const API_HOSTS = ['api.dictionaryapi.dev', 'api.datamuse.com', 'en.wiktionary.org'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== 'wtw-api').map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (API_HOSTS.includes(url.hostname)) {
    // network first, so answers stay fresh; fall back to the last answer we saw
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok || res.status === 404) {
          const copy = res.clone();
          caches.open('wtw-api').then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then((r) => r || Promise.reject(new Error('offline')))),
    );
    return;
  }

  if (url.origin === location.origin || FONT_HOSTS.includes(url.hostname)) {
    // cache first, refresh in the background
    e.respondWith(
      caches.open(VERSION).then((cache) => cache.match(req, { ignoreSearch: url.origin === location.origin }).then((hit) => {
        const net = fetch(req).then((res) => {
          if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
          return res;
        }).catch(() => hit || (req.mode === 'navigate' ? cache.match('index.html') : undefined));
        return hit || net;
      })),
    );
  }
});
