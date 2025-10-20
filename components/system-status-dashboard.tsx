"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Database,
  HardDrive,
  Clock,
  Activity
} from "lucide-react"

interface APIHealth {
  status: string
  timestamp: string
  apis: {
    openweather: {
      status: string
      message: string
      testLocation?: string
      temperature?: number
    }
    stormglass: {
      status: string
      message: string
      testLocation?: string
      dataPoints?: number
    }
  }
  region: string
  version: string
}

export default function SystemStatusDashboard() {
  const [health, setHealth] = useState<APIHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [cacheSize, setCacheSize] = useState(0)
  const [lastChecked, setLastChecked] = useState<Date>(new Date())

  const checkHealth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealth(data)
      setLastChecked(new Date())
    } catch (error) {
      console.error('Health check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkCacheSize = async () => {
    try {
      if ('caches' in window) {
        let totalSize = 0
        const cacheNames = await caches.keys()
        
        for (const name of cacheNames) {
          const cache = await caches.open(name)
          const requests = await cache.keys()
          
          for (const request of requests) {
            const response = await cache.match(request)
            if (response) {
              const blob = await response.clone().blob()
              totalSize += blob.size
            }
          }
        }
        
        setCacheSize(totalSize)
      }
    } catch (error) {
      console.error('Cache size check failed:', error)
    }
  }

  useEffect(() => {
    checkHealth()
    checkCacheSize()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      checkHealth()
      checkCacheSize()
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'disabled':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'ok': 'default',
      'error': 'destructive',
      'disabled': 'secondary'
    }
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status === 'ok' ? 'ทำงานปกติ' : status === 'error' ? 'ข้อผิดพลาด' : 'ปิดใช้งาน'}
      </Badge>
    )
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatTime = (date: Date) => {
    return date.toLocaleString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <span>สถานะระบบ</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              checkHealth()
              checkCacheSize()
            }}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2">รีเฟรช</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Status */}
        {health && (
          <>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>API Services</span>
              </h3>
              
              {/* OpenWeather */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(health.apis.openweather.status)}
                  <div>
                    <p className="font-medium text-sm">OpenWeather API</p>
                    <p className="text-xs text-gray-500">
                      {health.apis.openweather.message}
                      {health.apis.openweather.testLocation && (
                        <span className="ml-1">
                          • {health.apis.openweather.testLocation}
                          {health.apis.openweather.temperature && (
                            <span> • {health.apis.openweather.temperature.toFixed(1)}°C</span>
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {getStatusBadge(health.apis.openweather.status)}
              </div>

              {/* Stormglass */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(health.apis.stormglass.status)}
                  <div>
                    <p className="font-medium text-sm">Stormglass API</p>
                    <p className="text-xs text-gray-500">
                      {health.apis.stormglass.message}
                      {health.apis.stormglass.testLocation && (
                        <span className="ml-1">
                          • {health.apis.stormglass.testLocation}
                          {health.apis.stormglass.dataPoints !== undefined && (
                            <span> • {health.apis.stormglass.dataPoints} จุดข้อมูล</span>
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {getStatusBadge(health.apis.stormglass.status)}
              </div>
            </div>

            {/* Cache Info */}
            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                <HardDrive className="h-4 w-4" />
                <span>Offline Storage</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">ขนาด Cache</p>
                  <p className="text-lg font-bold text-blue-900">{formatBytes(cacheSize)}</p>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">เวอร์ชัน</p>
                  <p className="text-lg font-bold text-purple-900">{health.version}</p>
                </div>
              </div>
            </div>

            {/* Last Update */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>อัปเดตล่าสุด:</span>
              </div>
              <span className="font-mono">{formatTime(lastChecked)}</span>
            </div>

            {/* Region */}
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <p className="text-xs text-gray-600">🌏 พื้นที่ให้บริการ</p>
              <p className="text-sm font-medium text-gray-900">{health.region}</p>
              <p className="text-xs text-gray-500 mt-1">
                ข้อมูลน้ำขึ้นน้ำลงและสภาพอากาศสำหรับประเทศไทย
              </p>
            </div>
          </>
        )}

        {!health && !loading && (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>ไม่สามารถโหลดข้อมูลสถานะระบบ</p>
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              className="mt-4"
            >
              ลองอีกครั้ง
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
