import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Activity,
  Wifi,
  WifiOff,
  Server,
  Cloud,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Globe,
  Waves
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ApiStatus {
  name: string
  status: 'online' | 'offline' | 'degraded' | 'maintenance'
  latency?: number
  lastChecked: Date
  message?: string
}

interface SystemHealth {
  cpu: number
  memory: number
  uptime: number
  responseTime: number
}

interface ApiStatusDashboardProps {
  tideApiStatus: string
  weatherApiStatus: string
  lastUpdated: string
  onRefresh?: () => void
}

export default function ApiStatusDashboard({
  tideApiStatus,
  weatherApiStatus,
  lastUpdated,
  onRefresh
}: ApiStatusDashboardProps) {
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Initialize API statuses
  useEffect(() => {
    const initialStatuses: ApiStatus[] = [
      {
        name: 'Stormglass Tide API',
        status: tideApiStatus === 'success' ? 'online' : tideApiStatus === 'loading' ? 'degraded' : 'offline',
        latency: tideApiStatus === 'success' ? Math.random() * 500 + 200 : undefined,
        lastChecked: new Date(lastUpdated),
        message: tideApiStatus === 'success' ? 'ข้อมูลน้ำขึ้นลงพร้อมใช้งาน' :
                tideApiStatus === 'loading' ? 'กำลังโหลดข้อมูล...' : 'ไม่สามารถเชื่อมต่อได้'
      },
      {
        name: 'OpenWeatherMap API',
        status: weatherApiStatus === 'success' ? 'online' : weatherApiStatus === 'loading' ? 'degraded' : 'offline',
        latency: weatherApiStatus === 'success' ? Math.random() * 300 + 150 : undefined,
        lastChecked: new Date(),
        message: weatherApiStatus === 'success' ? 'ข้อมูลสภาพอากาศพร้อมใช้งาน' :
                weatherApiStatus === 'loading' ? 'กำลังโหลดข้อมูล...' : 'ไม่สามารถเชื่อมต่อได้'
      },
      {
        name: 'Harmonic Prediction',
        status: 'online',
        latency: 50,
        lastChecked: new Date(),
        message: 'ระบบคำนวณสำรองพร้อมใช้งาน'
      }
    ]
    setApiStatuses(initialStatuses)

    // Mock system health data
    setSystemHealth({
      cpu: Math.random() * 30 + 10,
      memory: Math.random() * 40 + 30,
      uptime: Date.now() - (Math.random() * 86400000), // Random uptime up to 24 hours
      responseTime: Math.random() * 100 + 50
    })
  }, [tideApiStatus, weatherApiStatus, lastUpdated])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API check
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Update last checked times
    setApiStatuses(prev => prev.map(api => ({
      ...api,
      lastChecked: new Date(),
      latency: api.status === 'online' ? Math.random() * 400 + 100 : undefined
    })))

    setIsRefreshing(false)
    onRefresh?.()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'maintenance':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'offline':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'maintenance':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const formatUptime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}ชั่วโมง ${minutes}นาที`
  }

  return (
    <div className="space-y-6" role="region" aria-labelledby="api-status-heading">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg" aria-hidden="true">
            <Server className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 id="api-status-heading" className="text-lg font-semibold text-gray-900 dark:text-white">
              สถานะระบบและ API
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ตรวจสอบการทำงานของระบบและการเชื่อมต่อ API
            </p>
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label={isRefreshing ? "กำลังรีเฟรชข้อมูลสถานะระบบ" : "รีเฟรชข้อมูลสถานะระบบ"}
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} aria-hidden="true" />
          รีเฟรช
        </Button>
      </div>

      {/* API Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-labelledby="api-list-heading">
        <h4 id="api-list-heading" className="sr-only">รายการสถานะ API</h4>
        {apiStatuses.map((api, index) => (
          <Card key={index} className="shadow-lg hover:shadow-xl transition-all duration-200" role="listitem">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {api.name.includes('Tide') && <Waves className="h-4 w-4 text-blue-500" aria-hidden="true" />}
                  {api.name.includes('Weather') && <Cloud className="h-4 w-4 text-green-500" aria-hidden="true" />}
                  {api.name.includes('Harmonic') && <Zap className="h-4 w-4 text-purple-500" aria-hidden="true" />}
                  {api.name}
                </span>
                {getStatusIcon(api.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(api.status)} aria-label={`สถานะ: ${api.status === 'online' ? 'ออนไลน์' : api.status === 'offline' ? 'ออฟไลน์' : api.status === 'degraded' ? 'ช้าช้า' : 'ปิดปรับปรุง'}`}>
                  {api.status === 'online' ? 'ออนไลน์' :
                   api.status === 'offline' ? 'ออฟไลน์' :
                   api.status === 'degraded' ? 'ช้าช้า' : 'ปิดปรับปรุง'}
                </Badge>
                {api.latency && (
                  <span className="text-xs text-gray-500" aria-label={`เวลาแฝง ${api.latency} มิลลิวินาที`}>
                    {api.latency.toFixed(0)}ms
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400" aria-live="polite">
                {api.message}
              </p>
              <p className="text-xs text-gray-500" aria-label={`อัปเดตล่าสุด ${api.lastChecked.toLocaleTimeString('th-TH')}`}>
                อัปเดตล่าสุด: {api.lastChecked.toLocaleTimeString('th-TH')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Health Card */}
      {systemHealth && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              สุขภาพระบบ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {systemHealth.cpu.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">CPU Usage</div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className={`bg-blue-600 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${systemHealth.cpu}%` }}
                  />
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {systemHealth.memory.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Memory</div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className={`bg-green-600 h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${systemHealth.memory}%` }}
                  />
                </div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {systemHealth.responseTime.toFixed(0)}ms
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Response Time</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {formatUptime(systemHealth.uptime)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Uptime</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Network Status */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            สถานะเครือข่าย
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wifi className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  เชื่อมต่ออินเทอร์เน็ต
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  การเชื่อมต่อเสถียร - พร้อมใช้งาน
                </div>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              ออนไลน์
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}