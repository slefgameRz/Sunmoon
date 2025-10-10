"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Radio,
  RadioIcon,
  AlertTriangle,
  Zap,
  Wifi,
  WifiOff,
  Send,
  Download,
  Upload,
  Settings,
  Activity,
  Shield,
  Phone,
  Satellite
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  createEmergencyPacket,
  dataToAnalogSignals,
  analogSignalsToData,
  compressTideData,
  compressWeatherData,
  compressLocationData,
  type AnalogSignal
} from '@/lib/data-compression'

interface CommunicationHubProps {
  tideData: any
  weatherData: any
  locationData: any
  emergencyAlert?: string | null
  onEmergencyBroadcast?: (packet: any) => void
  onEmergencyClear?: () => void
}

type CommunicationMode = 'digital' | 'analog' | 'hybrid'
type EmergencyLevel = 'low' | 'medium' | 'high' | 'critical'

export default function CommunicationHub({
  tideData,
  weatherData,
  locationData,
  emergencyAlert,
  onEmergencyBroadcast,
  onEmergencyClear
}: CommunicationHubProps) {
  const [communicationMode, setCommunicationMode] = useState<CommunicationMode>('digital')
  const [emergencyLevel, setEmergencyLevel] = useState<EmergencyLevel>('low')
  const [isTransmitting, setIsTransmitting] = useState(false)
  const [isReceiving, setIsReceiving] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'degraded'>('connected')
  const [lastTransmission, setLastTransmission] = useState<Date | null>(null)
  const [receivedData, setReceivedData] = useState<any>(null)
  const [systemStatus, setSystemStatus] = useState<'normal' | 'warning' | 'emergency'>('normal')

  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)

  // Initialize Web Audio API
  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.error('Web Audio API not supported:', error)
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Monitor system status based on tide and weather data
  useEffect(() => {
    if (!tideData || !weatherData) return

    const waterLevel = tideData.currentWaterLevel || 0
    const windSpeed = weatherData.wind?.speed || 0
    const tideStatus = tideData.tideStatus

    // Emergency detection logic
    if (waterLevel > 3.0 || windSpeed > 15 || tideStatus === 'น้ำเป็น' && waterLevel > 2.5) {
      setSystemStatus('emergency')
      setEmergencyLevel('critical')
    } else if (waterLevel > 2.0 || windSpeed > 10) {
      setSystemStatus('warning')
      setEmergencyLevel('high')
    } else if (waterLevel > 1.5 || windSpeed > 7) {
      setSystemStatus('warning')
      setEmergencyLevel('medium')
    } else {
      setSystemStatus('normal')
      setEmergencyLevel('low')
    }
  }, [tideData, weatherData])

  // Auto-trigger emergency broadcast when alert is received
  useEffect(() => {
    if (emergencyAlert && systemStatus !== 'emergency') {
      setSystemStatus('emergency')
      setEmergencyLevel('high')

      // Auto-broadcast emergency signal
      const emergencyType = emergencyAlert.includes('ลม') ? 'storm' : 'flood'
      const packet = createEmergencyPacket(tideData, weatherData, locationData, emergencyType)

      console.log('Auto emergency broadcast triggered:', packet)
      onEmergencyBroadcast?.(packet)
      setLastTransmission(new Date())

      // Clear alert after 30 seconds
      setTimeout(() => {
        onEmergencyClear?.()
      }, 30000)
    }
  }, [emergencyAlert, systemStatus, tideData, weatherData, locationData, onEmergencyBroadcast, onEmergencyClear])

  // Digital transmission
  const handleDigitalTransmission = async () => {
    setIsTransmitting(true)
    try {
      const emergencyType = emergencyLevel === 'critical' ? 'tsunami' :
                           emergencyLevel === 'high' ? 'storm' : 'flood'

      const packet = createEmergencyPacket(tideData, weatherData, locationData, emergencyType)

      // Simulate API call to emergency services
      console.log('Digital transmission:', packet)

      setLastTransmission(new Date())
      onEmergencyBroadcast?.(packet)

      // Show success feedback
      setTimeout(() => {
        alert('ส่งข้อมูลฉุกเฉินทางดิจิทัลสำเร็จ')
      }, 1000)

    } catch (error) {
      console.error('Digital transmission failed:', error)
      alert('ส่งข้อมูลล้มเหลว')
    } finally {
      setIsTransmitting(false)
    }
  }

  // Analog transmission using audio signals
  const handleAnalogTransmission = async () => {
    if (!audioContextRef.current) {
      alert('เบราว์เซอร์ไม่รองรับการส่งสัญญาณเสียง')
      return
    }

    setIsTransmitting(true)
    try {
      const compressedData = compressTideData(tideData)
      const signals = dataToAnalogSignals(compressedData)

      // Play analog signals through audio
      await playAnalogSignals(signals)

      setLastTransmission(new Date())

      // Show success feedback
      setTimeout(() => {
        alert('ส่งสัญญาณอะนาล็อกสำเร็จ')
      }, 1000)

    } catch (error) {
      console.error('Analog transmission failed:', error)
      alert('ส่งสัญญาณล้มเหลว')
    } finally {
      setIsTransmitting(false)
    }
  }

  // Play analog signals through Web Audio API
  const playAnalogSignals = async (signals: AnalogSignal[]): Promise<void> => {
    if (!audioContextRef.current) return

    for (const signal of signals) {
      await playSignal(signal)
      // Small pause between signals
      await new Promise(resolve => setTimeout(resolve, 50))
    }
  }

  const playSignal = (signal: AnalogSignal): Promise<void> => {
    return new Promise((resolve) => {
      if (!audioContextRef.current) {
        resolve()
        return
      }

      const oscillator = audioContextRef.current.createOscillator()
      const gainNode = audioContextRef.current.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContextRef.current.destination)

      oscillator.frequency.setValueAtTime(signal.frequency, audioContextRef.current.currentTime)
      gainNode.gain.setValueAtTime(signal.amplitude, audioContextRef.current.currentTime)

      oscillator.start()
      oscillator.stop(audioContextRef.current.currentTime + signal.duration)

      oscillator.onended = () => resolve()
    })
  }

  // Hybrid transmission (digital + analog backup)
  const handleHybridTransmission = async () => {
    await Promise.all([
      handleDigitalTransmission(),
      handleAnalogTransmission()
    ])
  }

  // Receive analog signals (simulated)
  const handleReceiveAnalog = () => {
    setIsReceiving(true)

    // Simulate receiving analog signals
    setTimeout(() => {
      // Mock received data
      const mockSignals: AnalogSignal[] = [
        { frequency: 1100, amplitude: 0.8, duration: 0.1, pattern: [1, 0, 1] },
        { frequency: 1200, amplitude: 0.6, duration: 0.1, pattern: [0, 1, 0] }
      ]

      try {
        const receivedJson = analogSignalsToData(mockSignals)
        const parsedData = JSON.parse(receivedJson)
        setReceivedData(parsedData)
      } catch (error) {
        console.error('Failed to decode analog signals:', error)
      }

      setIsReceiving(false)
    }, 3000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'disconnected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const getEmergencyColor = (level: EmergencyLevel) => {
    switch (level) {
      case 'critical':
        return 'bg-red-600 text-white'
      case 'high':
        return 'bg-orange-600 text-white'
      case 'medium':
        return 'bg-yellow-600 text-black'
      case 'low':
        return 'bg-green-600 text-white'
      default:
        return 'bg-gray-600 text-white'
    }
  }

  return (
    <div className="space-y-6" role="region" aria-labelledby="comm-hub-heading">
      {emergencyAlert && (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <strong>การแจ้งเตือนฉุกเฉิน:</strong> {emergencyAlert}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
            <Radio className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 id="comm-hub-heading" className="text-lg font-semibold text-gray-900 dark:text-white">
              ศูนย์กลางการสื่อสารฉุกเฉิน
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ระบบสื่อสารดิจิทัลและอะนาล็อกสำหรับสถานการณ์ฉุกเฉิน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={getEmergencyColor(emergencyLevel)}>
            <AlertTriangle className="h-3 w-3 mr-1" />
            {emergencyLevel === 'critical' ? 'วิกฤต' :
             emergencyLevel === 'high' ? 'สูง' :
             emergencyLevel === 'medium' ? 'ปานกลาง' : 'ต่ำ'}
          </Badge>
          <Badge className={getStatusColor(connectionStatus)}>
            {connectionStatus === 'connected' ? 'เชื่อมต่อ' :
             connectionStatus === 'disconnected' ? 'ไม่ได้เชื่อมต่อ' : 'เสื่อมโทรม'}
          </Badge>
        </div>
      </div>

      {/* System Status Alert */}
      {systemStatus !== 'normal' && (
        <Alert className={cn(
          "border-l-4",
          systemStatus === 'emergency' ? "border-red-500 bg-red-50 dark:bg-red-950/50" :
          "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/50"
        )}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {systemStatus === 'emergency'
              ? 'ตรวจพบสภาวะฉุกเฉิน! ระดับน้ำหรือความเร็วลมสูงผิดปกติ'
              : 'ตรวจพบสภาวะที่ต้องเฝ้าระวัง ระดับน้ำหรือความเร็วลมสูง'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Communication Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3">
            <Settings className="h-5 w-5" />
            โหมดการสื่อสาร
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={communicationMode === 'digital' ? 'default' : 'outline'}
              onClick={() => setCommunicationMode('digital')}
              className="flex flex-col items-center gap-2 p-6 h-auto"
            >
              <Wifi className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">ดิจิทัล</div>
                <div className="text-xs opacity-75">อินเทอร์เน็ต/API</div>
              </div>
            </Button>

            <Button
              variant={communicationMode === 'analog' ? 'default' : 'outline'}
              onClick={() => setCommunicationMode('analog')}
              className="flex flex-col items-center gap-2 p-6 h-auto"
            >
              <RadioIcon className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">อะนาล็อก</div>
                <div className="text-xs opacity-75">สัญญาณเสียง</div>
              </div>
            </Button>

            <Button
              variant={communicationMode === 'hybrid' ? 'default' : 'outline'}
              onClick={() => setCommunicationMode('hybrid')}
              className="flex flex-col items-center gap-2 p-6 h-auto"
            >
              <Shield className="h-8 w-8" />
              <div className="text-center">
                <div className="font-semibold">ไฮบริด</div>
                <div className="text-xs opacity-75">ทั้งสองระบบ</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transmission Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3">
            <Send className="h-5 w-5" />
            การส่งข้อมูลฉุกเฉิน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={
                communicationMode === 'digital' ? handleDigitalTransmission :
                communicationMode === 'analog' ? handleAnalogTransmission :
                handleHybridTransmission
              }
              disabled={isTransmitting}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isTransmitting ? (
                <Activity className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Send className="h-5 w-5 mr-2" />
              )}
              ส่งข้อมูลฉุกเฉิน ({communicationMode === 'digital' ? 'ดิจิทัล' :
                               communicationMode === 'analog' ? 'อะนาล็อก' : 'ไฮบริด'})
            </Button>

            <Button
              onClick={handleReceiveAnalog}
              disabled={isReceiving}
              variant="outline"
              size="lg"
            >
              {isReceiving ? (
                <Activity className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Download className="h-5 w-5 mr-2" />
              )}
              รับสัญญาณอะนาล็อก
            </Button>
          </div>

          {lastTransmission && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
              ส่งข้อมูลล่าสุด: {lastTransmission.toLocaleString('th-TH')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-3">
            <Phone className="h-5 w-5" />
            เบอร์ติดต่อฉุกเฉิน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/50 rounded-lg">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <Phone className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="font-semibold text-red-800 dark:text-red-200">กรมป้องกันและบรรเทาสาธารณภัย</div>
                <div className="text-sm text-red-600 dark:text-red-400">โทร 1784</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Satellite className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-blue-800 dark:text-blue-200">ศูนย์เตือนภัยพิบัติแห่งชาติ</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">โทร 1860</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Received Data Display */}
      {receivedData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-3">
              <Download className="h-5 w-5" />
              ข้อมูลที่ได้รับ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-auto max-h-40">
              {JSON.stringify(receivedData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}