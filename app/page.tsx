import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Moon, Sun, Cloud, Waves, ArrowUp, ArrowDown, AlertCircle, CalendarDays, Thermometer } from "lucide-react"
import { getTideData, type TideData } from "@/lib/tide-service" // Import the simulated tide service

// Define types for OpenWeatherMap API response (simplified)
type WeatherData = {
  main: {
    temp: number
    feels_like: number
    humidity: number
  }
  weather: Array<{
    description: string
    icon: string
  }>
  wind: {
    speed: number
  }
  name: string
}

// Function to fetch weather data from OpenWeatherMap
async function getWeatherData(lat: number, lon: number): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) {
    console.error("OPENWEATHER_API_KEY is not set.")
    return null
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=th`

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } }) // Revalidate every hour
    if (!response.ok) {
      console.error(`Error fetching weather: ${response.statusText}`)
      return null
    }
    const data: WeatherData = await response.json()
    return data
  } catch (error) {
    console.error("Failed to fetch weather data:", error)
    return null
  }
}

export default async function HomePage() {
  // Coordinates for Bangkok, Thailand (example location)
  const location = { lat: 13.7563, lon: 100.5018 }

  // Fetch data concurrently
  const [weatherData, tideData] = await Promise.all([getWeatherData(location.lat, location.lon), getTideData(location)])

  const currentDate = new Date()
  const formattedDate = currentDate.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const formattedTime = currentDate.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })

  // Default values if API calls fail
  const defaultTideData: TideData = {
    isWaxingMoon: true,
    tideStatus: "น้ำตาย",
    highTideTime: "N/A",
    lowTideTime: "N/A",
    isSeaLevelHighToday: false,
    currentWaterLevel: 0,
    waterLevelStatus: "ไม่ทราบ",
  }

  const defaultWeatherData: WeatherData = {
    main: { temp: 0, feels_like: 0, humidity: 0 },
    weather: [{ description: "ไม่ทราบ", icon: "01d" }],
    wind: { speed: 0 },
    name: "ไม่ทราบ",
  }

  const currentTideData = tideData || defaultTideData
  const currentWeatherData = weatherData || defaultWeatherData

  // Map OpenWeatherMap icon to Lucide icon (simplified)
  const getWeatherIcon = (iconCode: string) => {
    if (iconCode.includes("01")) return <Sun className="h-6 w-6 text-yellow-500" /> // Clear sky
    if (iconCode.includes("02") || iconCode.includes("03") || iconCode.includes("04"))
      return <Cloud className="h-6 w-6 text-gray-500" /> // Clouds
    if (iconCode.includes("09") || iconCode.includes("10")) return <Waves className="h-6 w-6 text-blue-500" /> // Rain
    if (iconCode.includes("11")) return <AlertCircle className="h-6 w-6 text-red-500" /> // Thunderstorm
    return <Sun className="h-6 w-6 text-gray-500" /> // Default
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4 md:p-8 lg:p-12">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 sm:text-5xl lg:text-6xl">ระบบพยากรณ์น้ำและสภาพอากาศ</h1>
        <p className="mt-2 text-lg text-gray-600">ข้อมูลน้ำขึ้นน้ำลง สภาพอากาศ และระดับน้ำสำหรับวันนี้</p>
      </header>

      <main className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Current Date & Time Card */}
        <Card className="col-span-full bg-white shadow-lg md:col-span-2 lg:col-span-1 xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarDays className="h-5 w-5 text-gray-600" />
              วันที่และเวลาปัจจุบัน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-gray-900">{formattedDate}</p>
            <p className="text-2xl text-gray-700">{formattedTime}</p>
          </CardContent>
        </Card>

        {/* Tide Prediction Card */}
        <Card className="col-span-full bg-white shadow-lg md:col-span-2 lg:col-span-2 xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Moon className="h-5 w-5 text-gray-600" />
              พยากรณ์น้ำขึ้นน้ำลง
            </CardTitle>
            <CardDescription>ข้อมูลข้างขึ้นข้างแรมและน้ำเป็นน้ำตาย</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">ข้างขึ้นข้างแรม:</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                {currentTideData.isWaxingMoon ? "ข้างขึ้น" : "ข้างแรม"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">น้ำเป็นน้ำตาย:</span>
              <Badge variant="outline" className="bg-green-100 text-green-800">
                {currentTideData.tideStatus}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-lg font-medium">น้ำขึ้นสูงสุด:</p>
                <p className="text-2xl font-semibold text-blue-700">{currentTideData.highTideTime}</p>
              </div>
              <div>
                <p className="text-lg font-medium">น้ำลงต่ำสุด:</p>
                <p className="text-2xl font-semibold text-red-700">{currentTideData.lowTideTime}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weather and Wave Alerts Card */}
        <Card className="col-span-full bg-white shadow-lg md:col-span-2 lg:col-span-1 xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              {getWeatherIcon(currentWeatherData.weather[0].icon)}
              สภาพอากาศและคลื่นลม
            </CardTitle>
            <CardDescription>ข้อมูลสภาพอากาศและคลื่นลมปัจจุบัน</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center gap-2">
              <Thermometer className="h-6 w-6 text-red-500" />
              <span className="text-lg font-medium">อุณหภูมิ:</span>
              <span className="text-lg">{currentWeatherData.main.temp}°C</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="h-6 w-6 text-gray-500" />
              <span className="text-lg font-medium">สภาพอากาศ:</span>
              <span className="text-lg">{currentWeatherData.weather[0].description}</span>
            </div>
            <div className="flex items-center gap-2">
              <Waves className="h-6 w-6 text-blue-500" />
              <span className="text-lg font-medium">ความเร็วลม:</span>
              <span className="text-lg">{currentWeatherData.wind.speed} m/s</span>
            </div>
            <div className="flex items-start gap-2 rounded-md bg-yellow-50 p-3 text-yellow-800">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                {/* Placeholder for actual wave condition alerts */}
                ไม่มีการแจ้งเตือนสภาพอากาศพิเศษ
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sea Level Rise Card */}
        <Card className="col-span-full bg-white shadow-lg md:col-span-1 lg:col-span-1 xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ArrowUp className="h-5 w-5 text-gray-600" />
              ระดับการหนุนของน้ำทะเล
            </CardTitle>
            <CardDescription>การคาดการณ์ระดับน้ำทะเลหนุนสำหรับวันนี้</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">วันนี้หนุนสูงมั้ย:</span>
              <Badge
                variant="outline"
                className={
                  currentTideData.isSeaLevelHighToday ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                }
              >
                {currentTideData.isSeaLevelHighToday ? "หนุนสูง" : "ปกติ"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Water Level Calculation Card */}
        <Card className="col-span-full bg-white shadow-lg md:col-span-1 lg:col-span-1 xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ArrowDown className="h-5 w-5 text-gray-600" />
              ระดับน้ำปัจจุบัน
            </CardTitle>
            <CardDescription>ระดับน้ำที่คำนวณจากปัจจัยต่างๆ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">ระดับน้ำ:</span>
              <span className="text-3xl font-bold text-purple-700">{currentTideData.currentWaterLevel} ม.</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-medium">สถานะ:</span>
              <Badge variant="outline" className="bg-purple-100 text-purple-800">
                {currentTideData.waterLevelStatus}
              </Badge>
            </div>
            <p className="mt-4 text-sm text-gray-500">{"*ระดับน้ำนี้เป็นการคำนวณเบื้องต้นจากวันที่ปัจจุบันและข้างขึ้นข้างแรม"}</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
