import type { NextApiRequest, NextApiResponse } from 'next'

export interface TileData {
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

export interface TileResponse {
  success: boolean
  data?: TileData
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TileResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { tileId } = req.query

    // For now, return a sample tile
    // In Phase 2, this would load from database/file system
    const tileIdStr = Array.isArray(tileId) ? tileId[0] : tileId || 'default'

    const sampleTile: TileData = {
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
