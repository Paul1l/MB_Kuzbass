const CACHE_NAME = 'mb-kuzbass-static-v12';
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

// Пути заранее сохраненных файлов: без сети офлайн-страница берет из кеша и свои стили.
const PRECACHE_PATHS = new Set(PRECACHE_URLS.map((url) => new URL(url, self.location).pathname));

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Обрабатывает только запросы к этому сайту. Внешние и служебные запросы не попадают
  // под управление кеша и не могут подменить offline-ответ.
  if (event.request.method !== 'GET' || requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }

  // Остальное — как обычно из сети; кеш только для сохраненных файлов и только без сети.
  if (PRECACHE_PATHS.has(requestUrl.pathname)) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request, { ignoreSearch: true })));
  }
});
