// Service Worker for Sunmoon Offline-First PWA
// Version: 1.0.1

const CACHE_VERSION = 'v1.0.1'
const CACHE_NAME = `sunmoon-${CACHE_VERSION}`
const TILE_CACHE_NAME = `sunmoon-tiles-${CACHE_VERSION}`
const MAX_TILE_AGE = 30 * 24 * 60 * 60 * 1000 // 30 days

// Core assets to precache (≤ 2 MB target)
const PRECACHE_ASSETS = [
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

// Install event - precache core assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...', CACHE_VERSION)
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching core assets')
      return cache.addAll(PRECACHE_ASSETS)
    }).then(() => {
      console.log('[SW] Installation complete, skipping waiting')
      return self.skipWaiting()
    }).catch((error) => {
      console.error('[SW] Precaching failed:', error)
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...', CACHE_VERSION)
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old versions of main cache
            return name.startsWith('sunmoon-') && name !== CACHE_NAME && name !== TILE_CACHE_NAME
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    }).then(() => {
      console.log('[SW] Claiming clients')
      return self.clients.claim()
    })
  )
})

// Fetch event - offline-first strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Handle navigations (network-first with offline fallback)
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(handleNavigationRequest(request))
    return
  }

  // Handle tile data requests (cache-first with age validation)
  if (url.pathname.startsWith('/api/tiles/') || url.pathname.includes('/tiles/')) {
    event.respondWith(handleTileRequest(request))
    return
  }

  // Handle API requests (network-first with cache fallback)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }

  // Handle static assets (cache-first)
  event.respondWith(handleStaticRequest(request))
})

// Cache-first strategy for tile data with age validation
async function handleTileRequest(request) {
  const cache = await caches.open(TILE_CACHE_NAME)
  const cached = await cache.match(request)

  if (cached) {
    // Check tile age
    const cachedDate = cached.headers.get('sw-cached-date')
    if (cachedDate) {
      const age = Date.now() - parseInt(cachedDate, 10)
      if (age < MAX_TILE_AGE) {
        console.log('[SW] Serving tile from cache (age:', Math.floor(age / 86400000), 'days)')
        return cached
      }
      console.log('[SW] Tile expired, fetching new data')
    }
  }

  try {
    console.log('[SW] Fetching tile from network:', request.url)
    const response = await fetch(request)
    
    if (response.ok) {
      // Clone and add timestamp header
      const responseToCache = response.clone()
      const headers = new Headers(responseToCache.headers)
      headers.set('sw-cached-date', Date.now().toString())
      
      const newResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      })
      
      cache.put(request, newResponse.clone())
      return newResponse
    }
    
    return response
  } catch (error) {
    console.error('[SW] Tile fetch failed:', error)
    // Return cached version even if expired when offline
    if (cached) {
      console.log('[SW] Returning expired tile (offline fallback)')
      return cached
    }
    
    // Return error response
    return new Response(JSON.stringify({ error: 'Offline and no cached data' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Network-first strategy for API requests
async function handleApiRequest(request) {
  const cache = await caches.open(CACHE_NAME)
  
  try {
    console.log('[SW] Fetching API from network:', request.url)
    const response = await fetch(request)
    
    if (response.ok) {
      // Cache successful responses
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.error('[SW] API fetch failed:', error)
    const cached = await cache.match(request)
    
    if (cached) {
      console.log('[SW] Returning cached API response')
      return cached
    }
    
    // Return offline response
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Cache-first strategy for static assets
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  
  if (cached) {
    console.log('[SW] Serving from cache:', request.url)
    return cached
  }
  
  try {
    console.log('[SW] Fetching from network:', request.url)
    const response = await fetch(request)
    
    if (response.ok) {
      // Cache new static assets
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    console.error('[SW] Fetch failed:', error)
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await cache.match('/offline')
      if (offlinePage) {
        return offlinePage
      }
    }
    
    return new Response('Offline', { status: 503 })
  }
}

// Network-first strategy for navigation requests (HTML documents)
async function handleNavigationRequest(request) {
  const cache = await caches.open(CACHE_NAME)

  try {
    const response = await fetch(request)

    if (response && response.ok) {
      cache.put(request, response.clone())
    }

    return response
  } catch (error) {
    console.error('[SW] Navigation fetch failed:', error)

    const cached = await cache.match(request)
    if (cached) {
      console.log('[SW] Returning cached navigation response')
      return cached
    }

    const offlinePage = await cache.match('/offline')
    if (offlinePage) {
      return offlinePage
    }

    return new Response('Offline', { status: 503 })
  }
}

// Message event - handle commands from client
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data)
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((names) => {
        return Promise.all(names.map((name) => caches.delete(name)))
      }).then(() => {
        event.ports[0].postMessage({ success: true })
      })
    )
  }
  
  if (event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      calculateCacheSize().then((size) => {
        event.ports[0].postMessage({ size })
      })
    )
  }
})

// Calculate total cache size
async function calculateCacheSize() {
  const cacheNames = await caches.keys()
  let totalSize = 0
  
  for (const name of cacheNames) {
    const cache = await caches.open(name)
    const requests = await cache.keys()
    
    for (const request of requests) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        totalSize += blob.size
      }
    }
  }
  
  return totalSize
}

// Background sync for tile updates (if supported)
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'sync-tiles') {
    event.waitUntil(syncTiles())
  }
})

async function syncTiles() {
  console.log('[SW] Syncing tiles...')
  // Implementation for background tile updates
  // This will be called when network becomes available
}

console.log('[SW] Service Worker loaded:', CACHE_VERSION)
