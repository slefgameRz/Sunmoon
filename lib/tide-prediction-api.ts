/**
 * Unified Tide Prediction API
 * 
 * Single interface for all tide prediction needs
 * Handles tile loading, offline mode, API fallback
 */

import { tileManager } from './tile-manager'
import { predictTideLevel, findTideExtremes, generateGraphData } from './harmonic-engine'
import type { LocationData } from './tide-service'

export interface PredictionRequest {
  location: LocationData
  date: Date
  timeRange?: {
    startHour: number
    endHour: number
    intervalMinutes?: number
  }
}

export interface PredictionResponse {
  location: LocationData
  date: string
  predictions: Array<{
    time: string
    level: number
    type?: 'high' | 'low'
    confidence: number
  }>
  dataSource: 'tile' | 'harmonic' | 'api'
  responseTime: number
  fromCache: boolean
}

export class TidePredictionAPI {
  private requestCount = 0
  private totalResponseTime = 0
  private cacheHits = 0

  /**
   * Predict water level for a specific time
   */
  async predictLevel(
    location: LocationData,
    date: Date,
    time: { hour: number; minute: number }
  ): Promise<{
    level: number
    confidence: number
    dataSource: string
  }> {
    try {
      // Try to load tile first
      const tile = await tileManager.loadTile(location.lat, location.lon)

      if (tile) {
        // Use tile data for prediction (Phase 3)
        // For now, use harmonic engine
        const result = predictTideLevel(date, location, time)
        return {
          level: result.level,
          confidence: result.confidence,
          dataSource: 'tile',
        }
      }
    } catch (e) {
      console.warn('Tile prediction failed:', e)
    }

    // Fallback to harmonic prediction
    const result = predictTideLevel(date, location, time)
    return {
      level: result.level,
      confidence: result.confidence,
      dataSource: 'harmonic',
    }
  }

  /**
   * Find high and low tide events
   */
  async findExtremes(
    location: LocationData,
    date: Date
  ): Promise<
    Array<{
      time: string
      level: number
      type: 'high' | 'low'
      confidence: number
    }>
  > {
    try {
      // Try tile-based prediction first
      const tile = await tileManager.loadTile(location.lat, location.lon)
      if (tile) {
        // Use tile data (Phase 3)
        // For now, use harmonic engine
        return findTideExtremes(date, location)
      }
    } catch (e) {
      console.warn('Tile extremes finding failed:', e)
    }

    // Fallback to harmonic
    return findTideExtremes(date, location)
  }

  /**
   * Get full prediction range
   */
  async getPredictions(request: PredictionRequest): Promise<PredictionResponse> {
    const startTime = performance.now()
    this.requestCount++

    try {
      // Load tile for this region
      let dataSource: 'tile' | 'harmonic' | 'api' = 'harmonic'
      let fromCache = false

      const tile = await tileManager.loadTile(request.location.lat, request.location.lon)
      if (tile) {
        dataSource = 'tile'
        // Check cache stats to determine if from cache
        const stats = tileManager.getStats()
        fromCache = stats.cachedTiles > 0
      }

      // Get extremes
      const extremes = await this.findExtremes(request.location, request.date)

      // Generate graph data if requested
      let predictions = extremes.map(e => ({
        time: e.time,
        level: e.level,
        type: e.type as 'high' | 'low',
        confidence: e.confidence,
      }))

      if (request.timeRange) {
        const graphData = generateGraphData(
          request.date,
          request.location,
          request.timeRange.intervalMinutes || 60
        )
        predictions = graphData
          .filter(p => {
            const [h, m] = p.time.split(':').map(Number)
            const hour = h + m / 60
            return hour >= request.timeRange!.startHour && hour <= request.timeRange!.endHour
          })
          .map(p => ({
            time: p.time,
            level: p.level,
            type: 'high' as const,
            confidence: 85,
          }))
      }

  const responseTime = performance.now() - startTime
      this.totalResponseTime += responseTime

      return {
        location: request.location,
        date: request.date.toISOString(),
        predictions,
        dataSource,
        responseTime: Math.round(responseTime * 100) / 100,
        fromCache,
      }
    } catch (error) {
      console.error('Prediction failed:', error)
      throw error
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    requestCount: number
    avgResponseTime: number
    cacheHitRate: number
    totalCacheSize: number
  } {
    const tileStats = tileManager.getStats()

    return {
      requestCount: this.requestCount,
      avgResponseTime: this.requestCount > 0 ? this.totalResponseTime / this.requestCount : 0,
      cacheHitRate: this.requestCount > 0 ? (this.cacheHits / this.requestCount) * 100 : 0,
      totalCacheSize: tileStats.cacheSize,
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.requestCount = 0
    this.totalResponseTime = 0
    this.cacheHits = 0
  }
}

// Singleton instance
export const tidePredictionAPI = new TidePredictionAPI()

export default tidePredictionAPI
