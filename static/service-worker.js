// Service Worker for offline support and background sync
const CACHE_NAME = 'p2p-sync-v1';
const urlsToCache = [
  '/',
  '/sync',
  '/sync-basic',
  '/workers/sync-worker.js',
  'https://esm.sh/yjs@13.5.41',
  'https://esm.sh/y-webrtc@10.3.0',
  'https://esm.sh/y-indexeddb@9.0.12',
  'https://esm.sh/uuid@11.1.0'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache:', error);
      })
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip WebSocket connections
  if (event.request.url.startsWith('ws://') || event.request.url.startsWith('wss://')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Cache successful responses
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Return offline page or placeholder
            return new Response('Offline - cached content only', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Background sync for pending operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-files') {
    event.waitUntil(syncPendingFiles());
  }
});

async function syncPendingFiles() {
  // This would sync any pending file uploads/downloads
  // For now, just log that sync was attempted
  console.log('Background sync: Checking for pending operations');
  
  // You could implement actual sync logic here:
  // 1. Check IndexedDB for pending operations
  // 2. Attempt to complete them
  // 3. Update sync status
  
  // Send message to all clients about sync attempt
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'BACKGROUND_SYNC',
      message: 'Background sync completed'
    });
  });
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-file-updates') {
    event.waitUntil(checkFileUpdates());
  }
});

async function checkFileUpdates() {
  console.log('Periodic sync: Checking for file updates');
  // Implement periodic sync logic here
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Listen for push events (for future server-based notifications)
self.addEventListener('push', (event) => {
  // Only show notifications if explicitly enabled by user
  // For now, just log the event
  console.log('Push event received:', event.data?.text());
  
  // Send silent update to clients instead of showing notification
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PUSH_UPDATE',
        data: event.data?.text()
      });
    });
  });
});