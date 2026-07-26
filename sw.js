const CACHE_NAME = 'mb-kuzbass-static-v8';
const OFFLINE_URL = './offline.html';
const PRECACHE_URLS = [
  './',
  './index.html',
  './offline.html',
  './error.css',
  './analytics-config.js',
  './assets/telegram-avatar.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Обрабатывает только переходы внутри этого сайта. Внешние и служебные запросы не попадают
  // под управление кеша и не могут подменить offline-ответ.
  if (
    event.request.method !== 'GET' ||
    event.request.mode !== 'navigate' ||
    requestUrl.origin !== self.location.origin
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(OFFLINE_URL)),
  );
});
