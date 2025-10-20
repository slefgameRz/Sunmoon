/**
 * React Performance Monitoring Hook
 * 
 * Tracks component render performance, data loading times,
 * and helps identify bottlenecks
 */

'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { performanceProfiler } from '@/lib/performance-profiler'

export interface PerformanceOptions {
  enabled?: boolean
  logToConsole?: boolean
  sendToServer?: boolean
  serverEndpoint?: string
}

/**
 * Hook to monitor component performance
 */
export function usePerformanceMonitoring(
  componentName: string,
  options: PerformanceOptions = {}
): {
  markStart: (operationName: string) => void
  markEnd: (operationName: string, category: 'api' | 'render' | 'cache' | 'network' | 'computation') => number
  getStats: () => any
} {
  const { enabled = true, logToConsole = false } = options
  const renderStartTime = useRef<number>(0)

  // Track component render time
  useEffect(() => {
    if (!enabled) return

    const now = performance.now()
    if (renderStartTime.current > 0) {
      const renderTime = now - renderStartTime.current
      performanceProfiler.measure(`render-${componentName}`, 'render', {
        component: componentName,
      })

      if (logToConsole) {
        console.log(`[${componentName}] Render time: ${renderTime.toFixed(2)}ms`)
      }
    }
    renderStartTime.current = now
  })

  const markStart = useCallback(
    (operationName: string) => {
      if (enabled) {
        performanceProfiler.mark(`${componentName}-${operationName}`)
      }
    },
    [componentName, enabled]
  )

  const markEnd = useCallback(
    (operationName: string, category: 'api' | 'render' | 'cache' | 'network' | 'computation') => {
      if (enabled) {
        const duration = performanceProfiler.measure(
          `${componentName}-${operationName}`,
          category,
          { component: componentName }
        )

        if (logToConsole) {
          console.log(`[${componentName}] ${operationName}: ${duration.toFixed(2)}ms`)
        }

        return duration
      }
      return 0
    },
    [componentName, enabled, logToConsole]
  )

  const getStats = useCallback(() => performanceProfiler.getStats(), [])

  return {
    markStart,
    markEnd,
    getStats,
  }
}

/**
 * Hook to monitor data fetching
 */
export function useFetchPerformance(
  url: string,
  options: PerformanceOptions = {}
): {
  fetch: <T>(url: string) => Promise<T>
  loading: boolean
  error: Error | null
  data: any
} {
  const { logToConsole = false } = options
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<any>(null)

  const fetchWithMetrics = useCallback(
    async <T,>(fetchUrl: string): Promise<T> => {
      setLoading(true)
      setError(null)

      performanceProfiler.mark(`fetch-${fetchUrl}`)

      try {
        const response = await fetch(fetchUrl)
        const duration = performanceProfiler.measure(
          `fetch-${fetchUrl}`,
          'network',
          { url: fetchUrl, status: response.status }
        )

        if (logToConsole) {
          console.log(`[Fetch] ${fetchUrl}: ${duration.toFixed(2)}ms`)
        }

        const result = await response.json() as T
        setData(result)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        throw error
      } finally {
        setLoading(false)
      }
    },
    [logToConsole]
  )

  return {
    fetch: fetchWithMetrics,
    loading,
    error,
    data,
  }
}

export default usePerformanceMonitoring
