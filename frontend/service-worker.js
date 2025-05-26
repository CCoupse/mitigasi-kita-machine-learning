const CACHE_NAME = 'mitigasikita-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/output.css',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/react@17.0.2/umd/react.development.js',
    'https://cdn.jsdelivr.net/npm/react-dom@17.0.2/umd/react-dom.development.js',
    'https://cdn.jsdelivr.net/npm/axios@1.4.0/dist/axios.min.js',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .catch(err => console.error('Cache open failed:', err))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
            .catch(err => console.error('Fetch failed:', err))
    );
});