"use client"

import React, { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, MapPin, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { TideData, ApiStatus } from "@/lib/tide-service"
import { cn } from "@/lib/utils"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import {
  compareWaterLevel,
  compareWithPrediction,
  getPredictionDeviationColor,
  type WaterLevelComparison,
  type PredictionDeviation,
} from "@/lib/water-level-comparison"

interface WaterLevelGraphProps {
  tideData: TideData
  location?: { lat: number; lon: number; name: string }
}

const ApiStatusBadge: React.FC<{ status: ApiStatus; message: string }> = ({ status, message }) => {
  const getStatusColor = (status: ApiStatus) => {
    switch (status) {
      case "success": return "bg-green-500 text-white"
      case "loading": return "bg-blue-500 text-white animate-pulse"
      case "error": return "bg-red-500 text-white"
      case "timeout": return "bg-orange-500 text-white"
      case "offline": return "bg-gray-500 text-white"
      default: return "bg-gray-400 text-white"
    }
  }
  const getStatusIcon = (status: ApiStatus) => {
    switch (status) {
      case "success": return "✓"
      case "loading": return "⟳"
      case "error": return "✗"
      case "timeout": return "⏱"
      case "offline": return "⚠"
      default: return "?"
    }
  }
  return (
    <Badge className={`${getStatusColor(status)} mb-2`}>
      <span className="mr-1">{getStatusIcon(status)}</span>
      {message}
    </Badge>
  )
}

// Component สำหรับแสดงการเปรียบเทียบกับจุดอ้างอิง
const ReferenceComparisonBadge: React.FC<{ comparison: WaterLevelComparison }> = ({ comparison }) => {
  if (!comparison.referencePoint && comparison.distanceKm < 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        <span className="text-xs text-yellow-700 dark:text-yellow-300">
          ใช้ค่าประมาณ (ไม่พบจุดอ้างอิงใกล้เคียง)
        </span>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-1 px-3 py-2 rounded-lg border", comparison.statusColor)}>
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        <span className="text-xs font-medium">
          {comparison.referencePoint?.name} ({comparison.distanceKm.toFixed(1)} กม.)
        </span>
      </div>
      <div className="flex items-center gap-2">
        {comparison.isAboveReference ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )}
        <span className="text-xs">
          {comparison.statusText}
        </span>
      </div>
    </div>
  )
}

// Component สำหรับแสดงความแตกต่างจากค่าทำนาย
const PredictionDeviationBadge: React.FC<{ deviation: PredictionDeviation }> = ({ deviation }) => {
  if (deviation.warningLevel === "none") {
    return null
  }

  const colorClass = getPredictionDeviationColor(deviation.warningLevel)

  return (
    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border", colorClass)}>
      {deviation.isHigherThanPredicted ? (
        <TrendingUp className="w-4 h-4" />
      ) : (
        <TrendingDown className="w-4 h-4" />
      )}
      <span className="text-xs font-medium">
        {deviation.warningText}
      </span>
    </div>
  )
}

export const WaterLevelGraphV2: React.FC<WaterLevelGraphProps> = ({ tideData, location }) => {
  const [showHourlyTable, setShowHourlyTable] = useState(false)
  const [activeDataPoint, setActiveDataPoint] = useState<any>(null)

  const minLevel = Math.min(...tideData.graphData.map(d => d.level))
  const maxLevel = Math.max(...tideData.graphData.map(d => d.level))
  const paddedMin = minLevel - 0.3
  const paddedMax = maxLevel + 0.3

  // คำนวณการเปรียบเทียบกับจุดอ้างอิง
  const waterLevelComparison = useMemo<WaterLevelComparison>(() => {
    if (location) {
      return compareWaterLevel(location.lat, location.lon, tideData.currentWaterLevel)
    }
    // Default comparison if no location
    return compareWaterLevel(13.7563, 100.5018, tideData.currentWaterLevel)
  }, [location, tideData.currentWaterLevel])

  // คำนวณความแตกต่างจากค่าทำนาย - ใช้เฉพาะข้อมูลจริงเท่านั้น
  const predictionDeviation = useMemo<PredictionDeviation | null>(() => {
    const currentHour = new Date().getHours()

    // หาค่าทำนายสำหรับชั่วโมงปัจจุบัน
    const predictedData = tideData.graphData.find(d => {
      const dataHour = parseInt(d.time.split(':')[0], 10)
      return dataHour === currentHour && d.prediction === true
    })

    // หาข้อมูลจริงสำหรับชั่วโมงปัจจุบัน (prediction = false)
    const actualData = tideData.graphData.find(d => {
      const dataHour = parseInt(d.time.split(':')[0], 10)
      return dataHour === currentHour && d.prediction === false
    })

    // เปรียบเทียบเฉพาะเมื่อมีทั้งข้อมูลจริงและค่าทำนาย
    if (actualData && predictedData) {
      return compareWithPrediction(actualData.level, predictedData.level)
    }

    // ถ้ามี currentWaterLevel (ข้อมูลจริง) และมีค่าทำนาย
    if (predictedData && tideData.currentWaterLevel > 0) {
      return compareWithPrediction(tideData.currentWaterLevel, predictedData.level)
    }

    return null
  }, [tideData.graphData, tideData.currentWaterLevel])


  // Simplified tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const { level, prediction } = payload[0].payload
      const diff = level - waterLevelComparison.referenceLevel
      return (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{label}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            ระดับน้ำ: <span className="font-bold">{level.toFixed(2)} ม.</span>
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            เทียบอ้างอิง: <span className={cn("font-medium", diff > 0 ? "text-orange-500" : "text-green-500")}>
              {diff > 0 ? "+" : ""}{diff.toFixed(2)} ม.
            </span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {prediction ? "📊 ค่าทำนาย" : "✓ ค่าจริง"}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      <Card className="w-full shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-900/90 overflow-hidden ring-1 ring-slate-900/5">
        <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="text-2xl mr-1">🌊</span> กราฟระดับน้ำทะเล
              </CardTitle>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-normal">
                  สูงสุด: {maxLevel.toFixed(2)} ม.
                </Badge>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-normal">
                  ต่ำสุด: {minLevel.toFixed(2)} ม.
                </Badge>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-normal">
                  MSL: {waterLevelComparison.referenceLevel.toFixed(2)} ม.
                </Badge>
              </div>
            </div>
            <ApiStatusBadge status={tideData.apiStatus} message={tideData.apiStatusMessage} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Reference Comparison Panel */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row gap-3">
              <ReferenceComparisonBadge comparison={waterLevelComparison} />
              {predictionDeviation && predictionDeviation.warningLevel !== "none" && (
                <PredictionDeviationBadge deviation={predictionDeviation} />
              )}
            </div>
          </div>

          {/* Current Level Display */}
          <div className={cn(
            "px-6 py-6 text-white",
            waterLevelComparison.status === "critical"
              ? "bg-gradient-to-br from-red-500 to-red-600"
              : waterLevelComparison.status === "warning"
                ? "bg-gradient-to-br from-orange-500 to-orange-600"
                : waterLevelComparison.status === "low"
                  ? "bg-gradient-to-br from-cyan-500 to-cyan-600"
                  : "bg-gradient-to-br from-blue-500 to-blue-600"
          )}>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">
                  ระดับน้ำปัจจุบัน ({tideData.waterLevelStatus})
                  {waterLevelComparison.status === "critical" && " ⚠️ วิกฤต"}
                  {waterLevelComparison.status === "warning" && " ⚡ เตือน"}
                  {waterLevelComparison.status === "low" && " 🌊 น้ำลง"}
                </p>

                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tight">{tideData.currentWaterLevel.toFixed(2)}</span>
                  <span className="text-lg font-medium text-white/80">เมตร</span>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-xs text-white/70 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/70 animate-pulse" />
                    อัปเดตเมื่อ: {new Date(tideData.lastUpdated).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {tideData.dataSource && (
                    <p className="text-xs text-white/70 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                      แหล่งข้อมูล: {tideData.dataSource}
                    </p>
                  )}
                  {waterLevelComparison.isAboveReference && (
                    <p className="text-xs bg-white/20 px-2 py-1 rounded">
                      สูงกว่า MSL: +{waterLevelComparison.difference.toFixed(2)} ม.
                    </p>
                  )}
                </div>
              </div>
              {/* Mini tide times */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 min-w-[140px]">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                  <div className="text-xs text-white/90">🔺 สูงสุด</div>
                  <div className="font-bold text-sm">{tideData.highTideTime}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-white/90">🔻 ต่ำสุด</div>
                  <div className="font-bold text-sm">{tideData.lowTideTime}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart with Reference Line */}
          <div className="p-6">
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={tideData.graphData}
                  margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                  onMouseMove={e => {
                    if (e && e.activePayload) setActiveDataPoint(e.activePayload[0].payload)
                    else setActiveDataPoint(null)
                  }}
                  onMouseLeave={() => setActiveDataPoint(null)}
                >
                  <defs>
                    <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.8} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis domain={[paddedMin, paddedMax]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `${v.toFixed(1)}`} width={40} />

                  {/* MSL Reference Line */}
                  <ReferenceLine
                    y={waterLevelComparison.referenceLevel}
                    stroke="#10b981"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    label={{
                      value: `MSL ${waterLevelComparison.referenceLevel.toFixed(2)}m`,
                      position: 'right',
                      fill: '#10b981',
                      fontSize: 10
                    }}
                  />

                  {/* Warning Threshold Line */}
                  {waterLevelComparison.referencePoint?.warningThresholdMeters && (
                    <ReferenceLine
                      y={waterLevelComparison.referenceLevel + waterLevelComparison.referencePoint.warningThresholdMeters}
                      stroke="#f59e0b"
                      strokeDasharray="3 3"
                      strokeWidth={1}
                      label={{
                        value: 'เตือน',
                        position: 'right',
                        fill: '#f59e0b',
                        fontSize: 9
                      }}
                    />
                  )}

                  {/* Flood Threshold Line */}
                  {waterLevelComparison.referencePoint?.floodThresholdMeters && (
                    <ReferenceLine
                      y={waterLevelComparison.referenceLevel + waterLevelComparison.referencePoint.floodThresholdMeters}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      strokeWidth={1}
                      label={{
                        value: 'วิกฤต',
                        position: 'right',
                        fill: '#ef4444',
                        fontSize: 9
                      }}
                    />
                  )}

                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="level" stroke="#2563eb" strokeWidth={3} fill="url(#colorLevel)" animationDuration={1000} activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-green-500" style={{ borderTop: '2px dashed #10b981' }}></div>
                <span>MSL (ระดับน้ำทะเลปานกลาง)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-orange-500" style={{ borderTop: '2px dashed #f59e0b' }}></div>
                <span>ระดับเตือน</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-red-500" style={{ borderTop: '2px dashed #ef4444' }}></div>
                <span>ระดับวิกฤต</span>
              </div>
            </div>
          </div>

          {/* Toggle Table */}
          <button
            onClick={() => setShowHourlyTable(!showHourlyTable)}
            className="w-full py-3 text-center text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-white dark:bg-slate-900 transition-colors border-t border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center justify-center gap-1">
              {showHourlyTable ? 'ซ่อนตารางข้อมูล' : 'ดูตารางข้อมูลรายชั่วโมง'}
              <ChevronDown className={cn('w-4 h-4 transition-transform', showHourlyTable && 'rotate-180')} />
            </div>
          </button>

          {showHourlyTable && (
            <div className="max-h-60 overflow-y-auto border-t border-slate-100 dark:border-slate-800">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-slate-600 dark:text-slate-300">เวลา</th>
                    <th className="px-4 py-2 text-right font-semibold text-slate-600 dark:text-slate-300">ระดับน้ำ</th>
                    <th className="px-4 py-2 text-center font-semibold text-slate-600 dark:text-slate-300">เทียบ MSL</th>
                    <th className="px-4 py-2 text-center font-semibold text-slate-600 dark:text-slate-300">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tideData.graphData.map((data, index) => {
                    const dataHour = parseInt(data.time.split(':')[0], 10)
                    const curHour = new Date().getHours()
                    const isCurrent = dataHour === curHour
                    const diff = data.level - waterLevelComparison.referenceLevel
                    return (
                      <tr key={index} className={cn('transition-colors', isCurrent ? 'bg-blue-50/60 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-900')}>
                        <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300">{data.time}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{data.level.toFixed(2)}</td>
                        <td className={cn("px-4 py-2.5 text-center font-mono", diff > 0 ? "text-orange-500" : "text-green-500")}>
                          {diff > 0 ? "+" : ""}{diff.toFixed(2)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className={cn('inline-block w-1.5 h-1.5 mr-2 rounded-full', data.prediction ? 'bg-blue-400' : 'bg-green-500')} />
                          {data.prediction ? 'ทำนาย' : 'จริง'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
