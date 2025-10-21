"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Map as PigeonMap, Marker } from "pigeon-maps"
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
  CalendarIcon,
  Moon,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getLocationForecast, type ForecastResult } from "@/actions/get-location-forecast"
import { type LocationData } from "@/lib/tide-service"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { th } from "date-fns/locale" // Import Thai locale for date-fns
import { useTheme } from "next-themes" // Import useTheme hook
// Map selector UI temporarily disabled to focus on UI bug fixes
import TideAnimationNew from "./tide-animation-new" // Import the new TideAnimation component

// Default values if API calls fail
const defaultTideData = {
  isWaxingMoon: true,
  lunarPhaseKham: 0,
  tideStatus: "ไม่ทราบ" as "น้ำเป็น" | "น้ำตาย",
  highTideTime: "N/A", // Will be dynamically set from tideEvents
  lowTideTime: "N/A", // Will be dynamically set from tideEvents
  isSeaLevelHighToday: false,
  currentWaterLevel: 0,
  waterLevelStatus: "ไม่ทราบ",
  waterLevelReference: "ไม่ทราบแหล่งอ้างอิง",
  seaLevelRiseReference: "ไม่ทราบแหล่งอ้างอิง",
  pierDistance: 0,
  pierReference: "ไม่ทราบแหล่งอ้างอิง",
  tideEvents: [], // Initialize as empty array
  timeRangePredictions: [],
  graphData: [],
  apiStatus: "error" as const,
  apiStatusMessage: "ไม่มีข้อมูล",
  lastUpdated: new Date().toISOString(),
}

const defaultWeatherData = {
  main: { temp: 0, feels_like: 0, humidity: 0, pressure: 0 },
  weather: [{ description: "ไม่ทราบ", icon: "01d" }],
  wind: { speed: 0, deg: 0 },
  name: "ไม่ทราบ",
}

export default function LocationSelector() {
  // Initialize with static values to prevent hydration mismatch
  const [selectedLocation, setSelectedLocation] = useState<LocationData>({ 
    lat: 13.7563, 
    lon: 100.5018, 
    name: "กรุงเทพมหานคร" 
  })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedHour, setSelectedHour] = useState<string>("12")
  const [selectedMinute, setSelectedMinute] = useState<string>("00")
  const [isHydrated, setIsHydrated] = useState(false) // Track hydration state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false) // State to control calendar popover
  // Map selection modal is temporarily disabled

  // Popular Thai coastal locations for quick selection
  const popularCoastalLocations: LocationData[] = [
    { lat: 13.7563, lon: 100.5018, name: "กรุงเทพมหานคร (อ่าวไทย)" },
    { lat: 7.8804, lon: 98.3923, name: "ภูเก็ต (ทะเลอันดามัน)" },
    { lat: 9.1378, lon: 99.3328, name: "เกาะสมุย (อ่าวไทย)" },
    { lat: 12.9236, lon: 100.8783, name: "พัทยา (ชลบุรี)" },
    { lat: 11.2567, lon: 99.9534, name: "หัวหิน (ประจุวบคีรีขันธ์)" },
    { lat: 8.4304, lon: 99.9588, name: "กระบี่" },
    { lat: 9.9673, lon: 99.0515, name: "เกาะช้าง (ตราด)" },
    { lat: 13.3611, lon: 100.9847, name: "บางแสน (ชลบุรี)" },
    { lat: 10.7627, lon: 99.7564, name: "เกาะเต่า" },
    { lat: 8.1080, lon: 98.2914, name: "เกาะพีพี" },
    { lat: 6.5442, lon: 99.6125, name: "สตูล (ทะเลอันดามัน)" },
    { lat: 7.5407, lon: 99.5129, name: "ตรัง (ทะเลอันดามัน)" },
    { lat: 13.2721, lon: 100.9252, name: "ศรีราชา (ชลบุรี)" },
    { lat: 12.6802, lon: 101.2024, name: "เกาะสีชัง (ชลบุรี)" },
    { lat: 10.0983, lon: 99.8180, name: "เกาะพงัน" }
  ]
  const [forecastData, setForecastData] = useState<ForecastResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const { theme, setTheme } = useTheme() // Hook for theme management

  // Safe localStorage operations
  const saveLocationToStorage = useCallback((location: LocationData) => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem("preferredLocation", JSON.stringify(location))
    }
  }, [isHydrated])

  // Handle hydration and localStorage after component mounts
  useEffect(() => {
    setIsHydrated(true)
    if (typeof window !== 'undefined') {
      // Set current date and time after hydration
      const now = new Date()
      setSelectedDate(now)
      setSelectedHour(String(now.getHours()).padStart(2, "0"))
      setSelectedMinute(String(Math.floor(now.getMinutes() / 15) * 15).padStart(2, "0"))
      // Load saved location from localStorage
      const savedLocation = localStorage.getItem("preferredLocation")
      if (savedLocation) {
        try {
          const parsedLocation = JSON.parse(savedLocation)
          setSelectedLocation(parsedLocation)
        } catch (error) {
          console.error("Error parsing saved location:", error)
        }
      }
    }
  }, [])

  const fetchForecast = useCallback(async (location: LocationData, date: Date, hour: string, minute: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getLocationForecast(location, date, {
        hour: Number.parseInt(hour),
        minute: Number.parseInt(minute),
      })
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
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const currentLocation: LocationData = {
            lat: latitude,
            lon: longitude,
            name: "ตำแหน่งปัจจุบัน",
          }
          setSelectedLocation(currentLocation)
          saveLocationToStorage(currentLocation)
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
    if (selectedLocation && selectedDate && isHydrated) {
      saveLocationToStorage(selectedLocation)
      fetchForecast(selectedLocation, selectedDate, selectedHour, selectedMinute)
    }
  }, [selectedLocation, selectedDate, selectedHour, selectedMinute, fetchForecast, isHydrated, saveLocationToStorage])

  const formattedDate = selectedDate ? format(selectedDate, "EEEE, d MMMM yyyy", { locale: th }) : "เลือกวันที่"
  const formattedTime = `${selectedHour}:${selectedMinute} น.`

  const currentTideData = forecastData?.tideData || defaultTideData
  const currentWeatherData = forecastData?.weatherData || defaultWeatherData

  // Calculate tide range (max high - min low)
  const tideLevels = currentTideData.tideEvents.map((event) => event.level)
  const maxTideLevel = tideLevels.length > 0 ? Math.max(...tideLevels) : 0
  const minTideLevel = tideLevels.length > 0 ? Math.min(...tideLevels) : 0
  const tideRange = Number.parseFloat((maxTideLevel - minTideLevel).toFixed(2))

  // Find the first high and low tide events for display in the main card
  const firstHighTide = currentTideData.tideEvents.find((event) => event.type === "high")
  const firstLowTide = currentTideData.tideEvents.find((event) => event.type === "low")

  // Map OpenWeatherMap icon to Lucide icon (simplified)
  const getWeatherIcon = (iconCode: string) => {
    if (iconCode.includes("01")) return <Sun className="h-8 w-8 text-amber-500" />
    if (iconCode.includes("02") || iconCode.includes("03") || iconCode.includes("04"))
      return <Cloud className="h-8 w-8 text-slate-500" />
    if (iconCode.includes("09") || iconCode.includes("10")) return <Waves className="h-8 w-8 text-blue-500" />
    if (iconCode.includes("11")) return <AlertCircle className="h-8 w-8 text-red-500" />
    return <Sun className="h-8 w-8 text-amber-500" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-950">
      {/* Simple Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 md:p-6 lg:p-8 dark:from-gray-800 dark:to-gray-900">
        <div className="container mx-auto flex flex-col items-center justify-center">
          <div className="text-center mb-6">
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">🌊 SEAPALO</h1>
            <p className="text-blue-100 text-lg dark:text-gray-300">{"ระบบวิเคราะห์ระดับน้ำอัจฉริยะ"}</p>
          </div>

          {/* Quick Location Selector */}
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="rounded-md overflow-hidden shadow-md w-24 h-24 bg-white/80 flex items-center justify-center">
              <div className="text-center px-2">
                <MapPin className="mx-auto h-6 w-6 text-blue-600" />
                <span className="text-xs block mt-1 text-gray-700 dark:text-gray-300">{isHydrated ? selectedLocation.name.split(' ')[0] : 'ตำแหน่ง'}</span>
              </div>
            </div>

            <div>
              <Select
                onValueChange={(value) => {
                  const location = popularCoastalLocations.find(loc => loc.name === value)
                  if (location) {
                    setSelectedLocation(location)
                    saveLocationToStorage(location)
                  }
                }}
                value={isHydrated ? selectedLocation.name : popularCoastalLocations[0].name}
              >
                <SelectTrigger className="w-[300px] bg-white/20 border-white/30 text-white dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600">
                  <SelectValue placeholder="เลือกตำแหน่งด่วน" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-white">
                  {popularCoastalLocations.map((location) => (
                    <SelectItem key={location.name} value={location.name}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="mt-2 grid grid-cols-3 gap-2">
                {popularCoastalLocations.slice(0,6).map((loc) => (
                  <Button key={loc.name} size="sm" variant="ghost" onClick={() => { setSelectedLocation(loc); saveLocationToStorage(loc) }}>
                    {loc.name.split(' ')[0]}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Location and Date/Time Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <Button
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600"
            >
              {gettingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Navigation className="h-4 w-4 mr-2" />
              )}
              ใช้ตำแหน่งปัจจุบัน
            </Button>

            {/* Map selection temporarily disabled to stabilize the UI */}
            <div className="w-[180px] text-left text-sm text-white/90 p-2 bg-transparent border border-white/10 rounded-md flex items-center gap-2">
              <MapPin className="mr-2 h-4 w-4" />
              <span>เลือกจากแผนที่ (ปิดใช้งาน)</span>
            </div>

            {/* Date Picker */}
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal bg-white/20 border-white/30 text-white dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 dark:bg-gray-800 dark:text-white">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date)
                    setIsCalendarOpen(false) // Close calendar after selection
                  }}
                  initialFocus
                  locale={th} // Set locale for the calendar
                />
              </PopoverContent>
            </Popover>

            {/* Time Picker */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-100 dark:text-gray-300" />
              <Select onValueChange={setSelectedHour} value={selectedHour}>
                <SelectTrigger className="w-[80px] bg-white/20 border-white/30 text-white dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600">
                  <SelectValue placeholder="ชั่วโมง">{selectedHour}</SelectValue>
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-white">
                  {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((hour) => (
                    <SelectItem key={hour} value={hour}>
                      {hour}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-blue-100 dark:text-gray-300">:</span>
              <Select onValueChange={setSelectedMinute} value={selectedMinute}>
                <SelectTrigger className="w-[80px] bg-white/20 border-white/30 text-white dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600">
                  <SelectValue placeholder="นาที">{selectedMinute}</SelectValue>
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:text-white">
                  {["00", "15", "30", "45"].map((minute) => (
                    <SelectItem key={minute} value={minute}>
                      {minute}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Current Location Display */}
          <div className="text-center flex items-center justify-center gap-4">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 dark:bg-gray-700/50">
              <MapPin className="h-4 w-4" />
              <span className="font-medium">
                {isHydrated ? selectedLocation.name : "กรุงเทพมหานคร"}
              </span>
            </div>
            {/* Theme Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-white hover:bg-white/20 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Consolidated Summary */}
      <div className="container mx-auto px-4 py-8">
        {/* Simple Alert Card - Moved to top */}
        <Card className="bg-yellow-50 border border-yellow-200 shadow-lg rounded-2xl mb-6 dark:bg-yellow-950 dark:border-yellow-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1 dark:text-yellow-400" />
              <div>
                <h3 className="font-bold text-yellow-800 mb-1 dark:text-yellow-300">การแจ้งเตือน</h3>
                <p className="text-yellow-700 dark:text-yellow-400">ไม่มีการแจ้งเตือนสภาพอากาศพิเศษในขณะนี้</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-lg dark:bg-gray-800">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4 dark:text-blue-400" />
            <span className="text-lg text-slate-600 dark:text-gray-300">กำลังโหลดข้อมูล...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-2xl border border-red-200 dark:bg-red-950 dark:border-red-800">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4 dark:text-red-400" />
            <span className="text-lg text-red-600 font-medium text-center dark:text-red-300">{error}</span>
            <Button
              onClick={() =>
                selectedDate && fetchForecast(selectedLocation, selectedDate, selectedHour, selectedMinute)
              }
              className="mt-4 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              ลองใหม่
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Card - Main Overview */}
            <Card className="bg-white shadow-xl border-2 border-blue-200 rounded-3xl overflow-hidden dark:bg-gray-800 dark:border-gray-700">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 dark:from-gray-700 dark:to-gray-800">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <AlertCircle className="h-8 w-8" />
                  สรุปข้อมูลวันนี้
                </CardTitle>
                <CardDescription className="text-blue-100 text-base dark:text-gray-300">
                  ภาพรวมสถานการณ์น้ำและสภาพอากาศที่สำคัญ
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg dark:bg-gray-700">
                  <span className="font-medium text-slate-700 dark:text-gray-300">วันที่และเวลา:</span>
                  <span className="font-semibold text-slate-900 dark:text-gray-100">
                    {formattedDate} {formattedTime}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg dark:bg-gray-700">
                  <span className="font-medium text-slate-700 dark:text-gray-300">สภาพอากาศ:</span>
                  <span className="font-semibold text-slate-900 dark:text-gray-100">
                    {currentWeatherData.weather[0].description} ({currentWeatherData.main.temp}°C)
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg dark:bg-gray-700">
                  <span className="font-medium text-slate-700 dark:text-gray-300">น้ำขึ้นน้ำลง:</span>
                  <span className="font-semibold text-slate-900 dark:text-gray-100">
                    {currentTideData.tideStatus} ({currentTideData.isWaxingMoon ? "ข้างขึ้น" : "ข้างแรม"}{" "}
                    {currentTideData.lunarPhaseKham} ค่ำ)
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg dark:bg-gray-700">
                  <span className="font-medium text-slate-700 dark:text-gray-300">ระดับน้ำทะเลหนุน:</span>
                  <Badge
                    className={cn(
                      "text-sm px-3 py-1 font-bold",
                      currentTideData.isSeaLevelHighToday ? "bg-red-500 text-white" : "bg-green-500 text-white",
                    )}
                  >
                    {currentTideData.isSeaLevelHighToday ? "หนุนสูง" : "ปกติ"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg dark:bg-gray-700">
                  <span className="font-medium text-slate-700 dark:text-gray-300">ระดับน้ำปัจจุบัน:</span>
                  <span className="text-xl font-bold text-purple-700 dark:text-purple-400">
                    {currentTideData.currentWaterLevel} ม.
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg dark:bg-gray-700">
                  <span className="font-medium text-slate-700 dark:text-gray-300">สถานะระดับน้ำ:</span>
                  <Badge className="bg-purple-500 text-white font-semibold dark:bg-purple-700">
                    {currentTideData.waterLevelStatus}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Tide Animation Infographic */}
            <Card className="bg-white shadow-lg border-0 rounded-2xl dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-gray-200">
                  กราฟิกระดับน้ำขึ้นน้ำลง
                </CardTitle>
                <CardDescription className="text-sm text-slate-600 dark:text-gray-400">
                  แสดงระดับน้ำปัจจุบันและจุดน้ำขึ้นน้ำลงสูงสุด/ต่ำสุด
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <TideAnimationNew
                  tideData={currentTideData}
                />
              </CardContent>
            </Card>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Weather Details */}
              <Card className="bg-white shadow-lg border-0 rounded-2xl dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold text-slate-800 dark:text-gray-200">สภาพอากาศ</CardTitle>
                  {getWeatherIcon(currentWeatherData.weather[0].icon)}
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-4xl font-bold text-slate-900 dark:text-gray-100">
                    {currentWeatherData.main.temp}°C
                  </div>
                  <p className="text-sm text-slate-600 dark:text-gray-300">
                    {currentWeatherData.weather[0].description}
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                      <Thermometer className="h-4 w-4" />
                      <span>รู้สึกเหมือน: {currentWeatherData.main.feels_like}°C</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                      <Droplets className="h-4 w-4" />
                      <span>ความชื้น: {currentWeatherData.main.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                      <Wind className="h-4 w-4" />
                      <span>ความเร็วลม: {currentWeatherData.wind.speed} m/s</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300">
                      <Gauge className="h-4 w-4" />
                      <span>ความกดอากาศ: {currentWeatherData.main.pressure} hPa</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tide Times Card */}
              <Card className="bg-white shadow-lg border-0 rounded-2xl dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold text-slate-800 dark:text-gray-200">เวลาน้ำขึ้นลง</CardTitle>
                  <Waves className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg dark:bg-blue-950">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-slate-700 font-medium dark:text-gray-300">น้ำขึ้นสูงสุด</span>
                      </div>
                      <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        {firstHighTide ? `${firstHighTide.time} น. (${firstHighTide.level.toFixed(2)} ม.)` : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg dark:bg-red-950">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <span className="text-slate-700 font-medium dark:text-gray-300">น้ำลงต่ำสุด</span>
                      </div>
                      <span className="text-2xl font-bold text-red-700 dark:text-red-300">
                        {firstLowTide ? `${firstLowTide.time} น. (${firstLowTide.level.toFixed(2)} ม.)` : "N/A"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-slate-700 font-medium dark:text-gray-300">ข้างขึ้นข้างแรม:</span>
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700"
                    >
                      {currentTideData.isWaxingMoon ? "ข้างขึ้น" : "ข้างแรม"} {currentTideData.lunarPhaseKham} ค่ำ
                    </Badge>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-slate-700 font-medium dark:text-gray-300">น้ำเป็นน้ำตาย:</span>
                    <Badge
                      variant="outline"
                      className={
                        currentTideData.tideStatus === "น้ำเป็น"
                          ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700"
                          : "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700"
                      }
                    >
                      {currentTideData.tideStatus}
                    </Badge>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="font-medium text-slate-700 dark:text-gray-300">ระยะการขึ้นลงของน้ำ:</span>
                    <span className="font-semibold text-slate-900 dark:text-gray-100">{tideRange.toFixed(2)} ม.</span>
                  </div>
                </CardContent>
              </Card>

              {/* Sea Level Rise Status Card (Adjusted content to be more generic) */}
              <Card className="bg-white shadow-lg border-0 rounded-2xl dark:bg-gray-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold text-slate-800 dark:text-gray-200">
                    ข้อมูลอ้างอิงและสถานะ
                  </CardTitle>
                  <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </CardHeader>
                <CardContent className="pt-4 text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4 dark:bg-yellow-950">
                    <Droplets className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-600 mb-2 dark:text-yellow-400">
                    {currentTideData.waterLevelStatus}
                  </p>
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800">
                    ระดับน้ำอิงจากเวลาที่เลือก
                  </Badge>
                  <div className="mt-4 flex justify-between items-center p-3 bg-slate-50 rounded-lg dark:bg-gray-700">
                    <span className="font-medium text-slate-700 dark:text-gray-300">วันนี้หนุนสูงมั้ย:</span>
                    <Badge
                      className={
                        currentTideData.isSeaLevelHighToday
                          ? "bg-red-500 text-white hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600"
                          : "bg-green-500 text-white hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-600"
                      }
                    >
                      {currentTideData.isSeaLevelHighToday ? "หนุนสูงมาก" : "ระดับปกติ"}
                    </Badge>
                  </div>
                  <div className="mt-2 flex justify-between items-center p-3 bg-slate-50 rounded-lg dark:bg-gray-700">
                    <span className="font-medium text-slate-700 dark:text-gray-300">ระยะห่างจากท่าเรือ:</span>
                    <span className="font-semibold text-slate-900 dark:text-gray-100">
                      {currentTideData.pierDistance} ม.
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 dark:text-gray-400">
                    อ้างอิง: {currentTideData.seaLevelRiseReference}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 dark:text-gray-400">
                    ระดับน้ำอ้างอิง: {currentTideData.waterLevelReference}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 dark:text-gray-400">
                    ระยะห่างท่าเรืออ้างอิง: {currentTideData.pierReference}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Significant Advance Forecast Section */}
            <Card className="bg-white shadow-lg border-0 rounded-2xl dark:bg-gray-800">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-gray-200">
                  พยากรณ์น้ำขึ้นน้ำลงสำคัญประจำวัน
                </CardTitle>
                <Waves className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </CardHeader>
              <CardContent className="pt-4">
                {currentTideData.tideEvents.length > 0 ? (
                  <div className="space-y-3">
                    {currentTideData.tideEvents.map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg dark:bg-gray-700"
                      >
                        <div className="flex items-center gap-2">
                          {event.type === "high" ? (
                            <ArrowUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                          <span className="font-medium text-slate-700 dark:text-gray-300">
                            {event.type === "high" ? "น้ำขึ้นสูงสุด" : "น้ำลงต่ำสุด"}
                          </span>
                        </div>
                        <span className="text-lg font-bold text-slate-900 dark:text-gray-100">
                          {event.time} ({event.level.toFixed(2)} ม.)
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-gray-300">ไม่มีข้อมูลพยากรณ์น้ำขึ้นน้ำลงสำคัญสำหรับวันนี้</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
