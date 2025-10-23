"use client"

import { useEffect, useState } from 'react'

const SERVICE_WORKER_ENABLED = process.env.NEXT_PUBLIC_ENABLE_SERVICE_WORKER === 'true'

interface ServiceWorkerState {
  isSupported: boolean
  isInstalled: boolean
  isOnline: boolean
  needsUpdate: boolean
  cacheSize: number
  lastUpdate: Date | null
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isInstalled: false,
    isOnline: true,
    needsUpdate: false,
    cacheSize: 0,
    lastUpdate: null,
  })

  useEffect(() => {
    if (!SERVICE_WORKER_ENABLED) {
      console.info('[PWA] Service Worker disabled via NEXT_PUBLIC_ENABLE_SERVICE_WORKER')
      return
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] Service Workers not supported')
      return
    }

    setState((prev) => ({ ...prev, isSupported: true }))

    registerServiceWorker()

    const handleOnline = () => setState((prev) => ({ ...prev, isOnline: true }))
    const handleOffline = () => setState((prev) => ({ ...prev, isOnline: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setState((prev) => ({ ...prev, isOnline: navigator.onLine }))

    getCacheSize()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const registerServiceWorker = async () => {
    if (!SERVICE_WORKER_ENABLED) return
    if (!('serviceWorker' in navigator)) return

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none', // Always check for updates
      })

      console.log('[PWA] Service Worker registered:', registration.scope)
      setState((prev) => ({ ...prev, isInstalled: true }))

      // Check for updates every 1 hour
      setInterval(() => {
        registration.update()
      }, 60 * 60 * 1000)

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        console.log('[PWA] New service worker found')

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New service worker installed, update available')
              setState((prev) => ({ ...prev, needsUpdate: true }))
            }
          })
        }
      })

      // Get last update time
      if (registration.active) {
        setState((prev) => ({ ...prev, lastUpdate: new Date() }))
      }
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error)
    }
  }

  const getCacheSize = async () => {
    if (!SERVICE_WORKER_ENABLED) return
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return
    }

    try {
      const messageChannel = new MessageChannel()

      const sizePromise = new Promise<number>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.size || 0)
        }
      })

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2],
      )

      const size = await sizePromise
      setState((prev) => ({ ...prev, cacheSize: size }))
    } catch (error) {
      console.error('[PWA] Failed to get cache size:', error)
    }
  }

  const updateServiceWorker = async () => {
    if (!SERVICE_WORKER_ENABLED) return
    if (!('serviceWorker' in navigator)) return

    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.waiting) {
        // Send message to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })

        // Reload page when new SW takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })
      }
    } catch (error) {
      console.error('[PWA] Failed to update service worker:', error)
    }
  }

  const clearCache = async () => {
    if (!SERVICE_WORKER_ENABLED) return false
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return false
    }

    try {
      const messageChannel = new MessageChannel()

      const clearPromise = new Promise<boolean>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success || false)
        }
      })

      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2],
      )

      const success = await clearPromise
      if (success) {
        setState((prev) => ({ ...prev, cacheSize: 0 }))
      }
      return success
    } catch (error) {
      console.error('[PWA] Failed to clear cache:', error)
      return false
    }
  }

  const requestPersistentStorage = async () => {
    if (!SERVICE_WORKER_ENABLED) return false
    if (!('storage' in navigator) || !('persist' in navigator.storage)) {
      return false
    }

    try {
      const isPersisted = await navigator.storage.persist()
      console.log('[PWA] Persistent storage:', isPersisted ? 'granted' : 'denied')
      return isPersisted
    } catch (error) {
      console.error('[PWA] Failed to request persistent storage:', error)
      return false
    }
  }

  const getStorageEstimate = async () => {
    if (!SERVICE_WORKER_ENABLED) return null
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return null
    }

    try {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentUsed: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0,
      }
    } catch (error) {
      console.error('[PWA] Failed to get storage estimate:', error)
      return null
    }
  }

  return {
    ...state,
    updateServiceWorker,
    clearCache,
    requestPersistentStorage,
    getStorageEstimate,
    refreshCacheSize: getCacheSize,
  }
}

// Format bytes to human readable
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
