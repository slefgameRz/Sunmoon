"use client"

import * as React from "react"
import { ArrowUp, ArrowDown, Droplets, Clock } from "lucide-react"
import type { TideData } from "@/lib/tide-service"

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
  const { currentWaterLevel = 0, tideEvents = [], waterLevelStatus = "ไม่ทราบ", apiStatus = "error" } = tideData || {}
  const [showHigh, setShowHigh] = React.useState(true)
  const [showLow, setShowLow] = React.useState(true)

  const graphData = Array.isArray(tideData?.graphData) ? tideData.graphData : []

  // Responsive sizing using window width (client only)
  const [size, setSize] = React.useState({ w: 640, h: 220 })
  React.useEffect(() => {
    function update() {
      const w = Math.min(900, Math.max(320, window.innerWidth - 48))
      const h = window.innerWidth < 640 ? 140 : 220
      setSize({ w, h })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const points = graphData.map((p: any, i: number) => {
    const x = (i / Math.max(1, graphData.length - 1)) * size.w
    const y = size.h - ((p.level - TIDE_VISUAL_MIN) / VISUAL_RANGE) * size.h
    return { x, y, time: p.time, level: p.level }
  })

  const pathD = pointsToSmoothPath(points.map(pt => ({ x: pt.x, y: pt.y })))

  return (
    <div className="space-y-4" aria-live="polite">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-blue-50 to-indigo-50 rounded-md">
            <Droplets className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-sm text-gray-600">{waterLevelStatus}</div>
            <div className="text-lg font-semibold">{currentWaterLevel.toFixed(2)} ม.</div>
          </div>
        </div>

        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {apiStatus === 'loading' ? 'กำลังโหลด' : apiStatus === 'success' ? 'ออนไลน์' : apiStatus === 'timeout' ? 'เชื่อมต่อหมดเวลา' : apiStatus === 'offline' ? 'ออฟไลน์' : 'ไม่มีข้อมูล'}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
        <svg
          role="img"
          aria-label="กราฟระดับน้ำ 24 ชั่วโมง"
          viewBox={`0 0 ${size.w} ${size.h}`}
          width="100%"
          height="auto"
          preserveAspectRatio="none"
        >
          <title>กราฟระดับน้ำ 24 ชั่วโมง</title>
          <desc>แสดงระดับน้ำเป็นเส้นเรียบและแถบสีด้านล่างสำหรับช่วงน้ำขึ้นน้ำลง</desc>

          {/* defs: gradient */}
          <defs>
            <linearGradient id="grad-tide" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#eff6ff" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Left Y-axis labels and horizontal grid */}
          {Array.from({ length: 5 }).map((_, i) => {
            const y = (i / 4) * size.h
            const label = (TIDE_VISUAL_MAX - (i * VISUAL_RANGE) / 4).toFixed(1)
            return (
              <g key={i}>
                <line x1={40} y1={y} x2={size.w - 8} y2={y} stroke="#e6eef8" strokeWidth={1} />
                <text x={6} y={y + 4} fontSize={12} fill="#475569">{label}</text>
              </g>
            )
          })}

          {/* area under curve (if path exists) */}
          {points.length > 1 && (
            <path
              d={`${pathD} L ${size.w} ${size.h} L 0 ${size.h} Z`}
              fill="url(#grad-tide)"
              opacity={0.9}
            />
          )}

          {/* smooth stroke */}
          {points.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke="#2563eb"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* markers for high/low (improved look) */}
          {tideEvents.filter((e: any) => (e.type === 'high' && showHigh) || (e.type === 'low' && showLow)).map((ev: any, idx: number) => {
            const match = points.reduce((best, p) => Math.abs(p.level - ev.level) < Math.abs(best.level - ev.level) ? p : best, points[0] || { x: 0, y: 0, level: 0 })
            return (
              <g key={idx} transform={`translate(${match.x},${match.y})`}>
                <circle r={6} fill={ev.type === 'high' ? '#fb7185' : '#60a5fa'} stroke="#fff" strokeWidth={1.5} />
                <text x={10} y={4} fontSize={11} fill="#334155">{ev.type === 'high' ? 'สูงสุด ' : 'ต่ำสุด '}{ev.time}</text>
              </g>
            )
          })}

          {/* current level indicator (use closest point to now) */}
          {points.length > 0 && (
            (() => {
              const mid = Math.floor(points.length / 2)
              const p = points[mid]
              return (
                <g>
                  <circle cx={p.x} cy={p.y} r={5} fill="#7c3aed" />
                  <text x={p.x + 8} y={p.y - 8} fontSize={12} fill="#111827">{currentWaterLevel.toFixed(2)} ม.</text>
                </g>
              )
            })()
          )}
        </svg>

        <div className="flex items-center justify-between text-xs text-gray-600 mt-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHigh(!showHigh)}
              role="button"
              aria-label={showHigh ? 'ปิดการแสดงน้ำขึ้น' : 'เปิดการแสดงน้ำขึ้น'}
              className={"px-3 py-1 rounded-full border " + (showHigh ? 'bg-red-50 border-red-200' : 'bg-transparent border-gray-200')}>
              <ArrowUp className="w-4 h-4 inline-block mr-1" /> น้ำขึ้น
            </button>
            <button
              onClick={() => setShowLow(!showLow)}
              role="button"
              aria-label={showLow ? 'ปิดการแสดงน้ำลง' : 'เปิดการแสดงน้ำลง'}
              className={"px-3 py-1 rounded-full border " + (showLow ? 'bg-blue-50 border-blue-200' : 'bg-transparent border-gray-200')}>
              <ArrowDown className="w-4 h-4 inline-block mr-1" /> น้ำลง
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500">24 ชั่วโมง</div>
            <div className="px-2 py-0.5 bg-gray-100 rounded text-xs">ดูแบบเรียบ</div>
          </div>
        </div>
      </div>
    </div>
  )
}


