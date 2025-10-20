"use client"

import * as React from "react"
import { ArrowUp, ArrowDown, Droplets, Clock, TrendingUp, Info, ChevronDown, ChevronUp } from "lucide-react"
import type { TideData } from "@/lib/tide-service"
import { cn } from "@/lib/utils"

type TideAnimationProps = { tideData: TideData }

const TIDE_VISUAL_MAX = 3.5
const TIDE_VISUAL_MIN = -0.5
const VISUAL_RANGE = TIDE_VISUAL_MAX - TIDE_VISUAL_MIN

function pointsToSmoothPath(points: { x: number; y: number }[]) {
  if (!points || points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  const d = points.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const p0 = points[i - 1]
    const p1 = p
    const p2 = points[i + 1] || p1
    const p3 = points[i + 2] || p2

    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6

    return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  })

  return d.join(' ')
}

export default function TideAnimationNew({ tideData }: TideAnimationProps) {
  const {
    currentWaterLevel = 0,
    tideEvents = [],
    waterLevelStatus = "ไม่ทราบ",
    apiStatus = "error",
  } = tideData || {}

  const [showHigh, setShowHigh] = React.useState(true)
  const [showLow, setShowLow] = React.useState(true)
  const [isExpanded, setIsExpanded] = React.useState(true)

  const graphData = Array.isArray(tideData?.graphData) ? tideData.graphData : []

  // Better responsive sizing
  const [size, setSize] = React.useState({ w: 800, h: 450 })
  React.useEffect(() => {
    function update() {
      const w = Math.min(1200, Math.max(320, window.innerWidth - 32))
      const h = window.innerWidth < 768 ? 350 : 450
      setSize({ w, h })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const { points, pathD } = React.useMemo(() => {
    if (!graphData || graphData.length === 0) {
      return { points: [], pathD: '' }
    }

    const pts = graphData.map((p: any, i: number) => {
      const x = (i / Math.max(1, graphData.length - 1)) * (size.w - 80) + 60
      const y = size.h - ((p.level - TIDE_VISUAL_MIN) / VISUAL_RANGE) * (size.h - 60)
      return { x, y, time: p.time, level: p.level }
    })

    const path = pointsToSmoothPath(pts.map(pt => ({ x: pt.x, y: pt.y })))
    return { points: pts, pathD: path || '' }
  }, [graphData, size])

  return (
    <div className="space-y-8" aria-live="polite">
      {/* Current Status Cards - 3 Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Level */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">ระดับน้ำปัจจุบัน</p>
              <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">{currentWaterLevel.toFixed(2)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">เมตร</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/30">
            <span
              className={cn(
                "inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold",
                waterLevelStatus === "น้ำขึ้น"
                  ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                  : waterLevelStatus === "น้ำลง"
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              )}
            >
              {waterLevelStatus}
            </span>
          </div>
        </div>

        {/* High Tide */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">น้ำขึ้นสูงสุด</p>
              <p className="text-4xl font-bold text-red-700 dark:text-red-300">
                {tideEvents.find(e => e.type === 'high')?.level.toFixed(2) || '--'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">เมตร</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-xl">
              <ArrowUp className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800/30">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
              เวลา: {tideEvents.find(e => e.type === 'high')?.time || '--:--'}
            </p>
          </div>
        </div>

        {/* Low Tide */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">น้ำลงต่ำสุด</p>
              <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">
                {tideEvents.find(e => e.type === 'low')?.level.toFixed(2) || '--'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">เมตร</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <ArrowDown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/30">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              เวลา: {tideEvents.find(e => e.type === 'low')?.time || '--:--'}
            </p>
          </div>
        </div>
      </div>

      {/* Graph Section - Full Width */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">กราฟระดับน้ำ 24 ชั่วโมง</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">ข้อมูลสภาพน้ำตามเวลา</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2",
              apiStatus === 'success'
                ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                : apiStatus === 'loading'
                ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            )}>
              <span className="w-2 h-2 rounded-full animate-pulse" />
              {apiStatus === 'loading' ? 'กำลังโหลด' : apiStatus === 'success' ? 'สดใหม่' : 'ออฟไลน์'}
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              aria-label={isExpanded ? "ซ่อนกราฟ" : "แสดงกราฟ"}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Graph Content - Expandable */}
        {isExpanded && (
        <div className="p-8">
          {/* SVG Graph */}
          <svg
            role="img"
            aria-label="กราฟระดับน้ำ 24 ชั่วโมง"
            viewBox={`0 0 ${size.w} ${size.h}`}
            width="100%"
            height={size.h}
            preserveAspectRatio="xMidYMid meet"
            className="bg-gradient-to-b from-white to-blue-50/30 dark:from-slate-800 dark:to-slate-700/50 rounded-2xl border border-gray-100 dark:border-slate-600/50"
          >
            <defs>
              <linearGradient id="grad-tide-fill-new" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="grad-tide-line-new" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>

            {/* Grid */}
            {Array.from({ length: 5 }).map((_, i) => {
              const y = (i / 4) * size.h
              const label = (TIDE_VISUAL_MAX - (i * VISUAL_RANGE) / 4).toFixed(1)
              return (
                <g key={`grid-${i}`}>
                  <line
                    x1={60}
                    y1={y}
                    x2={size.w - 20}
                    y2={y}
                    stroke={i === 2 ? "#cbd5e1" : "#e2e8f0"}
                    strokeWidth={i === 2 ? 2 : 1}
                    strokeDasharray={i === 2 ? "0" : "5,5"}
                    opacity={i === 2 ? 1 : 0.5}
                  />
                  <text x={20} y={y + 6} fontSize={13} fill="#64748b" fontWeight="600">
                    {label}
                  </text>
                </g>
              )
            })}

            {/* Y-axis unit */}
            <text x={10} y={25} fontSize={12} fill="#64748b" fontWeight="700">ม.</text>

            {/* Area fill */}
            {points.length > 1 && (
              <path
                d={`${pathD} L ${size.w - 20} ${size.h} L 60 ${size.h} Z`}
                fill="url(#grad-tide-fill-new)"
              />
            )}

            {/* Line */}
            {points.length > 1 && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#grad-tide-line-new)"
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Markers */}
            {tideEvents
              .filter((e: any) => (e.type === 'high' && showHigh) || (e.type === 'low' && showLow))
              .map((ev: any, idx: number) => {
                const match = points.reduce(
                  (best, p) =>
                    Math.abs(p.level - ev.level) < Math.abs(best.level - ev.level) ? p : best,
                  points[0] || { x: 0, y: 0, level: 0 }
                )
                const isHigh = ev.type === 'high'
                return (
                  <g key={`marker-${idx}`} transform={`translate(${match.x},${match.y})`}>
                    <circle r={12} fill={isHigh ? '#ef4444' : '#3b82f6'} opacity={0.2} />
                    <circle
                      r={8}
                      fill={isHigh ? '#ef4444' : '#3b82f6'}
                      stroke="#fff"
                      strokeWidth={2.5}
                    />
                    <text
                      x={0}
                      y={3}
                      fontSize={12}
                      fill="#fff"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {isHigh ? '▲' : '▼'}
                    </text>
                  </g>
                )
              })}

            {/* Time labels */}
            {[0, 6, 12, 18, 23].map((hour) => {
              const x = (hour / 23) * (size.w - 80) + 60
              return (
                <g key={`time-${hour}`}>
                  <line x1={x} y1={size.h - 10} x2={x} y2={size.h} stroke="#e2e8f0" strokeWidth={1} />
                  <text
                    x={x}
                    y={size.h + 20}
                    fontSize={13}
                    fill="#64748b"
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {hour.toString().padStart(2, '0')}:00
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
        )}

        {/* Controls */}
        <div className="px-8 py-6 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">แสดง:</span>
            <button
              onClick={() => setShowHigh(!showHigh)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                showHigh
                  ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700"
                  : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-500"
              )}
            >
              <ArrowUp className="w-4 h-4" /> น้ำขึ้น
            </button>
            <button
              onClick={() => setShowLow(!showLow)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2",
                showLow
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700"
                  : "bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-500"
              )}
            >
              <ArrowDown className="w-4 h-4" /> น้ำลง
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <Info className="w-4 h-4" />
            <span>ลงกดที่ปุ่มเพื่อซ่อน/แสดงตัวหนี</span>
          </div>
        </div>
      </div>
    </div>
  )
}
