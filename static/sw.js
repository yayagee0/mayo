// Mayo PWA Service Worker - 100% Network-First Strategy
// Always fetches fresh data from server first, uses cache only if no internet
const CACHE_NAME = 'mayo-cache';
const STATIC_ESSENTIALS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html'
];

// Install event - pre-cache only essentials
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ESSENTIALS).catch((err) => {
        console.warn('SW cache addAll failed for some assets:', err);
        // Try to cache assets individually to avoid failing completely
        return Promise.allSettled(
          STATIC_ESSENTIALS.map(url => cache.add(url))
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

// Fetch event - 100% network-first strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip service worker for non-GET requests and external APIs
  if (request.method !== 'GET' || 
      url.hostname.includes('supabase') || 
      url.pathname.startsWith('/api/')) {
    return; // Let browser handle normally
  }

  // Network-first strategy for ALL requests
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
        // Fallback to cache only if network fails (offline)
        return caches.match(request);
      })
  );
});