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
