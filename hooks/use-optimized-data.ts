"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  compressTideData,
  decompressTideData,
  compressWeatherData,
  decompressWeatherData,
  CompressedTideData,
  CompressedWeatherData
} from '@/lib/data-compression'

interface CacheEntry<T> {
  data: T
  timestamp: number
  compressed?: boolean
  size?: number
}

interface DataLoadingOptions {
  enableCompression?: boolean
  cacheTimeout?: number // milliseconds
  maxRetries?: number
  enableOfflineMode?: boolean
}

interface NetworkInfo {
  isOnline: boolean
  connectionType: 'wifi' | 'cellular' | 'unknown'
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown'
}

/**
 * Hook for optimized data loading with compression and caching
 * Designed for cellular connections to reduce data usage and improve performance
 */
export function useOptimizedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: DataLoadingOptions = {}
) {
  const {
    enableCompression = true,
    cacheTimeout = 5 * 60 * 1000, // 5 minutes
    maxRetries = 3,
    enableOfflineMode = true
  } = options

  const [data, setData] = useState<T | null>(null)
  const [compressedData, setCompressedData] = useState<CacheEntry<any> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isOnline: true,
    connectionType: 'unknown',
    effectiveType: 'unknown'
  })

  // Detect network conditions
  useEffect(() => {
    const updateNetworkInfo = () => {
      if (typeof navigator !== 'undefined' && 'connection' in navigator) {
        const connection = (navigator as any).connection
        setNetworkInfo({
          isOnline: navigator.onLine,
          connectionType: connection?.type || 'unknown',
          effectiveType: connection?.effectiveType || 'unknown'
        })
      } else {
        setNetworkInfo({
          isOnline: navigator.onLine,
          connectionType: 'unknown',
          effectiveType: 'unknown'
        })
      }
    }

    updateNetworkInfo()
    window.addEventListener('online', updateNetworkInfo)
    window.addEventListener('offline', updateNetworkInfo)

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      connection?.addEventListener('change', updateNetworkInfo)
    }

    return () => {
      window.removeEventListener('online', updateNetworkInfo)
      window.removeEventListener('offline', updateNetworkInfo)
      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        connection?.removeEventListener('change', updateNetworkInfo)
      }
    }
  }, [])

  // Get cached data from localStorage
  const getCachedData = useCallback((): CacheEntry<T> | null => {
    try {
      const cached = localStorage.getItem(`seapal_${key}`)
      if (!cached) return null

      const parsed: CacheEntry<T> = JSON.parse(cached)
      const now = Date.now()

      // Check if cache is still valid
      if (now - parsed.timestamp > cacheTimeout) {
        localStorage.removeItem(`seapal_${key}`)
        return null
      }

      return parsed
    } catch (err) {
      console.warn('Failed to load cached data:', err)
      return null
    }
  }, [key, cacheTimeout])

  // Save data to cache
  const setCachedData = useCallback((data: T, compressed = false) => {
    try {
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        compressed,
        size: compressed ? JSON.stringify(data).length : undefined
      }

      localStorage.setItem(`seapal_${key}`, JSON.stringify(cacheEntry))
    } catch (err) {
      console.warn('Failed to cache data:', err)
    }
  }, [key])

  // Compress data based on type
  const compressData = useCallback((data: any): any => {
    if (!enableCompression) return data

    try {
      // Compress tide data
      if (data.currentWaterLevel !== undefined && data.highTideTime !== undefined) {
        return compressTideData(data)
      }

      // Compress weather data
      if (data.main?.temp !== undefined && data.wind?.speed !== undefined) {
        return compressWeatherData(data)
      }

      return data
    } catch (err) {
      console.warn('Failed to compress data:', err)
      return data
    }
  }, [enableCompression])

  // Decompress data based on type
  const decompressData = useCallback((compressedData: any): T => {
    if (!enableCompression) return compressedData as T

    try {
      // Check if it's compressed tide data
      if (compressedData.v !== undefined && compressedData.l !== undefined) {
        return decompressTideData(compressedData as CompressedTideData) as T
      }

      // Check if it's compressed weather data
      if (compressedData.temp !== undefined && compressedData.ws !== undefined) {
        return decompressWeatherData(compressedData as CompressedWeatherData) as T
      }

      return compressedData as T
    } catch (err) {
      console.warn('Failed to decompress data:', err)
      return compressedData as T
    }
  }, [enableCompression])

  // Load data with optimization
  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true)
    setError(null)

    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = getCachedData()
        if (cached) {
          const decompressedData = decompressData(cached.data)
          setData(decompressedData)
          setCompressedData(cached)
          setLoading(false)
          return decompressedData
        }
      }

      // Check if offline and offline mode is enabled
      if (!networkInfo.isOnline && enableOfflineMode) {
        const cached = getCachedData()
        if (cached) {
          const decompressedData = decompressData(cached.data)
          setData(decompressedData)
          setCompressedData(cached)
          setLoading(false)
          return decompressedData
        }
        throw new Error('No internet connection and no cached data available')
      }

      // Fetch new data with retry logic
      let lastError: Error | null = null
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const rawData = await fetcher()

          // Compress data for storage
          const compressed = compressData(rawData)
          setCachedData(compressed, true)

          // Decompress for use
          const finalData = decompressData(compressed)
          setData(finalData)
          setCompressedData({
            data: compressed,
            timestamp: Date.now(),
            compressed: true,
            size: JSON.stringify(compressed).length
          })

          setLoading(false)
          return finalData
        } catch (err) {
          lastError = err as Error
          console.warn(`Attempt ${attempt} failed:`, err)

          // Wait before retry (exponential backoff)
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
          }
        }
      }

      throw lastError || new Error('Failed to load data after all retries')
    } catch (err) {
      const error = err as Error
      setError(error)
      setLoading(false)
      throw error
    }
  }, [
    key,
    fetcher,
    networkInfo.isOnline,
    enableOfflineMode,
    maxRetries,
    getCachedData,
    compressData,
    decompressData,
    setCachedData
  ])

  // Auto-load data on mount
  useEffect(() => {
    loadData()
  }, [loadData])

  // Get compression stats
  const getCompressionStats = useCallback(() => {
    if (!compressedData || !compressedData.size) return null

    const originalSize = JSON.stringify(data).length
    const compressedSize = compressedData.size
    const ratio = originalSize > 0 ? ((originalSize - compressedSize) / originalSize * 100) : 0

    return {
      originalSize,
      compressedSize,
      compressionRatio: ratio.toFixed(1),
      savings: `${ratio.toFixed(1)}%`
    }
  }, [data, compressedData])

  return {
    data,
    loading,
    error,
    networkInfo,
    loadData,
    refresh: () => loadData(true),
    clearCache: () => {
      localStorage.removeItem(`seapal_${key}`)
      setCompressedData(null)
    },
    compressionStats: getCompressionStats(),
    isCompressed: compressedData?.compressed || false,
    isFromCache: compressedData !== null
  }
}

/**
 * Hook specifically for tide data with cellular optimization
 */
export function useOptimizedTideData(locationId: string, options?: DataLoadingOptions) {
  return useOptimizedData(
    `tide_${locationId}`,
    async () => {
      // This would be replaced with actual API call
      const response = await fetch(`/api/tide?location=${locationId}`)
      if (!response.ok) throw new Error('Failed to fetch tide data')
      return response.json()
    },
    {
      enableCompression: true,
      cacheTimeout: 10 * 60 * 1000, // 10 minutes for tide data
      ...options
    }
  )
}

/**
 * Hook specifically for weather data with cellular optimization
 */
export function useOptimizedWeatherData(locationId: string, options?: DataLoadingOptions) {
  return useOptimizedData(
    `weather_${locationId}`,
    async () => {
      // This would be replaced with actual API call
      const response = await fetch(`/api/weather?location=${locationId}`)
      if (!response.ok) throw new Error('Failed to fetch weather data')
      return response.json()
    },
    {
      enableCompression: true,
      cacheTimeout: 5 * 60 * 1000, // 5 minutes for weather data
      ...options
    }
  )
}