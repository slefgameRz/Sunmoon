/**
 * Query Optimization and Caching Strategy
 * 
 * Implements intelligent caching for prediction queries
 * with smart invalidation and prefetching
 */

export interface CachedPrediction {
  key: string
  location: { lat: number; lon: number; name: string }
  date: string
  predictions: any[]
  timestamp: number
  ttl: number // milliseconds
  hitCount: number
}

export interface CacheStats {
  totalHits: number
  totalMisses: number
  hitRate: number
  cacheSize: number
  memorySizeBytes: number
}

/**
 * Smart query cache for predictions
 */
class PredictionQueryCache {
  private cache = new Map<string, CachedPrediction>()
  private readonly maxCacheSize = 100
  private totalHits = 0
  private totalMisses = 0

  /**
   * Generate cache key for prediction query
   */
  private generateKey(
    lat: number,
    lon: number,
    date: string,
    precision: number = 2 // rounds lat/lon to 2 decimal places
  ): string {
    const roundedLat = Math.round(lat * Math.pow(10, precision)) / Math.pow(10, precision)
    const roundedLon = Math.round(lon * Math.pow(10, precision)) / Math.pow(10, precision)
    return `${roundedLat},${roundedLon}:${date}`
  }

  /**
   * Get cached prediction
   */
  get(
    lat: number,
    lon: number,
    date: string
  ): {
    predictions: any[]
    hitCount: number
  } | null {
    const key = this.generateKey(lat, lon, date)
    const cached = this.cache.get(key)

    if (!cached) {
      this.totalMisses++
      return null
    }

    // Check if expired
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      this.totalMisses++
      return null
    }

    // Update hit count
    cached.hitCount++
    this.totalHits++

    return {
      predictions: cached.predictions,
      hitCount: cached.hitCount,
    }
  }

  /**
   * Cache prediction result
   */
  set(
    lat: number,
    lon: number,
    date: string,
    predictions: any[],
    ttlMinutes: number = 60
  ): void {
    const key = this.generateKey(lat, lon, date)

    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldest = Array.from(this.cache.values()).reduce((a, b) =>
        a.timestamp < b.timestamp ? a : b
      )
      this.cache.delete(oldest.key)
    }

    this.cache.set(key, {
      key,
      location: { lat, lon, name: '' },
      date,
      predictions,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000,
      hitCount: 0,
    })
  }

  /**
   * Invalidate nearby locations
   */
  invalidateNearby(lat: number, lon: number, radiusKm: number = 10): number {
    let count = 0

    for (const [key, cached] of this.cache.entries()) {
      const distance = this.calculateDistance(
        lat,
        lon,
        cached.location.lat,
        cached.location.lon
      )

      if (distance < radiusKm) {
        this.cache.delete(key)
        count++
      }
    }

    return count
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    let memorySizeBytes = 0

    for (const cached of this.cache.values()) {
      memorySizeBytes += JSON.stringify(cached).length
    }

    const total = this.totalHits + this.totalMisses
    const hitRate = total > 0 ? (this.totalHits / total) * 100 : 0

    return {
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: this.cache.size,
      memorySizeBytes,
    }
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.totalHits = 0
    this.totalMisses = 0
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
}

// Singleton instance
export const predictionQueryCache = new PredictionQueryCache()

export default predictionQueryCache
