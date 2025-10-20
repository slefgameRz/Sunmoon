/**
 * Advanced Tide Graph Component
 * 
 * Performance-optimized graph rendering with:
 * - Memoization for expensive calculations
 * - Responsive scaling
 * - Interactive features
 * - Confidence visualization
 */

'use client'

import React, { useMemo, useCallback, useState } from 'react'

export interface TideDataPoint {
  time: string
  level: number
  type?: 'high' | 'low'
  confidence?: number
}

export interface TideGraphProps {
  data: TideDataPoint[]
  width?: number
  height?: number
  showConfidence?: boolean
  showExtremes?: boolean
  interactive?: boolean
  onPointClick?: (point: TideDataPoint) => void
}

/**
 * Advanced tide graph component
 */
export function TideGraph({
  data,
  width = 800,
  height = 300,
  showConfidence = true,
  showExtremes = true,
  interactive = true,
  onPointClick,
}: TideGraphProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Memoize data calculations
  const stats = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 0, avg: 0 }

    const levels = data.map(d => d.level)
    const min = Math.min(...levels)
    const max = Math.max(...levels)
    const avg = levels.reduce((a, b) => a + b, 0) / levels.length

    return { min, max, avg }
  }, [data])

  // Memoize path generation
  const pathD = useMemo(() => {
    if (data.length === 0) return ''

    const padding = 40
    const plotWidth = width - padding * 2
    const plotHeight = height - padding * 2

    const xStep = plotWidth / (data.length - 1 || 1)
    const range = stats.max - stats.min || 1
    const yScale = plotHeight / range

    let path = `M ${padding} ${height - padding - (data[0].level - stats.min) * yScale}`

    for (let i = 1; i < data.length; i++) {
      const x = padding + i * xStep
      const y = height - padding - (data[i].level - stats.min) * yScale
      path += ` L ${x} ${y}`
    }

    return path
  }, [data, stats, width, height])

  // Memoize extremes
  const extremes = useMemo(() => {
    if (!showExtremes) return { highs: [], lows: [] }

    const highs = data
      .map((d, i) => (d.type === 'high' ? { ...d, index: i } : null))
      .filter((d): d is typeof data[0] & { index: number } => d !== null)

    const lows = data
      .map((d, i) => (d.type === 'low' ? { ...d, index: i } : null))
      .filter((d): d is typeof data[0] & { index: number } => d !== null)

    return { highs, lows }
  }, [data, showExtremes])

  // Calculate point positions
  const pointPositions = useMemo(() => {
    const padding = 40
    const plotWidth = width - padding * 2
    const plotHeight = height - padding * 2
    const xStep = plotWidth / (data.length - 1 || 1)
    const range = stats.max - stats.min || 1
    const yScale = plotHeight / range

    return data.map((d, i) => ({
      x: padding + i * xStep,
      y: height - padding - (d.level - stats.min) * yScale,
    }))
  }, [data, stats, width, height])

  const handlePointClick = useCallback(
    (point: TideDataPoint) => {
      if (interactive && onPointClick) {
        onPointClick(point)
      }
    },
    [interactive, onPointClick]
  )

  const handlePointHover = useCallback((index: number | null) => {
    if (interactive) {
      setHoveredIndex(index)
    }
  }, [interactive])

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-4">
      <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        <line x1="40" y1="20" x2="40" y2={height - 40} stroke="#e5e7eb" strokeWidth="1" />
        <line x1="40" y1={height - 40} x2={width - 40} y2={height - 40} stroke="#e5e7eb" strokeWidth="1" />

        {/* Main line */}
        <path d={pathD} stroke="#0066cc" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />

        {/* Fill under line */}
        <path
          d={`${pathD} L ${width - 40} ${height - 40} L 40 ${height - 40} Z`}
          fill="#0066cc"
          opacity="0.1"
        />

        {/* High tide points */}
        {extremes.highs.map((point, i) => {
          const pos = pointPositions[point.index]
          return (
            <circle
              key={`high-${i}`}
              cx={pos.x}
              cy={pos.y}
              r="5"
              fill="#22c55e"
              stroke="#16a34a"
              strokeWidth="2"
              opacity={hoveredIndex === point.index ? 1 : 0.7}
              className={interactive ? 'cursor-pointer transition-opacity hover:opacity-100' : ''}
              onClick={() => handlePointClick(point)}
              onMouseEnter={() => handlePointHover(point.index)}
              onMouseLeave={() => handlePointHover(null)}
            />
          )
        })}

        {/* Low tide points */}
        {extremes.lows.map((point, i) => {
          const pos = pointPositions[point.index]
          return (
            <circle
              key={`low-${i}`}
              cx={pos.x}
              cy={pos.y}
              r="5"
              fill="#ef4444"
              stroke="#dc2626"
              strokeWidth="2"
              opacity={hoveredIndex === point.index ? 1 : 0.7}
              className={interactive ? 'cursor-pointer transition-opacity hover:opacity-100' : ''}
              onClick={() => handlePointClick(point)}
              onMouseEnter={() => handlePointHover(point.index)}
              onMouseLeave={() => handlePointHover(null)}
            />
          )
        })}

        {/* Hovered point indicator */}
        {hoveredIndex !== null && (
          <circle
            cx={pointPositions[hoveredIndex].x}
            cy={pointPositions[hoveredIndex].y}
            r="8"
            fill="none"
            stroke="#0066cc"
            strokeWidth="2"
            opacity="0.5"
            className="animate-pulse"
          />
        )}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span>High Tide</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span>Low Tide</span>
        </div>
        {showConfidence && (
          <div className="flex items-center gap-2">
            <div className="h-1 w-4 bg-blue-500" />
            <span>Confidence</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
        <div className="rounded bg-gray-50 p-2">
          <div className="text-xs text-gray-500">Min</div>
          <div className="text-lg font-semibold text-gray-700">{stats.min.toFixed(2)}m</div>
        </div>
        <div className="rounded bg-gray-50 p-2">
          <div className="text-xs text-gray-500">Average</div>
          <div className="text-lg font-semibold text-gray-700">{stats.avg.toFixed(2)}m</div>
        </div>
        <div className="rounded bg-gray-50 p-2">
          <div className="text-xs text-gray-500">Max</div>
          <div className="text-lg font-semibold text-gray-700">{stats.max.toFixed(2)}m</div>
        </div>
      </div>
    </div>
  )
}

export default TideGraph
