/**
 * Performance Profiler and Metrics Collection
 * 
 * Tracks performance across:
 * - API response times
 * - Memory usage
 * - Cache efficiency
 * - Render performance
 * - Network latency
 */

export interface PerformanceMetric {
  timestamp: number
  name: string
  duration: number // milliseconds
  category: 'api' | 'render' | 'cache' | 'network' | 'computation'
  metadata?: Record<string, unknown>
}

export interface PerformanceStats {
  metrics: PerformanceMetric[]
  summary: {
    apiAvg: number
    renderAvg: number
    cacheHitRate: number
    memoryUsage: number
    networkLatency: number
  }
}

/**
 * Performance profiler singleton
 */
class PerformanceProfiler {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 1000
  private startMarks: Map<string, number> = new Map()

  /**
   * Start measuring a named operation
   */
  mark(name: string): void {
    this.startMarks.set(name, performance.now())
  }

  /**
   * End measurement and record metric
   */
  measure(
    name: string,
    category: 'api' | 'render' | 'cache' | 'network' | 'computation',
    metadata?: Record<string, unknown>
  ): number {
    const startTime = this.startMarks.get(name)
    if (!startTime) {
      console.warn(`No mark found for ${name}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.startMarks.delete(name)

    const metric: PerformanceMetric = {
      timestamp: Date.now(),
      name,
      duration,
      category,
      metadata,
    }

    this.metrics.push(metric)

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    return duration
  }

  /**
   * Get current statistics
   */
  getStats(): PerformanceStats {
    const apiMetrics = this.metrics.filter(m => m.category === 'api')
    const renderMetrics = this.metrics.filter(m => m.category === 'render')
    const cacheMetrics = this.metrics.filter(m => m.category === 'cache')
    const networkMetrics = this.metrics.filter(m => m.category === 'network')

    const apiAvg = apiMetrics.length > 0 ? apiMetrics.reduce((sum, m) => sum + m.duration, 0) / apiMetrics.length : 0

    const renderAvg = renderMetrics.length > 0 ? renderMetrics.reduce((sum, m) => sum + m.duration, 0) / renderMetrics.length : 0

    // Cache hit rate from cache metrics
    const cacheHits = cacheMetrics.filter(m => m.metadata?.['hit'] === true).length
    const cacheHitRate = cacheMetrics.length > 0 ? (cacheHits / cacheMetrics.length) * 100 : 0

    // Memory usage (if available)
    const memoryUsage = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize || 0

    // Average network latency
    const networkLatency = networkMetrics.length > 0 ? networkMetrics.reduce((sum, m) => sum + m.duration, 0) / networkMetrics.length : 0

    return {
      metrics: this.metrics,
      summary: {
        apiAvg: Math.round(apiAvg * 100) / 100,
        renderAvg: Math.round(renderAvg * 100) / 100,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        memoryUsage: Math.round(memoryUsage / 1024 / 1024 * 100) / 100, // MB
        networkLatency: Math.round(networkLatency * 100) / 100,
      },
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    this.startMarks.clear()
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify(this.getStats(), null, 2)
  }
}

// Singleton instance
export const performanceProfiler = new PerformanceProfiler()

export default performanceProfiler
