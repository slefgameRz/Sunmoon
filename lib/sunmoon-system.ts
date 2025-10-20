/**
 * Sunmoon Tide Prediction System - Main Integration
 * เชื่อมทุกระบบเข้าด้วยกัน: Service Worker, IndexedDB, Harmonic Engine, API
 */

import { registerServiceWorker, getCacheSize } from './sw-registration'
import { tileStorage } from './tile-storage'
import { getLocationConstituents, predictWaterLevel } from './harmonic-prediction'
import type { TidalConstituent } from './harmonic-prediction'

export interface SystemStatus {
  engine: { type: 'javascript'; optimized: boolean; description: string }
  serviceWorker: { registered: boolean; active: boolean }
  indexedDB: { available: boolean; size: number }
  apis: { 
    openweather: { status: 'ok' | 'error'; latency?: number }
    stormglass: { status: 'ok' | 'error'; latency?: number }
  }
  offline: boolean
}

export class SunmoonTideSystem {
  private static instance: SunmoonTideSystem
  private tileStorageAvailable = false
  private systemStatus: SystemStatus = {
    engine: { type: 'javascript', optimized: true, description: 'Harmonic JS engine (37 constituents)' },
    serviceWorker: { registered: false, active: false },
    indexedDB: { available: false, size: 0 },
    apis: {
      openweather: { status: 'error' },
      stormglass: { status: 'error' }
    },
    offline: !navigator.onLine
  }

  private constructor() {
    // Singleton pattern
  }

  static getInstance(): SunmoonTideSystem {
    if (!SunmoonTideSystem.instance) {
      SunmoonTideSystem.instance = new SunmoonTideSystem()
    }
    return SunmoonTideSystem.instance
  }

  /**
   * Initialize all systems
   */
  async initialize(): Promise<SystemStatus> {
    console.log('๐Ÿš€ Initializing Sunmoon Tide Prediction System...')

    // 1. Initialize computation engine (pure JavaScript)
    console.log('โœ… JavaScript harmonic engine ready')
    this.systemStatus.engine = {
      type: 'javascript',
      optimized: true,
      description: 'Client-side harmonic predictor (37 constituents + nodal corrections)'
    }

    // 2. Register Service Worker
    try {
      if ('serviceWorker' in navigator) {
        const registration = await registerServiceWorker()
        this.systemStatus.serviceWorker = {
          registered: !!registration,
          active: !!registration?.active
        }
        console.log('โœ… Service Worker registered')
      }
    } catch (error) {
      console.warn('โš ๏ธ  Service Worker registration failed', error)
    }

    // 3. Initialize IndexedDB
    try {
      const estimate = await tileStorage.getStorageEstimate()
      const size = await getCacheSize()
      this.systemStatus.indexedDB = {
        available: true,
        size
      }
      this.tileStorageAvailable = true
      console.log(`โœ… IndexedDB ready (${(size / 1024 / 1024).toFixed(2)} MB)`)
    } catch (error) {
      console.warn('โš ๏ธ  IndexedDB initialization failed', error)
      this.systemStatus.indexedDB = { available: false, size: 0 }
    }

    // 4. Check API health
    try {
      const healthResponse = await fetch('/api/health')
      if (healthResponse.ok) {
        const health = await healthResponse.json()
        this.systemStatus.apis = {
          openweather: { 
            status: health.openweather?.status === 'ok' ? 'ok' : 'error',
            latency: health.openweather?.latency 
          },
          stormglass: { 
            status: health.stormglass?.status === 'ok' ? 'ok' : 'error',
            latency: health.stormglass?.latency 
          }
        }
        console.log('โœ… API health check passed')
      }
    } catch (error) {
      console.warn('โš ๏ธ  API health check failed', error)
    }

    // 5. Listen for online/offline events
    window.addEventListener('online', () => {
      this.systemStatus.offline = false
      console.log('๐ŸŸข Network: Online')
    })
    
    window.addEventListener('offline', () => {
      this.systemStatus.offline = true
      console.log('๐Ÿ"ด Network: Offline')
    })

    console.log('โœ… System initialization complete')
    return this.systemStatus
  }

  /**
   * Get current system status
   */
  getStatus(): SystemStatus {
    return { ...this.systemStatus }
  }

  /**
   * Predict tide levels for a location
   */
  async predictTide(
    location: { lat: number; lon: number; name: string },
    startDate: Date,
    hours: number = 72
  ): Promise<{ time: Date; level: number; type?: 'high' | 'low' }[]> {
    console.log(`๐ŸŒŠ Predicting tide for ${location.name}...`)

    // Get constituents for location
    const constituents = getLocationConstituents(location)
    
    // Generate timestamps
    const timestamps: Date[] = []
    for (let i = 0; i < hours; i++) {
      const date = new Date(startDate)
      date.setHours(date.getHours() + i)
      timestamps.push(date)
    }

    // Use WASM if available, otherwise JavaScript
    const waterLevels = timestamps.map(d => predictWaterLevel(d, location, constituents))

    // Format results
    const results = timestamps.map((time, i) => ({
      time,
      level: waterLevels[i]
    }))

    // Detect high/low tides
    this.detectHighLowTides(results)

    return results
  }

  /**
   * Detect high and low tides
   */
  private detectHighLowTides(
    data: { time: Date; level: number; type?: 'high' | 'low' }[]
  ): void {
    for (let i = 1; i < data.length - 1; i++) {
      const prev = data[i - 1].level
      const curr = data[i].level
      const next = data[i + 1].level

      if (curr > prev && curr > next) {
        data[i].type = 'high'
      } else if (curr < prev && curr < next) {
        data[i].type = 'low'
      }
    }
  }

  /**
   * Get tile for location (with caching)
   */
  async getTile(lat: number, lon: number): Promise<any> {
    const tileId = `tile_${lat.toFixed(4)}_${lon.toFixed(4)}`

    // Try cache first
    try {
      const cached = await tileStorage.getTile(tileId)
      if (cached) {
        console.log(`๐Ÿ'พ Loaded tile from cache: ${tileId}`)
        return cached
      }
    } catch (error) {
      console.warn('Cache read failed', error)
    }

    // Fetch from API
    try {
      const response = await fetch(`/api/tiles/${lat}/${lon}`)
      if (!response.ok) throw new Error('Tile fetch failed')

      const payload = await response.json() as { tile: any; payload: string }
      if (!payload?.tile || typeof payload.payload !== 'string') {
        throw new Error('Malformed tile payload')
      }

      // Save to cache
      await tileStorage.saveBase64Tile(payload.tile, payload.payload)
      console.log(`๐Ÿ'พ Saved tile to cache: ${tileId}`)

      return payload.tile
    } catch (error) {
      console.error('Tile fetch failed', error)
      throw error
    }
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    if (this.tileStorageAvailable) {
      await tileStorage.clearAll()
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      )
    }

    console.log('๐Ÿงน Cache cleared')
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    tiles: number
    size: number
    oldestTile: Date | null
    newestTile: Date | null
  }> {
    if (!this.tileStorageAvailable) {
      return { tiles: 0, size: 0, oldestTile: null, newestTile: null }
    }

    const allTiles = await tileStorage.getAllTiles()
    const size = await getCacheSize()

    let oldestTile: Date | null = null
    let newestTile: Date | null = null

    if (allTiles.length > 0) {
      const timestamps = allTiles.map((t: any) => t.lastAccessedAt).sort()
      oldestTile = new Date(timestamps[0])
      newestTile = new Date(timestamps[timestamps.length - 1])
    }

    return {
      tiles: allTiles.length,
      size,
      oldestTile,
      newestTile
    }
  }
}

// Export singleton instance
export const sunmoonSystem = SunmoonTideSystem.getInstance()

// Auto-initialize on import (can be disabled if needed)
if (typeof window !== 'undefined') {
  sunmoonSystem.initialize().catch(console.error)
}
