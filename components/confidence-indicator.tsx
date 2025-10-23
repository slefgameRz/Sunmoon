/**
 * Confidence Visualization Component
 * 
 * Displays prediction confidence with visual indicators
 * Shows reliability of tide predictions based on:
 * - Data source (API, tile, harmonic)
 * - Time to prediction
 * - Historical accuracy
 */

'use client'

import React, { useMemo } from 'react'

export interface ConfidenceLevel {
  score: number // 0-100
  level: 'very-high' | 'high' | 'medium' | 'low'
  reason: string
  lastAccuracy?: number // 0-100
}

export interface ConfidenceProps {
  confidence: number // 0-100
  dataSource: 'api' | 'tile' | 'harmonic' | 'offline'
  timeToEvent: number // hours
  showDetails?: boolean
}

/**
 * Calculate confidence level based on multiple factors
 */
export function calculateConfidence(
  baseConfidence: number,
  dataSource: string,
  timeToEvent: number,
  lastAccuracy?: number
): ConfidenceLevel {
  let score = baseConfidence

  // Adjust based on data source
  const sourceMultiplier: Record<string, number> = {
    api: 1.0, // Highest confidence for real API data
    tile: 0.95, // Tile data is slightly less reliable
    harmonic: 0.85, // Harmonic predictions less reliable
    offline: 0.7, // Offline fallback lowest confidence
  }

  score *= sourceMultiplier[dataSource] || 0.8

  // Reduce confidence for longer time horizons
  // Loses ~2% confidence per hour
  const timeDecay = Math.max(0.3, 1 - timeToEvent * 0.02)
  score *= timeDecay

  // Boost if historical accuracy is available
  if (lastAccuracy) {
    score = score * 0.7 + lastAccuracy * 0.3 // 70/30 weighting
  }

  // Round to nearest integer
  score = Math.round(score)

  let level: 'very-high' | 'high' | 'medium' | 'low'
  if (score >= 85) level = 'very-high'
  else if (score >= 70) level = 'high'
  else if (score >= 50) level = 'medium'
  else level = 'low'

  const reasons: Record<string, string> = {
    api: 'Real-time API data with high accuracy',
    tile: 'Pre-computed tile data with interpolation',
    harmonic: 'Calculated from tidal constituents',
    offline: 'Generated offline without real data',
  }

  return {
    score,
    level,
    reason: reasons[dataSource] || 'Unknown source',
    lastAccuracy,
  }
}

/**
 * Confidence indicator component
 */
export function ConfidenceIndicator({ confidence, dataSource, timeToEvent, showDetails }: ConfidenceProps) {
  const confidenceData = useMemo(
    () => calculateConfidence(confidence, dataSource, timeToEvent),
    [confidence, dataSource, timeToEvent]
  )

  const getColor = (level: string) => {
    switch (level) {
      case 'very-high':
        return 'text-green-600 bg-green-50'
      case 'high':
        return 'text-blue-600 bg-blue-50'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50'
      case 'low':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getBorderColor = (level: string) => {
    switch (level) {
      case 'very-high':
        return 'border-green-200'
      case 'high':
        return 'border-blue-200'
      case 'medium':
        return 'border-yellow-200'
      case 'low':
        return 'border-red-200'
      default:
        return 'border-gray-200'
    }
  }

  return (
    <div className={`rounded-lg border-2 p-3 ${getBorderColor(confidenceData.level)}`}>
      <div className={`flex items-center justify-between rounded p-2 ${getColor(confidenceData.level)}`}>
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">Confidence</div>
          <div className="text-lg font-bold">{confidenceData.score}%</div>
        </div>
        <div className="text-xs font-medium uppercase">{confidenceData.level.replace('-', ' ')}</div>
      </div>

      {showDetails && (
        <div className="mt-2 space-y-1 text-xs text-gray-600">
          <div>📊 {confidenceData.reason}</div>
          <div>⏱️ Time to event: {timeToEvent.toFixed(1)} hours</div>
          {confidenceData.lastAccuracy && <div>📈 Historical accuracy: {confidenceData.lastAccuracy}%</div>}
        </div>
      )}

      {/* Visual bar */}
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full transition-all duration-300 ${
            confidenceData.level === 'very-high'
              ? 'bg-green-600'
              : confidenceData.level === 'high'
                ? 'bg-blue-600'
                : confidenceData.level === 'medium'
                  ? 'bg-yellow-600'
                  : 'bg-red-600'
          } ${
            confidenceData.score >= 90
              ? 'w-11/12'
              : confidenceData.score >= 75
                ? 'w-3/4'
                : confidenceData.score >= 50
                  ? 'w-1/2'
                  : 'w-1/4'
          }`}
        />
      </div>
    </div>
  )
}

export default ConfidenceIndicator
