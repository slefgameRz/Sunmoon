/**
 * Offline Manager - Comprehensive offline support with compression
 * Handles caching, compression, sync, and offline-first strategies
 */

import type { TideData, WeatherData, LocationData } from './tide-service'
import { compressTideData, decompressTideData, compressWeatherData, decompressWeatherData } from './data-compression'
import { getStorageKey, isCacheValid, saveTideDataCache, saveWeatherDataCache, loadTideDataCache, loadWeatherDataCache } from './offline-storage'

export interface OfflineConfig {
  enableCompression: boolean
  enableServiceWorker: boolean
  maxCacheAge: number // milliseconds
  maxStorageSize: number // bytes
  enableBackgroundSync: boolean
}

export interface SyncStatus {
  isSyncing: boolean
  lastSync: number
  pendingUpdates: number
  failedUpdates: number
}

class OfflineManager {
  private config: OfflineConfig
  private syncStatus: SyncStatus
  private compressionCache: Map<string, unknown>

  constructor(config: Partial<OfflineConfig> = {}) {
    this.config = {
      enableCompression: true,
      enableServiceWorker: true,
      maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
      maxStorageSize: 5 * 1024 * 1024, // 5MB
      enableBackgroundSync: true,
      ...config,
    }

    this.syncStatus = {
      isSyncing: false,
      lastSync: 0,
      pendingUpdates: 0,
      failedUpdates: 0,
    }

    this.compressionCache = new Map()
    this.initializeServiceWorker()
  }

  /**
   * Initialize service worker if available
   */
  private initializeServiceWorker(): void {
    if (!this.config.enableServiceWorker || typeof window === 'undefined') {
      return
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((registration) => {
        console.log('[Offline] Service Worker registered:', registration)
      }).catch((error) => {
        console.warn('[Offline] Service Worker registration failed:', error)
      })
    }
  }

  /**
   * Save tide data with compression
   */
  async saveTideData(location: LocationData, tideData: TideData, date?: Date): Promise<void> {
    const key = getStorageKey('tide', location.lat, location.lon, date)

    if (this.config.enableCompression) {
      // Compress and save
      const compressed = compressTideData({
        currentWaterLevel: tideData.currentWaterLevel,
        highTideTime: tideData.highTideTime,
        lowTideTime: tideData.lowTideTime,
        tideEvents: tideData.tideEvents || [],
        lunarPhaseKham: tideData.lunarPhaseKham,
        tideStatus: tideData.tideStatus,
        isWaxingMoon: tideData.isWaxingMoon,
        graphData: tideData.graphData || [],
        apiStatus: tideData.apiStatus,
        lastUpdated: tideData.lastUpdated,
      })

      this.compressionCache.set(key, compressed)
      saveTideDataCache(location.lat, location.lon, date, tideData)
      console.log(`[Offline] Saved tide data (compressed): ${key}`)
    } else {
      saveTideDataCache(location.lat, location.lon, date, tideData)
      console.log(`[Offline] Saved tide data: ${key}`)
    }
  }

  /**
   * Load tide data with decompression
   */
  async loadTideData(location: LocationData, date?: Date): Promise<TideData | null> {
    const key = getStorageKey('tide', location.lat, location.lon, date)

    // Check compression cache first
    if (this.compressionCache.has(key)) {
      const compressed = this.compressionCache.get(key)
      if (this.config.enableCompression && compressed) {
        try {
          const decompressed = decompressTideData(compressed as any)
          return {
            ...decompressed,
            waterLevelStatus: 'ไม่ทราบ',
            waterLevelReference: 'ไม่ทราบแหล่งอ้างอิง',
            seaLevelRiseReference: 'ไม่ทราบแหล่งอ้างอิง',
            isSeaLevelHighToday: false,
            pierDistance: 0,
            pierReference: 'ไม่ทราบแหล่งอ้างอิง',
          } as TideData
        } catch (error) {
          console.warn('[Offline] Decompression failed, loading uncompressed:', error)
        }
      }
    }

    // Load from offline storage
    const tideData = loadTideDataCache(location.lat, location.lon, date)
    if (tideData) {
      return tideData as TideData
    }

    return null
  }

  /**
   * Save weather data with compression
   */
  async saveWeatherData(location: LocationData, weatherData: WeatherData): Promise<void> {
    const key = getStorageKey('weather', location.lat, location.lon)

    if (this.config.enableCompression) {
      const compressed = compressWeatherData(weatherData)
      this.compressionCache.set(key, compressed)
      saveWeatherDataCache(location.lat, location.lon, weatherData)
      console.log(`[Offline] Saved weather data (compressed): ${key}`)
    } else {
      saveWeatherDataCache(location.lat, location.lon, weatherData)
      console.log(`[Offline] Saved weather data: ${key}`)
    }
  }

  /**
   * Load weather data with decompression
   */
  async loadWeatherData(location: LocationData): Promise<WeatherData | null> {
    const key = getStorageKey('weather', location.lat, location.lon)

    // Check compression cache first
    if (this.compressionCache.has(key)) {
      const compressed = this.compressionCache.get(key)
      if (this.config.enableCompression && compressed) {
        try {
          return decompressWeatherData(compressed as any)
        } catch (error) {
          console.warn('[Offline] Decompression failed, loading uncompressed:', error)
        }
      }
    }

    // Load from offline storage
    const weatherData = loadWeatherDataCache(location.lat, location.lon)
    if (weatherData) {
      return weatherData as WeatherData
    }

    return null
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    if (typeof navigator === 'undefined') return true
    return navigator.onLine
  }

  /**
   * Get storage size estimate
   */
  async getStorageSizeEstimate(): Promise<{ usage: number; quota: number }> {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
      return { usage: 0, quota: this.config.maxStorageSize }
    }

    try {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || this.config.maxStorageSize,
      }
    } catch (error) {
      console.warn('[Offline] Failed to estimate storage:', error)
      return { usage: 0, quota: this.config.maxStorageSize }
    }
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    this.compressionCache.clear()
    
    if (typeof caches !== 'undefined') {
      const cacheNames = await caches.keys()
      await Promise.all(cacheNames.map((name) => caches.delete(name)))
      console.log('[Offline] Cache cleared')
    }
  }

  /**
   * Initialize persistent storage
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
      console.warn('[Offline] Persistent storage not available')
      return false
    }

    try {
      const persistent = await navigator.storage.persist()
      console.log('[Offline] Persistent storage granted:', persistent)
      return persistent
    } catch (error) {
      console.warn('[Offline] Failed to request persistent storage:', error)
      return false
    }
  }
}

// Singleton instance
let offlineManager: OfflineManager | null = null

export function getOfflineManager(config?: Partial<OfflineConfig>): OfflineManager {
  if (!offlineManager) {
    offlineManager = new OfflineManager(config)
  }
  return offlineManager
}

export function resetOfflineManager(): void {
  offlineManager = null
}
