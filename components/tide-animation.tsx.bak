"use client"

import * as React from "react"
import { ArrowUp, ArrowDown, Droplets, Clock, TrendingUp, TrendingDown } from "lucide-react"
import type { TideData } from "@/lib/tide-service"
import { cn } from "@/lib/utils"

type TideAnimationProps = { tideData: TideData }

const TIDE_VISUAL_MAX = 3.5
const TIDE_VISUAL_MIN = -0.5
const VISUAL_RANGE = TIDE_VISUAL_MAX - TIDE_VISUAL_MIN

// Convert an array of points to a smooth SVG path using Catmull-Rom to Bezier (helper)
function pointsToSmoothPath(points: { x: number; y: number }[]) {
  if (!points || points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  // Catmull-Rom to bezier conversion
  const d = points.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const p0 = points[i - 1]
    const p1 = p
    const p2 = points[i + 1] || p1
    const p3 = points[i + 2] || p2

    // control points
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  })

  return d.join(' ')
}

export default function TideAnimation({ tideData }: TideAnimationProps) {
  const { currentWaterLevel = 0, tideEvents = [], waterLevelStatus = "ไม่ทราบ", apiStatus = "error", isWaxingMoon = true, lunarPhaseKham = 1, tideStatus = "น้ำตาย" } = tideData || {}
  const [showHigh, setShowHigh] = React.useState(true)
  const [showLow, setShowLow] = React.useState(true)
  const [hoveredPoint, setHoveredPoint] = React.useState<number | null>(null)

  const graphData = Array.isArray(tideData?.graphData) ? tideData.graphData : []

  // Responsive sizing using window width (client only)
  const [size, setSize] = React.useState({ w: 640, h: 280 })
  React.useEffect(() => {
    function update() {
      const w = Math.min(900, Math.max(320, window.innerWidth - 48))
      const h = window.innerWidth < 640 ? 300 : 380
      setSize({ w, h })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Memoize the points and path calculation
  const { points, pathD } = React.useMemo(() => {
    if (!graphData || graphData.length === 0) {
      return { points: [], pathD: '' }
    }

    const pts = graphData.map((p: any, i: number) => {
      const x = (i / Math.max(1, graphData.length - 1)) * (size.w - 60) + 50
      const y = size.h - ((p.level - TIDE_VISUAL_MIN) / VISUAL_RANGE) * (size.h - 40)
      return { x, y, time: p.time, level: p.level }
    })

    const path = pointsToSmoothPath(pts.map(pt => ({ x: pt.x, y: pt.y })))
    return { points: pts, pathD: path && typeof path === 'string' ? path : '' }
  }, [graphData, size])

  // Ensure pathD is always a string
  const safePathD = pathD && typeof pathD === 'string' && pathD.length > 0 ? pathD : null

  return (
    <div className="space-y-6" aria-live="polite">
      {/* Header with Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 rounded-xl">
            <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">ระดับน้ำปัจจุบัน</div>
            <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {currentWaterLevel.toFixed(2)} <span className="text-lg md:text-xl font-semibold">เมตร</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-semibold",
                waterLevelStatus === "น้ำขึ้น" 
                  ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300" 
                  : waterLevelStatus === "น้ำลง"
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              )}>
                {waterLevelStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50">
            <div className="text-xs text-red-600 dark:text-red-400 font-medium">น้ำขึ้นสูงสุด</div>
            <div className="text-sm font-bold text-red-700 dark:text-red-300">
              {tideEvents.find(e => e.type === 'high')?.level.toFixed(2) || '--'} ม.
            </div>
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
              {tideEvents.find(e => e.type === 'high')?.time || '--:--'}
            </div>
          </div>
          <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800/50">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">น้ำลงต่ำสุด</div>
            <div className="text-sm font-bold text-blue-700 dark:text-blue-300">
              {tideEvents.find(e => e.type === 'low')?.level.toFixed(2) || '--'} ม.
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {tideEvents.find(e => e.type === 'low')?.time || '--:--'}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Graph Card */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 md:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
        {/* Graph Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">กราฟระดับน้ำ 24 ชั่วโมง</h3>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400 shadow-sm">
            <Clock className="w-3.5 h-3.5" />
            {apiStatus === 'loading' ? 'กำลังโหลด' : apiStatus === 'success' ? '✓ สดใหม่' : apiStatus === 'offline' ? 'ออฟไลน์' : 'ตรวจสอบ'}
          </div>
        </div>

        {/* SVG Graph Container */}
        <div className="bg-gradient-to-b from-white/95 to-blue-50/50 dark:from-slate-700/80 dark:to-slate-800/80 rounded-xl p-6 md:p-8 border border-slate-200 dark:border-slate-600/50 overflow-x-auto shadow-inner">
          <svg
            role="img"
            aria-label="กราฟระดับน้ำ 24 ชั่วโมง"
            viewBox={`0 0 ${size.w} ${size.h}`}
            width="100%"
            height={size.h}
            preserveAspectRatio="none"
            className="min-w-full"
          >
            <title>กราฟระดับน้ำ 24 ชั่วโมง</title>
            <desc>แสดงระดับน้ำเป็นเส้นเรียบพร้อมแถบสีด้านล่าง</desc>

            {/* defs: gradients and patterns */}
            <defs>
              <linearGradient id="grad-tide-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                <stop offset="40%" stopColor="#0ea5e9" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="grad-tide-line" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
              <filter id="glow-effect">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="shadow-effect">
                <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
                <feOffset dx="0" dy="1" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode in="offsetblur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background grid */}
            <rect width={size.w} height={size.h} fill="transparent" />

            {/* Grid lines and labels */}
            {Array.from({ length: 5 }).map((_, i) => {
              const y = (i / 4) * size.h
              const label = (TIDE_VISUAL_MAX - (i * VISUAL_RANGE) / 4).toFixed(1)
              const isCenter = i === 2
              return (
                <g key={`grid-${i}`}>
                  <line 
                    x1={50} y1={y} x2={size.w - 10} y2={y} 
                    stroke={isCenter ? "#cbd5e1" : "#e2e8f0"} 
                    strokeWidth={isCenter ? 1.5 : 1} 
                    strokeDasharray={isCenter ? "0" : "4,4"}
                    opacity={isCenter ? 0.8 : 0.4}
                  />
                  <text 
                    x={12} y={y + 5} 
                    fontSize={12} 
                    fill="#64748b"
                    fontWeight={isCenter ? "600" : "500"}
                  >
                    {label}
                  </text>
                </g>
              )
            })}

            {/* Y-axis labels unit */}
            <text x={12} y={20} fontSize={10} fill="#64748b" fontWeight="700">ม.</text>

            {/* area under curve */}
            {points.length > 1 && safePathD && (
              <path
                d={`${safePathD} L ${size.w} ${size.h} L 50 ${size.h} Z`}
                fill="url(#grad-tide-fill)"
                opacity={1}
              />
            )}

            {/* smooth line stroke with glow */}
            {points.length > 1 && safePathD && (
              <>
                {/* Glow effect */}
                <path
                  d={safePathD}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.2}
                  filter="url(#glow-effect)"
                />
                {/* Main line */}
                <path
                  d={safePathD}
                  fill="none"
                  stroke="url(#grad-tide-line)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}

            {/* Animated markers for high/low tides */}
            {tideEvents.filter((e: any) => (e.type === 'high' && showHigh) || (e.type === 'low' && showLow)).map((ev: any, idx: number) => {
              const match = points.reduce((best, p) => Math.abs(p.level - ev.level) < Math.abs(best.level - ev.level) ? p : best, points[0] || { x: 0, y: 0, level: 0 })
              const isHigh = ev.type === 'high'
              return (
                <g key={`marker-${idx}`} transform={`translate(${match.x},${match.y})`}>
                  {/* Pulsing circle background */}
                  <circle 
                    r={8} 
                    fill={isHigh ? '#fca5a5' : '#bfdbfe'} 
                    opacity={0.3}
                    className="animate-pulse"
                  />
                  {/* Main marker circle */}
                  <circle 
                    r={6} 
                    fill={isHigh ? '#ef4444' : '#3b82f6'} 
                    stroke="#fff" 
                    strokeWidth={2}
                    className="drop-shadow-md"
                  />
                  {/* Icon */}
                  <text 
                    x={0} 
                    y={2} 
                    fontSize={10} 
                    fill="#fff" 
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {isHigh ? '▲' : '▼'}
                  </text>
                  {/* Label */}
                  <text 
                    x={14} 
                    y={-6} 
                    fontSize={11} 
                    fill="#1f2937"
                    fontWeight="600"
                  >
                    {isHigh ? 'สูง' : 'ต่ำ'}
                  </text>
                  <text 
                    x={14} 
                    y={6} 
                    fontSize={10} 
                    fill="#374151"
                    fontWeight="500"
                  >
                    {ev.time}
                  </text>
                </g>
              )
            })}

            {/* Current level indicator */}
            {points.length > 0 && (
              (() => {
                const mid = Math.floor(points.length / 2)
                const p = points[mid]
                return (
                  <g>
                    {/* Indicator line */}
                    <line 
                      x1={p.x} 
                      y1={0} 
                      x2={p.x} 
                      y2={size.h} 
                      stroke="#a78bfa" 
                      strokeWidth={2} 
                      strokeDasharray="2,4"
                      opacity={0.5}
                    />
                    {/* Current level badge */}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r={7} 
                      fill="#7c3aed" 
                      stroke="#fff"
                      strokeWidth={2}
                      className="drop-shadow-lg"
                    />
                    <text 
                      x={p.x + 16} 
                      y={p.y - 10} 
                      fontSize={12} 
                      fill="#1f2937"
                      fontWeight="bold"
                    >
                      ปัจจุบัน
                    </text>
                    <text 
                      x={p.x + 16} 
                      y={p.y + 4} 
                      fontSize={11} 
                      fill="#374151"
                      fontWeight="600"
                    >
                      {currentWaterLevel.toFixed(2)} ม.
                    </text>
                  </g>
                )
              })()
            )}

            {/* Time labels at bottom */}
            {[0, 6, 12, 18, 23].map((hour) => {
              const x = (hour / 23) * (size.w - 60) + 50
              return (
                <g key={`time-${hour}`}>
                  <text 
                    x={x} 
                    y={size.h - 8} 
                    fontSize={11} 
                    fill="#64748b"
                    textAnchor="middle"
                    fontWeight="500"
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* Legend and Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-slate-200 dark:border-slate-600">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">ตัวอักษร:</span>
            <button
              onClick={() => setShowHigh(!showHigh)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md",
                showHigh 
                  ? "bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700" 
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 opacity-70"
              )}
            >
              <ArrowUp className="w-4 h-4" /> น้ำขึ้น
            </button>
            <button
              onClick={() => setShowLow(!showLow)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md",
                showLow 
                  ? "bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700" 
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 opacity-70"
              )}
            >
              <ArrowDown className="w-4 h-4" /> น้ำลง
            </button>
          </div>

          <div className="flex items-center gap-5 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="w-3.5 h-3.5 bg-gradient-to-br from-red-400 to-red-600 rounded-full shadow-sm"></div>
              <span className="font-semibold text-red-700 dark:text-red-400">น้ำขึ้นสูง</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-3.5 h-3.5 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
              <span className="font-semibold text-blue-700 dark:text-blue-400">น้ำลงต่ำ</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="w-3.5 h-3.5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-sm"></div>
              <span className="font-semibold text-purple-700 dark:text-purple-400">ปัจจุบัน</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


