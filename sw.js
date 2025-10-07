const CACHE_NAME = 'pocketperfo-v1.0.0';
const urlsToCache = [
  '/',
  '/manifest.json',
  'https://i.imgur.com/aNxDcLC.png'
];

self.addEventListener('install', event => {
  console.log('SW: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Cacheando archivos');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('SW: Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('SW: Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Solo cachear requests GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('SW: Sirviendo desde cache:', event.request.url);
          return response;
        }
        
        console.log('SW: Descargando:', event.request.url);
        return fetch(event.request).then(response => {
          // Solo cachear respuestas válidas
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // Página offline simple
        if (event.request.destination === 'document') {
          return new Response(
            '<h1>Sin conexión</h1><p>PocketPerfo requiere conexión a internet.</p>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }
      })
  );
});
