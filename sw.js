// Service Worker for PWA
const CACHE_NAME = 'coruripe-lixo-zero-v1';
const urlsToCache = [
    '/coruripe-lixo-zero/',
    '/coruripe-lixo-zero/index.html',
    '/coruripe-lixo-zero/style.css',
    '/coruripe-lixo-zero/script.js',
    '/coruripe-lixo-zero/icon.png',
    '/coruripe-lixo-zero/logo-coruripe-removebg-preview.png',
    '/coruripe-lixo-zero/logo-cide-new.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});
