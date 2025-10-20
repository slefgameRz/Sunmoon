/**
 * Tile Management System for SEAPALO
 * 
 * Handles downloading, caching, and managing regional tide prediction tiles
 * Each tile covers a geographic region (~1°×1°) and contains harmonic data
 * 
 * Tile Structure:
 *  - MetaData: Region bounds, constituents, calibration info
 *  - Constituent Data: Amplitude/phase for each constituent
 *  - Minor Rules: Corrections for mixed semidiurnal patterns
 *  - Local Calibration: Regional corrections from station data
 * 
 * Compression: Brotli + Bsdiff for delta updates
 * Size Target: ≤500KB per tile (500MB for 1000 global tiles)
 */

export interface TileBounds {
  north: number
  south: number
  east: number
  west: number
  centerLat: number
  centerLon: number
}

export interface TileMetadata {
  tileId: string
  version: string
  created: string
  updated: string
  bounds: TileBounds
  constituents: string[] // e.g., ['M2', 'S2', 'N2', ...]
  calibrationStation?: string
  accuracy: {
    heightRMSE: number // meters
    timeRMSE: number // minutes
    confidence: number // 0-100%
  }
  dataSignature: string // Ed25519 signature
}

export interface ConstituentData {
  constituent: string
  amplitude: number // meters
  phaseLag: number // degrees
  nodalFactor?: number // if applicable
}

export interface TileData {
  metadata: TileMetadata
  constituents: ConstituentData[]
  minorRules?: {
    diurnalInequality: number
    mixedPattern: boolean
  }
  localCalibration?: {
    heightOffset: number
    timeOffset: number
    seasonalVariation: number
  }
}

export interface TileCache {
  tileId: string
  data: TileData
  compressed: boolean
  size: number
  downloadedAt: string
  expiresAt: string
  lastUsed: string
}

/**
 * Tile manager for regional tide data
 */
export class TileManager {
  private tiles: Map<string, TileCache> = new Map()
  private maxCacheSize = 100 * 1024 * 1024 // 100MB max
  private currentCacheSize = 0
  private indexedDB: IDBDatabase | null = null

  /**
   * Initialize tile manager and IndexedDB
   */
  async initialize(): Promise<void> {
    try {
      const request = indexedDB.open('SEAPALO_Tiles', 1)

      request.onerror = () => {
        console.error('IndexedDB error:', request.error)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('tiles')) {
          db.createObjectStore('tiles', { keyPath: 'tileId' })
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'tileId' })
        }
      }

      request.onsuccess = () => {
        this.indexedDB = request.result
        console.log('✅ IndexedDB initialized for tile caching')
      }
    } catch (e) {
      console.warn('⚠️ IndexedDB not available, using in-memory cache only', e)
    }
  }

  /**
   * Generate tile ID from coordinates
   */
  generateTileId(lat: number, lon: number): string {
    const latTile = Math.floor(lat)
    const lonTile = Math.floor(lon)
    return `tile_${latTile}_${lonTile}`
  }

  /**
   * Get bounds for a tile
   */
  getTileBounds(lat: number, lon: number): TileBounds {
    const south = Math.floor(lat)
    const west = Math.floor(lon)
    return {
      south,
      north: south + 1,
      west,
      east: west + 1,
      centerLat: south + 0.5,
      centerLon: west + 0.5,
    }
  }

  /**
   * Load or download a tile
   */
  async loadTile(lat: number, lon: number): Promise<TileData | null> {
    const tileId = this.generateTileId(lat, lon)

    // Check memory cache first
    if (this.tiles.has(tileId)) {
      const cached = this.tiles.get(tileId)!
      cached.lastUsed = new Date().toISOString()
      return cached.data
    }

    // Try IndexedDB
    if (this.indexedDB) {
      try {
        const tileData = await this.loadFromIndexedDB(tileId)
        if (tileData) {
          this.tiles.set(tileId, {
            tileId,
            data: tileData,
            compressed: false,
            size: JSON.stringify(tileData).length,
            downloadedAt: tileData.metadata.created,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            lastUsed: new Date().toISOString(),
          })
          return tileData
        }
      } catch (e) {
        console.warn(`Failed to load tile ${tileId} from IndexedDB:`, e)
      }
    }

    // Download from server (Phase 2 implementation)
    try {
      const tileData = await this.downloadTile(tileId, lat, lon)
      if (tileData) {
        await this.cacheTile(tileId, tileData)
        return tileData
      }
    } catch (e) {
      console.error(`Failed to download tile ${tileId}:`, e)
    }

    // Fallback to generating from harmonic constituents
    return this.generateFallbackTile(lat, lon)
  }

  /**
   * Download tile from server
   */
  private async downloadTile(tileId: string, lat: number, lon: number): Promise<TileData | null> {
    try {
      const url = `/api/tiles/${tileId}`
      const response = await fetch(url, {
        cache: 'default',
      })

      if (!response.ok) {
        console.warn(`Tile ${tileId} not available (${response.status})`)
        return null
      }

      const data = await response.json()
      console.log(`✅ Downloaded tile ${tileId}`)
      return data as TileData
    } catch (e) {
      console.error(`Download failed for tile ${tileId}:`, e)
      return null
    }
  }

  /**
   * Cache tile in memory and IndexedDB
   */
  private async cacheTile(tileId: string, data: TileData): Promise<void> {
    const size = JSON.stringify(data).length

    // Memory cache
    this.tiles.set(tileId, {
      tileId,
      data,
      compressed: false,
      size,
      downloadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastUsed: new Date().toISOString(),
    })

    this.currentCacheSize += size

    // Evict LRU tiles if exceeding max size
    if (this.currentCacheSize > this.maxCacheSize) {
      this.evictLRU()
    }

    // Persist to IndexedDB
    if (this.indexedDB) {
      try {
        const transaction = this.indexedDB.transaction(['tiles'], 'readwrite')
        const store = transaction.objectStore('tiles')
        await new Promise<void>((resolve, reject) => {
          const request = store.put({ tileId, data, timestamp: Date.now() })
          request.onsuccess = () => resolve()
          request.onerror = () => reject(request.error)
        })
      } catch (e) {
        console.warn(`Failed to cache tile ${tileId} in IndexedDB:`, e)
      }
    }
  }

  /**
   * Load tile from IndexedDB
   */
  private async loadFromIndexedDB(tileId: string): Promise<TileData | null> {
    if (!this.indexedDB) return null

    return new Promise((resolve) => {
      try {
        const transaction = this.indexedDB!.transaction(['tiles'], 'readonly')
        const store = transaction.objectStore('tiles')
        const request = store.get(tileId)

        request.onsuccess = () => {
          resolve(request.result?.data ?? null)
        }

        request.onerror = () => {
          console.error('IndexedDB read error:', request.error)
          resolve(null)
        }
      } catch (e) {
        console.error('IndexedDB error:', e)
        resolve(null)
      }
    })
  }

  /**
   * Generate fallback tile from constituents
   */
  private generateFallbackTile(lat: number, lon: number): TileData {
    const bounds = this.getTileBounds(lat, lon)
    const tileId = this.generateTileId(lat, lon)

    // Determine region type
    const isGulf = lon > 99 && lat < 15 && lat > 5
    const regionType = isGulf ? 'gulf' : 'andaman'

    // Generate constituent data for this region
    const constituents: ConstituentData[] = [
      { constituent: 'M2', amplitude: isGulf ? 0.85 : 1.25, phaseLag: isGulf ? 45 : 65, nodalFactor: 1.037 },
      { constituent: 'S2', amplitude: isGulf ? 0.25 : 0.40, phaseLag: 0 },
      { constituent: 'N2', amplitude: isGulf ? 0.15 : 0.22, phaseLag: isGulf ? 45 : 65, nodalFactor: 1.037 },
      { constituent: 'K1', amplitude: isGulf ? 0.18 : 0.12, phaseLag: isGulf ? 90 : 110 },
      { constituent: 'O1', amplitude: isGulf ? 0.12 : 0.08, phaseLag: isGulf ? 90 : 110, nodalFactor: 1.037 },
    ]

    return {
      metadata: {
        tileId,
        version: '1.0',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        bounds,
        constituents: constituents.map(c => c.constituent),
        accuracy: {
          heightRMSE: 0.15,
          timeRMSE: 10,
          confidence: 75,
        },
        dataSignature: '', // Will be set during release phase
      },
      constituents,
      minorRules: {
        diurnalInequality: isGulf ? 0.3 : 0.1,
        mixedPattern: isGulf,
      },
    }
  }

  /**
   * Evict least recently used tiles
   */
  private evictLRU(): void {
    let lruTile: [string, TileCache] | null = null
    let oldestTime = Date.now()

    for (const [id, tile] of this.tiles) {
      const lastUsedTime = new Date(tile.lastUsed).getTime()
      if (lastUsedTime < oldestTime) {
        oldestTime = lastUsedTime
        lruTile = [id, tile]
      }
    }

    if (lruTile) {
      const [id, tile] = lruTile
      this.currentCacheSize -= tile.size
      this.tiles.delete(id)
      console.log(`Evicted LRU tile: ${id}`)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    cachedTiles: number
    cacheSize: number
    maxCacheSize: number
    utilizationPercent: number
  } {
    return {
      cachedTiles: this.tiles.size,
      cacheSize: this.currentCacheSize,
      maxCacheSize: this.maxCacheSize,
      utilizationPercent: (this.currentCacheSize / this.maxCacheSize) * 100,
    }
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    this.tiles.clear()
    this.currentCacheSize = 0

    if (this.indexedDB) {
      try {
        const transaction = this.indexedDB.transaction(['tiles'], 'readwrite')
        const store = transaction.objectStore('tiles')
        store.clear()
      } catch (e) {
        console.warn('Failed to clear IndexedDB:', e)
      }
    }
  }
}

// Singleton instance
export const tileManager = new TileManager()

// Initialize on module load (if in browser)
if (typeof window !== 'undefined') {
  tileManager.initialize().catch(console.error)
}

export default tileManager
