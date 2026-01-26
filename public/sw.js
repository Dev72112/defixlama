// Service Worker for DefiXlama PWA
// Version-based cache management for proper updates

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `defixlama-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `defixlama-dynamic-${CACHE_VERSION}`;
const API_CACHE = `defixlama-api-${CACHE_VERSION}`;

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
];

// API domains to apply stale-while-revalidate
const API_DOMAINS = [
  'defillama.com',
  'api.coingecko.com',
  'okx.com',
  'oklink.com',
  'dexscreener.com',
  'supabase.co',
];

// Cache duration settings (in ms)
const CACHE_DURATIONS = {
  api: 30 * 1000, // 30 seconds for API data
  static: 7 * 24 * 60 * 60 * 1000, // 7 days for static assets
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Force new service worker to take over immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old versioned caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('defixlama-') && 
                     !name.includes(CACHE_VERSION);
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim(),
    ])
  );
});

// Helper: Check if URL is an API request
function isApiRequest(url) {
  return API_DOMAINS.some(domain => url.hostname.includes(domain));
}

// Helper: Check if cache entry is fresh
function isCacheFresh(response, duration) {
  if (!response) return false;
  const cachedDate = response.headers.get('sw-cached-at');
  if (!cachedDate) return false;
  return (Date.now() - parseInt(cachedDate)) < duration;
}

// Helper: Add cache timestamp to response
function addCacheTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-at', Date.now().toString());
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;
  
  // Handle API requests with stale-while-revalidate
  if (isApiRequest(url)) {
    event.respondWith(staleWhileRevalidate(event.request, API_CACHE, CACHE_DURATIONS.api));
    return;
  }
  
  // Handle static assets with cache-first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|eot|ico)$/)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }
  
  // Handle navigation requests with network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, STATIC_CACHE));
    return;
  }
  
  // Default: network-first with dynamic cache
  event.respondWith(networkFirst(event.request, DYNAMIC_CACHE));
});

// Strategy: Stale-While-Revalidate (for API requests)
async function staleWhileRevalidate(request, cacheName, duration) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Start network fetch regardless
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response.ok) {
        const responseToCache = addCacheTimestamp(response.clone());
        await cache.put(request, responseToCache);
      }
      return response;
    })
    .catch((error) => {
      console.log('[SW] Network fetch failed:', error);
      return null;
    });
  
  // Return cached response if fresh, otherwise wait for network
  if (cachedResponse && isCacheFresh(cachedResponse, duration)) {
    // Still revalidate in background
    networkPromise.catch(() => {});
    return cachedResponse;
  }
  
  // Return cached response while waiting for network (true SWR)
  if (cachedResponse) {
    networkPromise.catch(() => {});
    return cachedResponse;
  }
  
  // No cache, must wait for network
  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }
  
  // Both cache and network failed
  return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Strategy: Cache-First (for static assets)
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Cache-first network failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Strategy: Network-First (for navigation and dynamic content)
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network-first falling back to cache');
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For navigation, return offline page
    if (request.mode === 'navigate') {
      const offlinePage = await cache.match('/offline.html');
      if (offlinePage) {
        return offlinePage;
      }
      // Fallback to index for SPA
      return cache.match('/');
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Background sync for pending actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  }
});

async function syncPendingActions() {
  // Future: Sync watchlist, alerts, etc. when back online
  console.log('[SW] Background sync triggered');
}

// Push notification handler (preparation for future)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New update available',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'DefiXlama', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Message handler for cache control from main app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'CLEAR_API_CACHE') {
    event.waitUntil(
      caches.delete(API_CACHE).then(() => {
        console.log('[SW] API cache cleared');
      })
    );
  }
  
  if (event.data?.type === 'GET_CACHE_STATUS') {
    event.waitUntil(
      getCacheStatus().then((status) => {
        event.source.postMessage({ type: 'CACHE_STATUS', status });
      })
    );
  }
});

// Helper: Get cache status for debugging
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    status[name] = keys.length;
  }
  
  return status;
}