const STATIC_CACHE_NAME = 'static-v2';
const DYNAMIC_CACHE_NAME = 'dynamic-v2';

// Archivos que componen el "App Shell"
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Durante la fase de instalación, guardamos el App Shell en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(cache => {
      console.log('Service Worker: Caching App Shell');
      return cache.addAll(APP_SHELL_FILES);
    })
  );
});

// 2. Durante la activación, eliminamos cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
        .map(key => caches.delete(key))
      );
    })
  );
});

// 3. Interceptamos las peticiones de red
self.addEventListener('fetch', event => {
  const { request } = event;

  // Estrategia para las llamadas a la API (/api/...)
  if (request.url.includes('/api/')) {
    event.respondWith(
      // Primero intenta ir a la red
      fetch(request).then(networkResponse => {
        // Si hay respuesta, la guardamos en la caché dinámica y la devolvemos
        return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // Si la red falla, busca en la caché
        return caches.match(request);
      })
    );
  } else {
    // Estrategia para el App Shell (archivos estáticos)
    event.respondWith(
      caches.match(request).then(cacheResponse => {
        // Devuelve desde caché o ve a la red si no está
        return cacheResponse || fetch(request);
      })
    );
  }
});