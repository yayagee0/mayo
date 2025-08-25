// Enhanced Service Worker for Mayo FamilyNest PWA
// Caches static assets for offline functionality
const CACHE_NAME = 'mayo-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('SW cache addAll failed for some assets:', err);
        // Try to cache assets individually to avoid failing completely
        return Promise.allSettled(
          STATIC_ASSETS.map(url => cache.add(url))
        );
      });
    })
  );
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim control of all clients
  self.clients.claim();
});

// Fetch event - serve from cache for static assets, network for dynamic content
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip caching for Supabase requests and API calls
  if (url.hostname.includes('supabase') || 
      url.pathname.startsWith('/api/') ||
      request.method !== 'GET') {
    return; // Let browser handle normally
  }

  // Cache strategy: Network first for HTML, Cache first for static assets
  if (request.destination === 'document') {
    // Network first strategy for HTML pages
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the response for offline fallback
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
  } else {
    // Cache first strategy for static assets
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response; // Return cached version
        }
        // If not in cache, fetch from network
        return fetch(request).then((response) => {
          // Cache static assets for future use
          if (response.status === 200 && 
              (request.destination === 'style' || 
               request.destination === 'script' ||
               request.destination === 'image')) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
    );
  }
});