// Bump this version string every time you deploy a UI update.
// Changing it forces every installed user's app to fetch the new files.
const CACHE_VERSION = 'wavelength-v1';

const APP_SHELL = [
    './index.html',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then(cache => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Network-first for HTML (so users get UI updates quickly),
// cache-first for everything else (fonts, icons, etc.)
self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.mode === 'navigate' || req.destination === 'document') {
        event.respondWith(
            fetch(req).then(res => {
                const copy = res.clone();
                caches.open(CACHE_VERSION).then(cache => cache.put(req, copy));
                return res;
            }).catch(() => caches.match(req))
        );
        return;
    }
    event.respondWith(
        caches.match(req).then(cached => cached || fetch(req))
    );
});