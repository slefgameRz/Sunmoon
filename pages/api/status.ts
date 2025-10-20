import type { NextApiRequest, NextApiResponse } from 'next'
import { tidePredictionAPI } from '@/lib/tide-prediction-api'

export interface StatusResponse {
  success: boolean
  data?: {
    version: string
    status: 'healthy' | 'degraded' | 'unhealthy'
    uptime: number
    predictions: {
      totalRequests: number
      avgResponseTime: number
      cacheHitRate: number
    }
    tiles: {
      cached: number
      totalSize: number
      maxSize: number
    }
    apis: {
      openWeatherMap: boolean
      stormglass: boolean
      worldTides: boolean
    }
  }
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<StatusResponse>) {
  try {
    const stats = tidePredictionAPI.getStats()

    return res.status(200).json({
      success: true,
      data: {
        version: '1.0.0',
        status: 'healthy',
        uptime: process.uptime(),
        predictions: {
          totalRequests: stats.requestCount,
          avgResponseTime: stats.avgResponseTime,
          cacheHitRate: stats.cacheHitRate,
        },
        tiles: {
          cached: 0,
          totalSize: stats.totalCacheSize,
          maxSize: 100 * 1024 * 1024,
        },
        apis: {
          openWeatherMap: !!process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY,
          stormglass: !!process.env.NEXT_PUBLIC_STORMGLASS_API_KEY,
          worldTides: !!process.env.NEXT_PUBLIC_WORLDTIDES_API_KEY,
        },
      },
    })
  } catch (error) {
    console.error('Status error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}
