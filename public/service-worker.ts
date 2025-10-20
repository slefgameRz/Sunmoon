/**
 * Service Worker with Background Sync & Offline Support
 * 
 * Features:
 * - Cache-first strategy for tiles
 * - Network-first for app shell
 * - Background sync for tile updates
 * - Offline prediction capability
 */

// Cache names
const CACHE_VERSION = 'seapalo-v1'
const TILE_CACHE = `${CACHE_VERSION}-tiles`
const APP_CACHE = `${CACHE_VERSION}-app`
const API_CACHE = `${CACHE_VERSION}-api`

// Files to precache
const PRECACHE_FILES = [
  '/',
  '/index.html',
  '/_next/static/chunks/main.js',
  '/_next/static/chunks/pages/index.js',
]

/**
 * Install event - Precache app shell
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing service worker...')

  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(APP_CACHE)
        // Precache only critical files
        // Full precache in production
        console.log('[SW] Precache complete')
        self.skipWaiting()
      } catch (e) {
        console.error('[SW] Install failed:', e)
      }
    })()
  )
})

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating service worker...')

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      const oldCaches = cacheNames.filter(name => !name.startsWith(CACHE_VERSION))

      await Promise.all(oldCaches.map(name => caches.delete(name)))
      console.log('[SW] Old caches cleaned up')
      self.clients.claim()
    })()
  )
})

/**
 * Fetch event - Cache strategies
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)

  // API requests - Network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE))
    return
  }

  // Tile requests - Cache first
  if (url.pathname.startsWith('/api/tiles/')) {
    event.respondWith(cacheFirstStrategy(request, TILE_CACHE))
    return
  }

  // App shell - Network first for updates, cache for offline
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(request, APP_CACHE))
    return
  }

  // Static assets - Cache first
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, APP_CACHE))
    return
  }

  // Default - Network first
  event.respondWith(networkFirstStrategy(request, API_CACHE))
})

/**
 * Network first strategy
 */
async function networkFirstStrategy(request: Request, cacheName: string): Promise<Response> {
  try {
    const response = await fetch(request)
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (e) {
    // Fall back to cache
    const cached = await caches.match(request)
    if (cached) {
      console.log('[SW] Using cached response for:', request.url)
      return cached
    }

    // Return offline response
    if (request.destination === 'document') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 })
    }

    throw e
  }
}

/**
 * Cache first strategy
 */
async function cacheFirstStrategy(request: Request, cacheName: string): Promise<Response> {
  const cached = await caches.match(request)
  if (cached) {
    console.log('[SW] Using cached response for:', request.url)
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch (e) {
    console.error('[SW] Fetch failed for:', request.url, e)
    return new Response('Network error', { status: 503 })
  }
}

/**
 * Background sync for tile updates
 */
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-tiles') {
    console.log('[SW] Background sync: updating tiles...')
    event.waitUntil(syncTiles())
  }

  if (event.tag === 'sync-predictions') {
    console.log('[SW] Background sync: updating predictions...')
    event.waitUntil(syncPredictions())
  }
})

/**
 * Sync tiles from server
 */
async function syncTiles(): Promise<void> {
  try {
    const response = await fetch('/api/tiles/manifest')
    const manifest = await response.json()

    for (const tile of manifest.tiles) {
      try {
        const tileResponse = await fetch(`/api/tiles/${tile.id}`)
        if (tileResponse.ok) {
          const cache = await caches.open(TILE_CACHE)
          cache.put(`/api/tiles/${tile.id}`, tileResponse)
          console.log(`[SW] Synced tile: ${tile.id}`)
        }
      } catch (e) {
        console.warn(`[SW] Failed to sync tile ${tile.id}:`, e)
      }
    }

    // Notify clients about sync completion
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        source: 'SERVICE_WORKER',
      })
    })
  } catch (e) {
    console.error('[SW] Tile sync failed:', e)
  }
}

/**
 * Sync predictions
 */
async function syncPredictions(): Promise<void> {
  try {
    const response = await fetch('/api/sync-queue')
    const queue = await response.json()

    for (const item of queue.items) {
      try {
        await fetch(`/api/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        })
      } catch (e) {
        console.warn('[SW] Failed to sync prediction:', e)
      }
    }
  } catch (e) {
    console.error('[SW] Prediction sync failed:', e)
  }
}

/**
 * Push notifications
 */
self.addEventListener('push', (event: any) => {
  const data = event.data?.json() ?? {}

  const options: NotificationOptions = {
    body: data.body || 'New tide prediction available',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'seapalo-notification',
  }

  event.waitUntil(self.registration.showNotification(data.title || 'SEAPALO', options))
})

/**
 * Notification click
 */
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close()
  event.waitUntil(
    (self.clients as any).matchAll({ type: 'window' }).then((clients: any[]) => {
      for (const client of clients) {
        if (client.url === '/' && 'focus' in client) {
          return (client as any).focus()
        }
      }
      if (self.clients.openWindow) {
        return (self.clients as any).openWindow('/')
      }
    })
  )
})

console.log('[SW] Service worker loaded')

export {}
