"use client"

import React, { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown } from "lucide-react"
import { TideData, ApiStatus } from "@/lib/tide-service"
import { cn } from "@/lib/utils"
// import chonburiPierDataset from "@/data/pier-msl.json"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

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

export const WaterLevelGraphV2: React.FC<WaterLevelGraphProps> = ({ tideData, location }) => {
  const [showHourlyTable, setShowHourlyTable] = useState(false)
  const [activeDataPoint, setActiveDataPoint] = useState<any>(null)

  const minLevel = Math.min(...tideData.graphData.map(d => d.level))
  const maxLevel = Math.max(...tideData.graphData.map(d => d.level))
  const paddedMin = minLevel - 0.3
  const paddedMax = maxLevel + 0.3

  // Simplified tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const { level } = payload[0].payload
      return (
        <div className="bg-white dark:bg-slate-900 p-2 rounded shadow">
          <p className="text-sm font-bold">{label}</p>
          <p className="text-xs">{level.toFixed(2)} m</p>
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
              <div className="flex items-center gap-3 mt-1.5">
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-normal">
                  สูงสุด: {maxLevel.toFixed(2)} ม.
                </Badge>
                <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-normal">
                  ต่ำสุด: {minLevel.toFixed(2)} ม.
                </Badge>
              </div>
            </div>
            <ApiStatusBadge status={tideData.apiStatus} message={tideData.apiStatusMessage} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Current Level Display */}
          <div className="px-6 py-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">ระดับน้ำปัจจุบัน ({tideData.waterLevelStatus})</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tight">{tideData.currentWaterLevel.toFixed(2)}</span>
                  <span className="text-lg font-medium text-blue-200">เมตร</span>
                </div>
                <p className="text-xs text-blue-200 mt-2 flex items-center gap-1 opacity-80">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-200 animate-pulse" />
                  อัปเดตเมื่อ: {new Date(tideData.lastUpdated).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </p>
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

          {/* Chart */}
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
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="level" stroke="#2563eb" strokeWidth={3} fill="url(#colorLevel)" animationDuration={1000} activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
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
                    <th className="px-4 py-2 text-center font-semibold text-slate-600 dark:text-slate-300">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {tideData.graphData.map((data, index) => {
                    const dataHour = parseInt(data.time.split(':')[0], 10)
                    const curHour = new Date().getHours()
                    const isCurrent = dataHour === curHour
                    return (
                      <tr key={index} className={cn('transition-colors', isCurrent ? 'bg-blue-50/60 dark:bg-blue-900/20' : 'bg-white dark:bg-slate-900')}>
                        <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300">{data.time}</td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{data.level.toFixed(2)}</td>
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
