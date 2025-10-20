/**
 * Network optimization utilities for cellular connections
 * Helps reduce data usage and improve performance on slow connections
 */

export interface NetworkQuality {
  type: 'excellent' | 'good' | 'fair' | 'poor' | 'offline'
  speed: '4g' | '3g' | '2g' | 'slow-2g' | 'offline'
  latency: number // estimated latency in ms
  recommendedCompression: boolean
  recommendedCacheTimeout: number // milliseconds
}

/**
 * Detect current network conditions and quality
 */
export function detectNetworkQuality(): NetworkQuality {
  if (typeof window === 'undefined') {
    return {
      type: 'offline',
      speed: 'offline',
      latency: 0,
      recommendedCompression: true,
      recommendedCacheTimeout: 30 * 60 * 1000 // 30 minutes
    }
  }

  // Check if online
  if (!navigator.onLine) {
    return {
      type: 'offline',
      speed: 'offline',
      latency: 0,
      recommendedCompression: true,
      recommendedCacheTimeout: 60 * 60 * 1000 // 1 hour
    }
  }

  // Check connection API (available in modern browsers)
  if ('connection' in navigator) {
    const connection = (navigator as any).connection

    if (connection) {
      const effectiveType = connection.effectiveType || '4g'
      const downlink = connection.downlink || 10

      switch (effectiveType) {
        case '4g':
          if (downlink >= 5) {
            return {
              type: 'excellent',
              speed: '4g',
              latency: 50,
              recommendedCompression: false,
              recommendedCacheTimeout: 5 * 60 * 1000 // 5 minutes
            }
          } else {
            return {
              type: 'good',
              speed: '4g',
              latency: 100,
              recommendedCompression: false,
              recommendedCacheTimeout: 10 * 60 * 1000 // 10 minutes
            }
          }

        case '3g':
          return {
            type: 'fair',
            speed: '3g',
            latency: 200,
            recommendedCompression: true,
            recommendedCacheTimeout: 15 * 60 * 1000 // 15 minutes
          }

        case '2g':
          return {
            type: 'poor',
            speed: '2g',
            latency: 500,
            recommendedCompression: true,
            recommendedCacheTimeout: 30 * 60 * 1000 // 30 minutes
          }

        case 'slow-2g':
          return {
            type: 'poor',
            speed: 'slow-2g',
            latency: 1000,
            recommendedCompression: true,
            recommendedCacheTimeout: 60 * 60 * 1000 // 1 hour
          }

        default:
          return {
            type: 'fair',
            speed: '3g',
            latency: 300,
            recommendedCompression: true,
            recommendedCacheTimeout: 20 * 60 * 1000 // 20 minutes
          }
      }
    }
  }

  // Fallback for browsers without connection API
  // Estimate based on user agent or other heuristics
  return {
    type: 'fair',
    speed: '3g',
    latency: 300,
    recommendedCompression: true,
    recommendedCacheTimeout: 15 * 60 * 1000 // 15 minutes
  }
}

/**
 * Get optimal settings for data loading based on network quality
 */
export function getOptimalDataSettings(networkQuality: NetworkQuality) {
  return {
    enableCompression: networkQuality.recommendedCompression,
    cacheTimeout: networkQuality.recommendedCacheTimeout,
    maxRetries: networkQuality.type === 'poor' ? 5 : networkQuality.type === 'fair' ? 3 : 2,
    enableOfflineMode: true,
    // Reduce data for poor connections
    dataReduction: networkQuality.type === 'poor' || networkQuality.type === 'offline',
    // Use smaller images/thumbnails on slow connections
    imageQuality: networkQuality.type === 'excellent' ? 'high' : networkQuality.type === 'good' ? 'medium' : 'low'
  }
}

/**
 * Calculate data savings from compression
 */
export function calculateDataSavings(originalSize: number, compressedSize: number) {
  if (originalSize === 0) return { savings: 0, ratio: 0 }

  const savings = originalSize - compressedSize
  const ratio = (savings / originalSize) * 100

  return {
    savings,
    ratio: Math.round(ratio * 10) / 10, // Round to 1 decimal
    savingsFormatted: formatDataSize(savings),
    originalFormatted: formatDataSize(originalSize),
    compressedFormatted: formatDataSize(compressedSize)
  }
}

/**
 * Format data size in human readable format
 */
export function formatDataSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

/**
 * Estimate cellular data cost (rough estimate)
 */
export function estimateDataCost(bytes: number, costPerMB: number = 0.1): number {
  const mb = bytes / (1024 * 1024)
  return Math.round(mb * costPerMB * 100) / 100 // Round to 2 decimals
}

/**
 * Get battery optimization settings for cellular connections
 */
export function getBatteryOptimizationSettings(networkQuality: NetworkQuality) {
  return {
    // Reduce update frequency on poor connections
    updateInterval: networkQuality.type === 'poor' ? 300000 : // 5 minutes
                     networkQuality.type === 'fair' ? 120000 : // 2 minutes
                     60000, // 1 minute for good/excellent
    // Disable background updates on very poor connections
    enableBackgroundUpdates: networkQuality.type !== 'offline' && networkQuality.type !== 'poor',
    // Use less CPU-intensive operations
    reduceAnimations: networkQuality.type === 'poor' || networkQuality.type === 'fair',
    // Prefetch less data
    prefetchEnabled: networkQuality.type === 'excellent' || networkQuality.type === 'good'
  }
}

/**
 * Monitor data usage (basic implementation)
 */
export class DataUsageMonitor {
  private startTime: number
  private dataTransferred: number = 0
  private requests: number = 0

  constructor() {
    this.startTime = Date.now()
  }

  recordTransfer(bytes: number) {
    this.dataTransferred += bytes
    this.requests++
  }

  getStats() {
    const duration = (Date.now() - this.startTime) / 1000 // seconds
    const speed = duration > 0 ? this.dataTransferred / duration : 0 // bytes per second

    return {
      totalData: this.dataTransferred,
      totalRequests: this.requests,
      duration,
      averageSpeed: speed,
      formattedData: formatDataSize(this.dataTransferred),
      formattedSpeed: `${formatDataSize(speed)}/s`
    }
  }

  reset() {
    this.startTime = Date.now()
    this.dataTransferred = 0
    this.requests = 0
  }
}

/**
 * Create a global data usage monitor instance
 */
export const globalDataMonitor = new DataUsageMonitor()