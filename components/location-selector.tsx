"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sun,
  Cloud,
  Waves,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  Thermometer,
  Loader2,
  MapPin,
  Droplets,
  Navigation,
  RefreshCw,
  Wind,
  Gauge,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getLocationForecast, type LocationData, type ForecastResult } from "@/actions/get-location-forecast"

// Predefined locations
const locations: LocationData[] = [
  { lat: 13.7563, lon: 100.5018, name: "กรุงเทพมหานคร" },
  { lat: 7.8804, lon: 98.3923, name: "ภูเก็ต" },
  { lat: 12.9236, lon: 100.8825, name: "พัทยา" },
  { lat: 18.7883, lon: 98.9873, name: "เชียงใหม่" },
]

// Default values if API calls fail
const defaultTideData = {
  isWaxingMoon: true,
  tideStatus: "ไม่ทราบ" as "น้ำเป็น" | "น้ำตาย",
  highTideTime: "N/A",
  lowTideTime: "N/A",
  isSeaLevelHighToday: false,
  currentWaterLevel: 0,
  waterLevelStatus: "ไม่ทราบ",
}

const defaultWeatherData = {
  main: { temp: 0, feels_like: 0, humidity: 0, pressure: 0 },
  weather: [{ description: "ไม่ทราบ", icon: "01d" }],
  wind: { speed: 0, deg: 0 },
  name: "ไม่ทราบ",
}

export default function LocationSelector() {
  const [selectedLocation, setSelectedLocation] = useState<LocationData>(() => {
    // Initialize from localStorage or default to Bangkok
    if (typeof window !== "undefined") {
      const savedLocation = localStorage.getItem("preferredLocation")
      if (savedLocation) {
        return JSON.parse(savedLocation)
      }
    }
    return locations[0] // Default to Bangkok
  })
  const [forecastData, setForecastData] = useState<ForecastResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)

  const fetchForecast = useCallback(async (location: LocationData) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getLocationForecast(location)
      setForecastData(result)
      if (result.error) {
        setError(result.error)
      }
    } catch (err) {
      console.error("Error fetching forecast:", err)
      setError("ไม่สามารถดึงข้อมูลพยากรณ์ได้")
    } finally {
      setLoading(false)
    }
  }, [])

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    setGettingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const currentLocation: LocationData = {
            lat: latitude,
            lon: longitude,
            name: "ตำแหน่งปัจจุบัน",
          }
          setSelectedLocation(currentLocation)
          localStorage.setItem("preferredLocation", JSON.stringify(currentLocation))
          setGettingLocation(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setError("ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง")
          setGettingLocation(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        },
      )
    } else {
      setError("เบราว์เซอร์ไม่รองรับการตรวจจับตำแหน่ง")
      setGettingLocation(false)
    }
  }, [])

  useEffect(() => {
    if (selectedLocation) {
      localStorage.setItem("preferredLocation", JSON.stringify(selectedLocation))
      fetchForecast(selectedLocation)
    }
  }, [selectedLocation, fetchForecast])

  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const formattedTime = currentDate.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })

  const currentTideData = forecastData?.tideData || defaultTideData
  const currentWeatherData = forecastData?.weatherData || defaultWeatherData

  // Map OpenWeatherMap icon to Lucide icon (simplified)
  const getWeatherIcon = (iconCode: string) => {
    if (iconCode.includes("01")) return <Sun className="h-8 w-8 text-amber-500" />
    if (iconCode.includes("02") || iconCode.includes("03") || iconCode.includes("04"))
      return <Cloud className="h-8 w-8 text-slate-500" />
    if (iconCode.includes("09") || iconCode.includes("10")) return <Waves className="h-8 w-8 text-blue-500" />
    if (iconCode.includes("11")) return <AlertCircle className="h-8 w-8 text-red-500" />
    return <Sun className="h-8 w-8 text-amber-500" />
  }

  // Simple status indicators
  const getSimpleWeatherStatus = () => {
    const temp = currentWeatherData.main.temp
    if (temp > 35) return { status: "ร้อนมาก", color: "text-red-600", bg: "bg-red-50" }
    if (temp > 30) return { status: "ร้อน", color: "text-orange-600", bg: "bg-orange-50" }
    if (temp > 25) return { status: "อบอุ่น", color: "text-yellow-600", bg: "bg-yellow-50" }
    if (temp > 20) return { status: "เย็นสบาย", color: "text-green-600", bg: "bg-green-50" }
    return { status: "เย็น", color: "text-blue-600", bg: "bg-blue-50" }
  }

  const getTideSimpleStatus = () => {
    if (currentTideData.tideStatus === "น้ำเป็น") {
      return { status: "น้ำขึ้นลงมาก", color: "text-blue-600", bg: "bg-blue-50" }
    }
    return { status: "น้ำขึ้นลงน้อย", color: "text-purple-600", bg: "bg-purple-50" }
  }

  const weatherStatus = getSimpleWeatherStatus()
  const tideStatus = getTideSimpleStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Simple Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">🌊 พยากรณ์น้ำและอากาศ</h1>
            <p className="text-blue-100 text-lg">ข้อมูลครบครันเกี่ยวกับน้ำขึ้นน้ำลง สภาพอากาศ และระดับน้ำทะเล</p>
          </div>

          {/* Location Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <Button
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              {gettingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              ใช้ตำแหน่งปัจจุบัน
            </Button>

            <div className="flex items-center gap-2">
              <span className="text-blue-100">หรือเลือก:</span>
              <Select
                onValueChange={(value) => {
                  const loc = locations.find((l) => l.name === value)
                  if (loc) setSelectedLocation(loc)
                }}
                value={selectedLocation.name === "ตำแหน่งปัจจุบัน" ? "" : selectedLocation.name}
              >
                <SelectTrigger className="w-[180px] bg-white/20 border-white/30 text-white">
                  <SelectValue placeholder="เลือกจังหวัด" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.name} value={loc.name}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Current Location Display */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">{selectedLocation.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Consolidated Summary */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-lg">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <span className="text-lg text-slate-600">กำลังโหลดข้อมูล...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-2xl border border-red-200">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <span className="text-lg text-red-600 font-medium text-center">{error}</span>
            <Button onClick={() => fetchForecast(selectedLocation)} className="mt-4" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              ลองใหม่
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Card - Main Overview */}
            <Card className="bg-white shadow-xl border-2 border-blue-200 rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <AlertCircle className="h-8 w-8" />
                  สรุปข้อมูลวันนี้
                </CardTitle>
                <CardDescription className="text-blue-100 text-base">ภาพรวมสถานการณ์น้ำและสภาพอากาศที่สำคัญ</CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">วันที่และเวลา:</span>
                  <span className="font-semibold text-slate-900">
                    {formattedDate} {formattedTime}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">สภาพอากาศ:</span>
                  <span className="font-semibold text-slate-900">
                    {currentWeatherData.weather[0].description} ({currentWeatherData.main.temp}°C)
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">น้ำขึ้นน้ำลง:</span>
                  <span className="font-semibold text-slate-900">
                    {currentTideData.tideStatus} ({currentTideData.isWaxingMoon ? "ข้างขึ้น" : "ข้างแรม"})
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">ระดับน้ำทะเลหนุน:</span>
                  <Badge
                    className={cn(
                      "text-sm px-3 py-1 font-bold",
                      currentTideData.isSeaLevelHighToday ? "bg-red-500 text-white" : "bg-green-500 text-white",
                    )}
                  >
                    {currentTideData.isSeaLevelHighToday ? "หนุนสูง" : "ปกติ"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">ระดับน้ำปัจจุบัน:</span>
                  <span className="text-xl font-bold text-purple-700">{currentTideData.currentWaterLevel} ม.</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="font-medium text-slate-700">สถานะระดับน้ำ:</span>
                  <Badge className="bg-purple-500 text-white font-semibold">{currentTideData.waterLevelStatus}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Weather Details */}
              <Card className="bg-white shadow-lg border-0 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold text-slate-800">สภาพอากาศ</CardTitle>
                  {getWeatherIcon(currentWeatherData.weather[0].icon)}
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-4xl font-bold text-slate-900">{currentWeatherData.main.temp}°C</div>
                  <p className="text-sm text-slate-600">{currentWeatherData.weather[0].description}</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Thermometer className="h-4 w-4" />
                      <span>รู้สึกเหมือน: {currentWeatherData.main.feels_like}°C</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Droplets className="h-4 w-4" />
                      <span>ความชื้น: {currentWeatherData.main.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Wind className="h-4 w-4" />
                      <span>ความเร็วลม: {currentWeatherData.wind.speed} m/s</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Gauge className="h-4 w-4" />
                      <span>ความกดอากาศ: {currentWeatherData.main.pressure} hPa</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tide Times Card */}
              <Card className="bg-white shadow-lg border-0 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold text-slate-800">เวลาน้ำขึ้นลง</CardTitle>
                  <Waves className="h-6 w-6 text-blue-600" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-5 w-5 text-blue-600" />
                        <span className="text-slate-700 font-medium">น้ำขึ้นสูงสุด</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-700">{currentTideData.highTideTime}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="h-5 w-5 text-red-600" />
                        <span className="text-slate-700 font-medium">น้ำลงต่ำสุด</span>
                      </div>
                      <span className="text-2xl font-bold text-red-700">{currentTideData.lowTideTime}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-slate-700 font-medium">ข้างขึ้นข้างแรม:</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      {currentTideData.isWaxingMoon ? "ข้างขึ้น" : "ข้างแรม"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-slate-700 font-medium">น้ำเป็นน้ำตาย:</span>
                    <Badge
                      variant="outline"
                      className={
                        currentTideData.tideStatus === "น้ำเป็น"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : "bg-purple-100 text-purple-800 border-purple-300"
                      }
                    >
                      {currentTideData.tideStatus}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Sea Level Rise Status Card */}
              <Card className="bg-white shadow-lg border-0 rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold text-slate-800">ระดับน้ำทะเลหนุน</CardTitle>
                  <ArrowUp className="h-6 w-6 text-green-600" />
                </CardHeader>
                <CardContent className="pt-4 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
                    <Droplets className="h-10 w-10 text-emerald-600" />
                  </div>
                  <p className="text-4xl font-bold text-emerald-600 mb-2">{currentTideData.currentWaterLevel} ม.</p>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                    {currentTideData.waterLevelStatus}
                  </Badge>
                  <div className="mt-4 flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700">วันนี้หนุนสูงมั้ย:</span>
                    <Badge
                      className={
                        currentTideData.isSeaLevelHighToday
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-green-500 text-white hover:bg-green-600"
                      }
                    >
                      {currentTideData.isSeaLevelHighToday ? "หนุนสูงมาก" : "ระดับปกติ"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Simple Alert Card */}
            <Card className="bg-yellow-50 border border-yellow-200 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-yellow-800 mb-1">การแจ้งเตือน</h3>
                    <p className="text-yellow-700">ไม่มีการแจ้งเตือนสภาพอากาศพิเศษในขณะนี้</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
