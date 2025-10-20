/**
 * Memory Optimization and Device Profiling
 * 
 * Adapts tile loading, cache size, and prediction resolution
 * based on available device resources
 */

export interface DeviceProfile {
  deviceType: 'mobile' | 'tablet' | 'desktop'
  memoryAvailable: number // MB
  memoryUsed: number // MB
  cpuCores: number
  networkSpeed: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'unknown'
  touchCapable: boolean
}

export interface OptimizationSettings {
  maxCacheSize: number // MB
  tileBatchSize: number // how many tiles to load at once
  predictionResolution: number // minutes between points
  graphUpdateFrequency: number // milliseconds
  preloadRadius: number // kilometers to preload tiles
}

/**
 * Device profiler and optimizer
 */
class DeviceOptimizer {
  private profile: DeviceProfile | null = null
  private settings: OptimizationSettings | null = null

  /**
   * Detect device capabilities
   */
  detectDevice(): DeviceProfile {
    // Get memory info if available
    const memory = (performance as unknown as { memory?: { jsHeapSizeLimit: number } }).memory
    const memoryAvailable = memory?.jsHeapSizeLimit || 512 // MB (default 512MB)

    // Detect device type
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop'

    if (/mobile|android|iphone|ipad/i.test(ua)) {
      deviceType = /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile'
    }

    // Get CPU core count
    const cpuCores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4

    // Detect network speed (simplified)
    const networkSpeed = this.detectNetworkSpeed()

    // Touch capable
    const touchCapable = typeof navigator !== 'undefined' ? 'ontouchstart' in window || navigator.maxTouchPoints > 0 : false

    this.profile = {
      deviceType,
      memoryAvailable: Math.round(memoryAvailable / 1024 / 1024 * 10) / 10, // Convert to MB
      memoryUsed: 0,
      cpuCores,
      networkSpeed,
      touchCapable,
    }

    return this.profile
  }

  /**
   * Detect network speed
   */
  private detectNetworkSpeed(): 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'unknown' {
    if (typeof navigator === 'undefined') return 'unknown'

    const connection = (navigator as unknown as { connection?: { effectiveType: string } }).connection
    if (!connection) return 'unknown'

    const type = connection.effectiveType
    return (type as 'slow-2g' | '2g' | '3g' | '4g' | '5g') || 'unknown'
  }

  /**
   * Get optimized settings based on device profile
   */
  optimizeSettings(profile?: DeviceProfile): OptimizationSettings {
    const p = profile || this.detectDevice()

    // Adjust cache size based on device memory
    let maxCacheSize = 50 // MB default

    if (p.deviceType === 'mobile') {
      maxCacheSize = p.memoryAvailable > 256 ? 25 : 10
    } else if (p.deviceType === 'tablet') {
      maxCacheSize = p.memoryAvailable > 512 ? 50 : 25
    } else {
      maxCacheSize = Math.min(100, p.memoryAvailable / 5) // Use 1/5 of available
    }

    // Adjust tile batch size based on network
    let tileBatchSize = 5
    if (p.networkSpeed === 'slow-2g' || p.networkSpeed === '2g') {
      tileBatchSize = 1
    } else if (p.networkSpeed === '3g') {
      tileBatchSize = 2
    } else if (p.networkSpeed === '4g' || p.networkSpeed === '5g') {
      tileBatchSize = 10
    }

    // Adjust prediction resolution (fewer points on mobile)
    let predictionResolution = 60 // minutes
    if (p.deviceType === 'mobile') {
      predictionResolution = 120 // Lower resolution on mobile
    }

    // Graph update frequency
    let graphUpdateFrequency = 500 // ms
    if (p.cpuCores < 2) {
      graphUpdateFrequency = 1000 // Slower on single-core
    }

    // Preload radius (load fewer tiles on mobile/slow network)
    let preloadRadius = 50 // km
    if (p.deviceType === 'mobile' || p.networkSpeed === '2g' || p.networkSpeed === '3g') {
      preloadRadius = 25
    }

    this.settings = {
      maxCacheSize,
      tileBatchSize,
      predictionResolution,
      graphUpdateFrequency,
      preloadRadius,
    }

    return this.settings
  }

  /**
   * Get current profile
   */
  getProfile(): DeviceProfile {
    return this.profile || this.detectDevice()
  }

  /**
   * Get current settings
   */
  getSettings(): OptimizationSettings {
    return this.settings || this.optimizeSettings()
  }

  /**
   * Estimate tile download time
   */
  estimateDownloadTime(tileSizeKB: number, profile?: DeviceProfile): number {
    const p = profile || this.profile || this.detectDevice()

    // Estimate bandwidth in MB/s based on network type
    let bandwidthMBps = 1 // 1MB/s default
    switch (p.networkSpeed) {
      case 'slow-2g':
        bandwidthMBps = 0.05 // 50KB/s
        break
      case '2g':
        bandwidthMBps = 0.1 // 100KB/s
        break
      case '3g':
        bandwidthMBps = 0.5 // 500KB/s
        break
      case '4g':
        bandwidthMBps = 5 // 5MB/s
        break
      case '5g':
        bandwidthMBps = 20 // 20MB/s
        break
    }

    const timeSeconds = (tileSizeKB / 1024) / bandwidthMBps
    return timeSeconds * 1000 // Convert to ms
  }

  /**
   * Check if device can handle full prediction range
   */
  shouldReducePredictionRange(): boolean {
    const profile = this.getProfile()
    return profile.deviceType === 'mobile' || profile.memoryAvailable < 256
  }

  /**
   * Check if should preload tiles
   */
  shouldPreloadTiles(): boolean {
    const profile = this.getProfile()
    // Only preload on good networks and sufficient memory
    return (
      (profile.networkSpeed === '4g' || profile.networkSpeed === '5g') &&
      profile.memoryAvailable > 512
    )
  }
}

// Singleton instance
export const deviceOptimizer = new DeviceOptimizer()

export default deviceOptimizer
