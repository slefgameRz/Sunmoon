/// <reference lib="webworker" />

/**
 * Service Worker with Background Sync & Offline Support
 */

declare const self: ServiceWorkerGlobalScope

const CACHE_VERSION = 'seapalo-v2'
const TILE_CACHE = `${CACHE_VERSION}-tiles`
const APP_CACHE = `${CACHE_VERSION}-app`
const API_CACHE = `${CACHE_VERSION}-api`

/**
 * Install event
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[SW] Installing...')
  event.waitUntil(
    (async () => {
      try {
        await caches.open(APP_CACHE)
        console.log('[SW] Precache complete')
        self.skipWaiting()
      } catch (e) {
        console.error('[SW] Install failed:', e)
      }
    })()
  )
})

/**
 * Activate event
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[SW] Activating...')
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys()
      const oldCaches = cacheNames.filter(name => !name.startsWith(CACHE_VERSION))
      await Promise.all(oldCaches.map(name => caches.delete(name)))
      console.log('[SW] Old caches cleaned')
      void self.clients.claim()
    })()
  )
})

/**
 * Fetch event
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(request, APP_CACHE))
    return
  }

  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, APP_CACHE))
    return
  }

  event.respondWith(networkFirstStrategy(request, API_CACHE))
})

async function networkFirstStrategy(request: Request, cacheName: string): Promise<Response> {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      void cache.put(request, response.clone())
    }
    return response
  } catch (e) {
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    return new Response('Offline', { status: 503 })
  }
}

async function cacheFirstStrategy(request: Request, cacheName: string): Promise<Response> {
  const cached = await caches.match(request)
  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      void cache.put(request, response.clone())
    }
    return response
  } catch (e) {
    return new Response('Network error', { status: 503 })
  }
}

console.log('[SW] Service worker loaded')

export {}
