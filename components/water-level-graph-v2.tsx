"use client"

import React, { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronDown } from "lucide-react"
import { TideData, ApiStatus } from "@/lib/tide-service"
import { cn } from "@/lib/utils"
import chonburiPierDataset from "@/data/pier-msl.json"

interface WaterLevelGraphProps {
  tideData: TideData
  location?: { lat: number; lon: number; name: string }
}

type RawPierReference = {
  id: string
  name: string
  province: string
  latitude: number
  longitude: number
  mslHeightMeters: number
  reference: string
  note?: string
}

type PierReference = {
  id: string
  name: string
  province: string
  mslHeight: number
  reference: string
  note?: string
  latitude?: number
  longitude?: number
  distance?: number
}

const CHONBURI_PIER_REFERENCES: PierReference[] = (chonburiPierDataset as RawPierReference[]).map((pier) => ({
  id: pier.id,
  name: pier.name,
  province: pier.province,
  mslHeight: pier.mslHeightMeters,
  reference: pier.reference,
  note: pier.note,
  latitude: pier.latitude,
  longitude: pier.longitude,
}))

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

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export const WaterLevelGraphV2: React.FC<WaterLevelGraphProps> = ({ tideData, location }) => {
  const [showHourlyTable, setShowHourlyTable] = useState(false)
  const [showPierReference, setShowPierReference] = useState(false)
  const maxLevel = Math.max(...tideData.graphData.map(d => d.level))
  const minLevel = Math.min(...tideData.graphData.map(d => d.level))
  const levelRange = maxLevel - minLevel || 1

  // Find 2 nearest piers by distance to selected location
  const twoNearestPiers = useMemo<PierReference[]>(() => {
    if (!location?.lat || !location?.lon) {
      // Fallback: return first 2 piers if no location
      return CHONBURI_PIER_REFERENCES.slice(0, 2)
    }

    const piersWithDistance = CHONBURI_PIER_REFERENCES.map(pier => ({
      ...pier,
      distance: pier.latitude && pier.longitude 
        ? calculateDistance(location.lat, location.lon, pier.latitude, pier.longitude)
        : Infinity
    }))

    return piersWithDistance
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      .slice(0, 2)
  }, [location?.lat, location?.lon])

  const getBarHeight = (level: number) => {
    return Math.max(3, ((level - minLevel) / levelRange) * 100)
  }

  const getBarColor = (data: TideData['graphData'][number]) => {
    const currentHour = new Date().getHours()
    const dataHour = Number.parseInt(data.time.split(':')[0], 10)
    
    if (dataHour === currentHour) {
      return data.prediction 
        ? 'bg-gradient-to-t from-yellow-400 to-yellow-500 border-2 border-yellow-600' 
        : 'bg-gradient-to-t from-blue-500 to-blue-600 border-2 border-yellow-300'
    }
    
    return data.prediction 
      ? 'bg-gradient-to-t from-blue-300/60 to-blue-400/60 border border-blue-500' 
      : 'bg-gradient-to-t from-blue-500 to-blue-700'
  }

  return (
    <div className="space-y-6">
      {/* Main Graph Card */}
      <Card className="w-full shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle className="text-lg">📊 ระดับน้ำทะเล (24 ชม.)</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">ค่าสูงสุด: {maxLevel.toFixed(2)}ม. | ค่าต่ำสุด: {minLevel.toFixed(2)}ม.</p>
            </div>
            <ApiStatusBadge status={tideData.apiStatus} message={tideData.apiStatusMessage} />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {tideData.currentWaterLevel.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">ม. (ปัจจุบัน)</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {tideData.waterLevelStatus}
              </div>
              <div className="text-xs text-muted-foreground">สถานะ</div>
            </div>
            <div className="text-center">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                {new Date(tideData.lastUpdated).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xs text-muted-foreground">อัปเดตล่าสุด</div>
            </div>
          </div>

          {/* Water Level Graph */}
          <div className="relative pt-2">
            <div className="h-56 bg-gradient-to-b from-blue-50 via-blue-100 to-cyan-100 dark:from-blue-900/30 dark:via-blue-800/30 dark:to-cyan-900/30 rounded-xl p-4 border border-blue-300 dark:border-blue-700 shadow-sm">
              {/* Background grid - subtle */}
              <div className="absolute inset-4 grid grid-rows-3 gap-0 opacity-15 pointer-events-none">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border-t border-blue-400 dark:border-blue-500"></div>
                ))}
              </div>

              {/* Pier reference lines - both nearest piers */}
              {twoNearestPiers.map((pier, idx) => {
                if (!pier.latitude || !pier.longitude || pier.mslHeight < minLevel || pier.mslHeight > maxLevel) {
                  return null
                }
                
                const yPos = 12.5 + ((pier.mslHeight - minLevel) / levelRange) * 75
                
                return (
                  <div
                    key={pier.id}
                    className="absolute left-4 right-4 flex items-center"
                    style={{
                      top: `${yPos}%`,
                    }}
                  >
                    <div className={`w-full border-t-2 border-dashed ${
                      idx === 0 ? 'border-orange-400' : 'border-amber-400'
                    } opacity-70`} />
                    <div className={`absolute left-1 top-0 transform -translate-y-1/2 text-xs font-bold px-2.5 py-1 rounded whitespace-nowrap shadow-md ${
                      idx === 0 
                        ? 'bg-orange-500/90 text-white' 
                        : 'bg-amber-500/90 text-white'
                    }`}>
                      📍 {pier.name}
                    </div>
                  </div>
                )
              })}

              {/* Water bars */}
              <div className="relative h-full flex items-end justify-between gap-0.5">
                {tideData.graphData.map((data, index) => {
                  const height = getBarHeight(data.level)
                  const dataHour = parseInt(data.time.split(':')[0], 10)
                  const currentHour = new Date().getHours()
                  const isCurrentHour = dataHour === currentHour
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center relative group min-w-0">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 z-20 transition-opacity pointer-events-none">
                        <div className="bg-gray-900 text-white text-xs font-semibold rounded px-2 py-1 whitespace-nowrap shadow-md">
                          {data.time}: {data.level.toFixed(2)}ม.
                          {data.prediction ? ' 📈' : ' ✓'}
                        </div>
                      </div>
                      
                      {/* Bar */}
                      <div 
                        className={cn(
                          'w-full rounded-t transition-all duration-200 origin-bottom',
                          getBarColor(data)
                        )}
                        style={{ height: `${height}%` }}
                      />
                      
                      {/* Time label every 4 hours */}
                      {index % 4 === 0 && (
                        <span className="text-xs mt-2 text-gray-700 dark:text-gray-300 font-semibold">
                          {data.time}
                        </span>
                      )}

                      {/* Current hour indicator */}
                      {isCurrentHour && (
                        <div className="absolute -top-1.5 w-1 h-1 bg-yellow-400 rounded-full border border-yellow-600 animate-pulse"></div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Y-axis - Simple */}
            <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-between text-xs text-gray-600 dark:text-gray-400 font-bold -ml-10">
              <span className="text-right">{maxLevel.toFixed(2)}ม.</span>
              <span className="text-right">{minLevel.toFixed(2)}ม.</span>
            </div>
          </div>

          {/* Tide Times Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950 dark:to-pink-950 rounded-lg border border-red-200 dark:border-red-800">
              <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">🌊 น้ำขึ้นสูงสุด</div>
              <div className="text-lg font-bold text-red-600 dark:text-red-400">{tideData.highTideTime || '--:--'}</div>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">⬇️ น้ำลงต่ำสุด</div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">{tideData.lowTideTime || '--:--'}</div>
            </div>
          </div>

          {/* Legend - Simplified */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-t from-blue-600 to-blue-500 rounded"></div>
              <span className="font-medium">ข้อมูลจริง</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-t from-blue-300 to-blue-400 border border-blue-500 rounded"></div>
              <span className="font-medium">ข้อมูลทำนาย</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-t from-yellow-400 to-yellow-500 border-2 border-yellow-600 rounded"></div>
              <span className="font-medium">เวลาปัจจุบัน</span>
            </div>
          </div>

          {/* Pier info */}
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-700 text-xs">
            <div className="font-semibold text-amber-900 dark:text-amber-200 mb-1">📍 ท่าเรือสำคัญ (ชลบุรี):</div>
            <div className="space-y-0.5 text-amber-800 dark:text-amber-300">
              {twoNearestPiers.map((pier, idx) => (
                <div key={pier.id}>
                  {idx === 0 ? '🟧' : '🟨'} {pier.name}: {pier.mslHeight.toFixed(2)}ม. ({pier.reference})
                </div>
              ))}
            </div>
          </div>

          {/* Hourly Water Level Table - Collapsible Dropdown */}
          <div className="border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => setShowHourlyTable(!showHourlyTable)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900 dark:hover:to-indigo-900 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-blue-900 dark:text-blue-100">📊 ตารางระดับน้ำทุกชั่วโมง (24 ชม.)</span>
              <ChevronDown 
                className={cn(
                  'w-5 h-5 text-blue-900 dark:text-blue-100 transition-transform',
                  showHourlyTable && 'rotate-180'
                )}
              />
            </button>
            
            {showHourlyTable && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-blue-100 dark:bg-blue-900/50 border-b border-blue-200 dark:border-blue-800">
                      <th className="px-3 py-2 text-left font-semibold text-blue-900 dark:text-blue-200">เวลา</th>
                      <th className="px-3 py-2 text-right font-semibold text-blue-900 dark:text-blue-200">ระดับน้ำ (ม.)</th>
                      <th className="px-3 py-2 text-center font-semibold text-blue-900 dark:text-blue-200">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tideData.graphData.map((data, index) => {
                      const dataHour = parseInt(data.time.split(':')[0], 10)
                      const currentHour = new Date().getHours()
                      const isCurrentHour = dataHour === currentHour
                      
                      return (
                        <tr 
                          key={index} 
                          className={cn(
                            'border-b border-blue-100 dark:border-blue-900/30 transition-colors',
                            isCurrentHour 
                              ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                              : index % 2 === 0 
                              ? 'bg-white dark:bg-slate-900' 
                              : 'bg-blue-50/50 dark:bg-slate-800/50'
                          )}
                        >
                          <td className="px-3 py-2 font-mono text-blue-900 dark:text-blue-200">
                            {isCurrentHour ? '⏰' : '  '} {data.time}
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-semibold text-blue-700 dark:text-blue-300">
                            {data.level.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge className={cn(
                              'text-xs',
                              data.prediction 
                                ? 'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100' 
                                : 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
                            )}>
                              {data.prediction ? '📈 ทำนาย' : '✓ จริง'}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pier Reference Dropdown */}
          <div className="border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
            <button
              onClick={() => setShowPierReference(!showPierReference)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-b border-amber-200 dark:border-amber-800 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900 dark:hover:to-orange-900 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-amber-900 dark:text-amber-100">📍 ท่าเรือสำคัญใกล้เคียง</span>
              <ChevronDown 
                className={cn(
                  'w-5 h-5 text-amber-900 dark:text-amber-100 transition-transform',
                  showPierReference && 'rotate-180'
                )}
              />
            </button>
            
            {showPierReference && (
              <div className="p-4 space-y-3">
                {twoNearestPiers.map((pier, idx) => {
                  const distance = pier.distance ? pier.distance.toFixed(1) : 'N/A'
                  return (
                    <div key={pier.id} className={`p-3 rounded-lg border-2 ${
                      idx === 0 
                        ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-700' 
                        : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className={`text-2xl font-bold ${
                          idx === 0 ? 'text-orange-600 dark:text-orange-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {idx === 0 ? '🟧' : '🟨'}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 dark:text-gray-100">{pier.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-0.5">
                            <div>📌 {pier.province}</div>
                            <div>📏 ระดับน้ำ (MSL): <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{pier.mslHeight.toFixed(2)}ม.</span></div>
                            {pier.distance !== undefined && (
                              <div>📍 ระยะทาง: <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">{distance} กม.</span></div>
                            )}
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">📚 {pier.reference}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
