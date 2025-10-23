"use client"

import React, { useState, useEffect } from 'react'
import type { TideData, WeatherData } from '@/lib/tide-service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Wifi,
  WifiOff,
  Zap,
  HardDrive,
  RefreshCw,
  TrendingDown,
  Network,
  Smartphone
} from 'lucide-react'
import { detectNetworkQuality, formatDataSize, calculateDataSavings } from '@/lib/network-optimization'
import { cn } from '@/lib/utils'

interface NetworkOptimizationStatsProps {
  tideData?: TideData | null
  weatherData?: WeatherData | null
  compressionStats?: {
    tideCompressed: boolean
    weatherCompressed: boolean
    totalSavings: string
  }
  onRefresh?: () => void
  className?: string
}

export default function NetworkOptimizationStats({
  tideData,
  weatherData,
  compressionStats,
  onRefresh,
  className
}: NetworkOptimizationStatsProps) {
  const [networkQuality, setNetworkQuality] = useState(detectNetworkQuality())
  const [dataUsage, setDataUsage] = useState({ total: 0, compressed: 0 })
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Update network quality periodically
  useEffect(() => {
    const updateNetwork = () => setNetworkQuality(detectNetworkQuality())

    updateNetwork()
    const interval = setInterval(updateNetwork, 30000) // Update every 30 seconds

    // Listen for network changes
    window.addEventListener('online', updateNetwork)
    window.addEventListener('offline', updateNetwork)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', updateNetwork)
      window.removeEventListener('offline', updateNetwork)
    }
  }, [])

  // Calculate data usage stats
  useEffect(() => {
    if (tideData || weatherData) {
      const tideSize = tideData ? JSON.stringify(tideData).length : 0
      const weatherSize = weatherData ? JSON.stringify(weatherData).length : 0
      const totalOriginal = tideSize + weatherSize

      // Estimate compressed size (rough calculation)
      const compressionRatio = compressionStats?.totalSavings ?
        parseFloat(compressionStats.totalSavings) / 100 : 0.3 // Default 30% compression
      const totalCompressed = Math.round(totalOriginal * (1 - compressionRatio))

      setDataUsage({ total: totalOriginal, compressed: totalCompressed })
    }
  }, [tideData, weatherData, compressionStats])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh?.()
    } finally {
      setIsRefreshing(false)
    }
  }

  const getNetworkIcon = () => {
    switch (networkQuality.type) {
      case 'excellent': return <Wifi className="h-5 w-5 text-green-600" />
      case 'good': return <Wifi className="h-5 w-5 text-blue-600" />
      case 'fair': return <Network className="h-5 w-5 text-yellow-600" />
      case 'poor': return <WifiOff className="h-5 w-5 text-red-600" />
      case 'offline': return <WifiOff className="h-5 w-5 text-gray-600" />
    }
  }

  const getNetworkColor = () => {
    switch (networkQuality.type) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200'
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'poor': return 'bg-red-100 text-red-800 border-red-200'
      case 'offline': return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const savings = calculateDataSavings(dataUsage.total, dataUsage.compressed)

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5" />
            การเพิ่มประสิทธิภาพเครือข่าย
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            รีเฟรช
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {getNetworkIcon()}
            <div>
              <div className="font-medium">สถานะเครือข่าย</div>
              <div className="text-sm text-gray-600">
                {networkQuality.type === 'excellent' && 'เยี่ยม - 4G เร็ว'}
                {networkQuality.type === 'good' && 'ดี - 4G'}
                {networkQuality.type === 'fair' && 'ปานกลาง - 3G'}
                {networkQuality.type === 'poor' && 'ช้า - 2G/ช้า'}
                {networkQuality.type === 'offline' && 'ออฟไลน์'}
              </div>
            </div>
          </div>
          <Badge className={cn("font-medium", getNetworkColor())}>
            {networkQuality.speed.toUpperCase()}
          </Badge>
        </div>

        {/* Data Compression Stats */}
        {(compressionStats || dataUsage.total > 0) && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">ข้อมูลดั้งเดิม</span>
              </div>
              <div className="text-lg font-bold text-blue-900">
                {formatDataSize(dataUsage.total)}
              </div>
            </div>

            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">หลังบีบอัด</span>
              </div>
              <div className="text-lg font-bold text-green-900">
                {formatDataSize(dataUsage.compressed)}
              </div>
              {savings.ratio > 0 && (
                <div className="text-xs text-green-700 mt-1">
                  ประหยัด {savings.ratio}%
                </div>
              )}
            </div>
          </div>
        )}

        {/* Compression Details */}
        {compressionStats && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">รายละเอียดการบีบอัด:</div>
            <div className="flex flex-wrap gap-2">
              {compressionStats.tideCompressed && (
                <Badge variant="outline" className="text-xs">
                  🌊 น้ำขึ้นน้ำลง ✓
                </Badge>
              )}
              {compressionStats.weatherCompressed && (
                <Badge variant="outline" className="text-xs">
                  🌤️ สภาพอากาศ ✓
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                💾 ประหยัด {compressionStats.totalSavings}
              </Badge>
            </div>
          </div>
        )}

        {/* Network Optimization Tips */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium text-amber-800 mb-1">เคล็ดลับเพิ่มประสิทธิภาพ:</div>
              <ul className="text-amber-700 space-y-1 text-xs">
                {networkQuality.type === 'poor' && (
                  <>
                    <li>• ใช้ข้อมูลที่บีบอัดเพื่อลดการใช้ข้อมูล</li>
                    <li>• แคชข้อมูลไว้เพื่อใช้งานออฟไลน์</li>
                    <li>• ลดความถี่ในการอัปเดตอัตโนมัติ</li>
                  </>
                )}
                {networkQuality.type === 'fair' && (
                  <>
                    <li>• บีบอัดข้อมูลสำหรับการโหลดเร็วขึ้น</li>
                    <li>• ใช้การเชื่อมต่อ WiFi เมื่อเป็นไปได้</li>
                  </>
                )}
                {networkQuality.type === 'excellent' && (
                  <li>• การเชื่อมต่อของคุณทำงานได้อย่างสมบูรณ์</li>
                )}
                {networkQuality.type === 'offline' && (
                  <li>• กำลังใช้วิธีออฟไลน์ - ข้อมูลอาจเป็นข้อมูลเก่า</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Battery Optimization Info */}
        {networkQuality.type === 'poor' && (
          <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
            🔋 การทำงานบนเซลลูลาร์ช้า: ปรับลดการใช้แบตเตอรี่และการอัปเดตอัตโนมัติ
          </div>
        )}
      </CardContent>
    </Card>
  )
}