/**
 * API Routes for SEAPALO Prediction Server
 * 
 * Endpoints:
 * - POST /api/predict - Get tide prediction
 * - GET /api/tiles/{tileId} - Download tile data
 * - POST /api/tiles/generate - Generate new tile
 * - GET /api/status - System status
 * - POST /api/sync-queue - Background sync queue
 */

/**
 * Next.js API Route Handler
 * File: pages/api/predict.ts
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { tidePredictionAPI } from '@/lib/tide-prediction-api'

export interface PredictRequest {
  location: {
    lat: number
    lon: number
    name: string
  }
  date: string
  time?: {
    hour: number
    minute: number
  }
  timeRange?: {
    startHour: number
    endHour: number
    intervalMinutes?: number
  }
}

export interface PredictResponse {
  success: boolean
  data?: {
    location: { lat: number; lon: number; name: string }
    date: string
    predictions: Array<{
      time: string
      level: number
      type?: 'high' | 'low'
      confidence: number
    }>
    dataSource: 'tile' | 'harmonic' | 'api'
    responseTime: number
  }
  error?: string
}

async function handler(req: NextApiRequest, res: NextApiResponse<PredictResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const request = req.body as PredictRequest

    // Validate request
    if (!request.location || !request.date) {
      return res.status(400).json({ success: false, error: 'Missing required fields' })
    }

    // Get predictions
    const predictions = await tidePredictionAPI.getPredictions({
      location: request.location,
      date: new Date(request.date),
      timeRange: request.timeRange,
    })

    return res.status(200).json({
      success: true,
      data: predictions,
    })
  } catch (error) {
    console.error('Prediction error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

export default handler

/**
 * Tile API Route Handler
 * File: pages/api/tiles/[tileId].ts
 */

export interface TileResponse {
  success: boolean
  data?: {
    tileId: string
    metadata: {
      bounds: { north: number; south: number; east: number; west: number }
      constituents: string[]
      accuracy: { heightRMSE: number; timeRMSE: number; confidence: number }
    }
    constituents: Array<{
      constituent: string
      amplitude: number
      phaseLag: number
    }>
  }
  error?: string
}

export async function tileHandler(req: NextApiRequest, res: NextApiResponse<TileResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { tileId } = req.query

    // For now, return a sample tile
    // In Phase 2, this would load from database/file system
    const tileIdStr = Array.isArray(tileId) ? tileId[0] : tileId || 'default'
    const sampleTile = {
      tileId: tileIdStr,
      metadata: {
        bounds: { north: 14, south: 13, east: 101, west: 100 },
        constituents: ['M2', 'S2', 'N2', 'K1', 'O1'],
        accuracy: { heightRMSE: 0.15, timeRMSE: 10, confidence: 85 },
      },
      constituents: [
        { constituent: 'M2', amplitude: 0.85, phaseLag: 45 },
        { constituent: 'S2', amplitude: 0.25, phaseLag: 0 },
        { constituent: 'N2', amplitude: 0.15, phaseLag: 45 },
        { constituent: 'K1', amplitude: 0.18, phaseLag: 90 },
        { constituent: 'O1', amplitude: 0.12, phaseLag: 90 },
      ],
    }

    res.setHeader('Cache-Control', 'public, max-age=86400') // Cache for 24 hours
    return res.status(200).json({
      success: true,
      data: sampleTile,
    })
  } catch (error) {
    console.error('Tile fetch error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    })
  }
}

/**
 * Status API Route Handler
 * File: pages/api/status.ts
 */

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

export async function statusHandler(req: NextApiRequest, res: NextApiResponse<StatusResponse>) {
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
          openWeatherMap: !!process.env.OPENWEATHER_API_KEY,
          stormglass: !!process.env.STORMGLASS_API_KEY,
          worldTides: !!process.env.WORLDTIDES_API_KEY,
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
