import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Moon,
  Sun,
  Cloud,
  Waves,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CalendarDays,
  Thermometer,
  ChevronDown,
} from "lucide-react"
import { getTideData, type TideData } from "@/lib/tide-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { cn } from "@/lib/utils" // Import cn for conditional class names

// Define types for OpenWeatherMap API response (simplified)
type WeatherData = {
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number // Added for detailed view
  }
  weather: Array<{
    description: string
    icon: string
  }>
  wind: {
    speed: number
    deg: number // Added for detailed view
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
    main: { temp: 0, feels_like: 0, humidity: 0, pressure: 0 },
    weather: [{ description: "ไม่ทราบ", icon: "01d" }],
    wind: { speed: 0, deg: 0 },
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

  // Placeholder for weather alert
  const weatherAlert = "ไม่มีการแจ้งเตือนสภาพอากาศพิเศษ"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-4 md:p-8 lg:p-12">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-extrabold text-gray-800 sm:text-6xl lg:text-7xl font-serif">
          พยากรณ์น้ำและสภาพอากาศ
        </h1>
        <p className="mt-3 text-xl text-gray-600">ข้อมูลสำคัญเกี่ยวกับน้ำขึ้นน้ำลง สภาพอากาศ และระดับน้ำ</p>
      </header>

      <main className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Summary Card - New Section */}
        <Card className="col-span-full bg-white shadow-xl border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold text-blue-700">
              <AlertCircle className="h-6 w-6 text-blue-600" />
              สรุปข้อมูลวันนี้ (สำหรับผู้ใช้ทั่วไป)
            </CardTitle>
            <CardDescription>ภาพรวมสถานการณ์น้ำและสภาพอากาศที่สำคัญ</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 text-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">วันที่และเวลา:</span>
              <span className="font-semibold text-gray-800">
                {formattedDate} {formattedTime}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">สภาพอากาศ:</span>
              <span className="font-semibold text-gray-800">
                {currentWeatherData.weather[0].description} ({currentWeatherData.main.temp}°C)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">น้ำขึ้นน้ำลง:</span>
              <span className="font-semibold text-gray-800">
                {currentTideData.tideStatus} ({currentTideData.isWaxingMoon ? "ข้างขึ้น" : "ข้างแรม"})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">ระดับน้ำทะเลหนุน:</span>
              <Badge
                className={cn(
                  "text-lg px-3 py-1 font-bold",
                  currentTideData.isSeaLevelHighToday ? "bg-red-500 text-white" : "bg-green-500 text-white",
                )}
              >
                {currentTideData.isSeaLevelHighToday ? "หนุนสูง" : "ปกติ"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">ระดับน้ำปัจจุบัน:</span>
              <span className="text-2xl font-bold text-purple-700">{currentTideData.currentWaterLevel} ม.</span>
            </div>
          </CardContent>
        </Card>

        {/* Current Date & Time Card (Simplified as summary covers most) */}
        <Card className="col-span-full bg-white shadow-lg md:col-span-2 lg:col-span-1 xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarDays className="h-5 w-5 text-gray-600" />
              วันที่และเวลา
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-gray-900">{formattedDate}</p>
            <p className="text-2xl text-gray-700 mt-1">{formattedTime}</p>
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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={
                        currentTideData.tideStatus === "น้ำเป็น"
                          ? "bg-blue-100 text-blue-800 text-base px-3 py-1"
                          : "bg-purple-100 text-purple-800 text-base px-3 py-1"
                      }
                    >
                      {currentTideData.tideStatus}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {currentTideData.tideStatus === "น้ำเป็น"
                      ? "น้ำเป็น: น้ำขึ้น-น้ำลงต่างกันมาก (ช่วงข้างขึ้น/ข้างแรม)"
                      : "น้ำตาย: น้ำขึ้น-น้ำลงต่างกันน้อย (ช่วงข้างขึ้นน้อย/ข้างแรมมาก)"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-lg font-medium">น้ำขึ้นสูงสุด:</p>
                <p className="text-3xl font-bold text-blue-700">{currentTideData.highTideTime}</p>
              </div>
              <div>
                <p className="text-lg font-medium">น้ำลงต่ำสุด:</p>
                <p className="text-3xl font-bold text-red-700">{currentTideData.lowTideTime}</p>
              </div>
            </div>

            {/* Detailed Tide Data - Collapsible */}
            <Collapsible className="mt-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full text-blue-600 hover:text-blue-800 font-medium">
                ข้อมูลน้ำขึ้นน้ำลงเชิงลึก
                <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 text-gray-700 grid gap-2">
                <p>
                  <span className="font-semibold">ข้างขึ้นข้างแรม:</span>{" "}
                  {currentTideData.isWaxingMoon ? "ข้างขึ้น (ดวงจันทร์กำลังสว่างขึ้น)" : "ข้างแรม (ดวงจันทร์กำลังมืดลง)"}
                </p>
                <p>
                  <span className="font-semibold">สถานะน้ำ:</span>{" "}
                  {currentTideData.tideStatus === "น้ำเป็น"
                    ? "น้ำเป็น (Spring Tide): ช่วงที่น้ำขึ้นสูงสุดและน้ำลงต่ำสุดมีความแตกต่างกันมาก เกิดขึ้นในช่วงข้างขึ้นเต็มดวงและข้างแรมเต็มดวง"
                    : "น้ำตาย (Neap Tide): ช่วงที่น้ำขึ้นสูงสุดและน้ำลงต่ำสุดมีความแตกต่างกันน้อย เกิดขึ้นในช่วงข้างขึ้นครึ่งดวงและข้างแรมครึ่งดวง"}
                </p>
                <p className="text-sm text-gray-500">*ข้อมูลนี้เป็นการจำลองและอาจไม่ตรงกับข้อมูลจริงจาก API</p>
              </CollapsibleContent>
            </Collapsible>
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
              <Thermometer className="h-6 w-6 text-orange-500" />
              <span className="text-lg font-medium">รู้สึกเหมือน:</span>
              <span className="text-lg">{currentWeatherData.main.feels_like}°C</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="h-6 w-6 text-gray-500" />
              <span className="text-lg font-medium">สภาพอากาศ:</span>
              <span className="text-xl font-semibold">{currentWeatherData.weather[0].description}</span>
            </div>
            <div className="flex items-center gap-2">
              <Waves className="h-6 w-6 text-blue-500" />
              <span className="text-lg font-medium">ความเร็วลม:</span>
              <span className="text-xl font-semibold">{currentWeatherData.wind.speed} m/s</span>
            </div>
            <div className="flex items-start gap-2 rounded-md bg-yellow-50 p-4 text-yellow-800 border border-yellow-200">
              <AlertCircle className="h-6 w-6 flex-shrink-0 text-yellow-600" />
              <p className="text-base font-semibold">
                {weatherAlert === "ไม่มีการแจ้งเตือนสภาพอากาศพิเศษ" ? "ไม่มีการแจ้งเตือนสภาพอากาศพิเศษ" : weatherAlert}
              </p>
            </div>

            {/* Detailed Weather Data - Collapsible */}
            <Collapsible className="mt-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full text-blue-600 hover:text-blue-800 font-medium">
                ข้อมูลสภาพอากาศเชิงลึก
                <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 text-gray-700 grid gap-2">
                <p>
                  <span className="font-semibold">ความชื้น:</span> {currentWeatherData.main.humidity}%
                </p>
                <p>
                  <span className="font-semibold">ความกดอากาศ:</span> {currentWeatherData.main.pressure} hPa
                </p>
                <p>
                  <span className="font-semibold">ทิศทางลม:</span> {currentWeatherData.wind.deg}°
                </p>
                <p className="text-sm text-gray-500">*ข้อมูลนี้เป็นการจำลองและอาจไม่ตรงกับข้อมูลจริงจาก API</p>
              </CollapsibleContent>
            </Collapsible>
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
                  currentTideData.isSeaLevelHighToday
                    ? "bg-red-500 text-white text-lg px-4 py-2 font-bold"
                    : "bg-green-500 text-white text-lg px-4 py-2 font-bold"
                }
              >
                {currentTideData.isSeaLevelHighToday ? "หนุนสูงมาก" : "ระดับปกติ"}
              </Badge>
            </div>
            {/* Detailed Sea Level Rise Data - Collapsible (Placeholder for future data) */}
            <Collapsible className="mt-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full text-blue-600 hover:text-blue-800 font-medium">
                ข้อมูลระดับน้ำทะเลหนุนเชิงลึก
                <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 text-gray-700 grid gap-2">
                <p>
                  <span className="font-semibold">ปัจจัยที่ส่งผล:</span> แรงดึงดูดจากดวงจันทร์และดวงอาทิตย์, ความกดอากาศ, ทิศทางลม
                </p>
                <p>
                  <span className="font-semibold">แนวโน้ม:</span> ระดับน้ำทะเลมีแนวโน้มสูงขึ้นเล็กน้อยในช่วงน้ำเป็น
                </p>
                <p className="text-sm text-gray-500">*ข้อมูลนี้เป็นการจำลองและอาจไม่ตรงกับข้อมูลจริงจาก API</p>
              </CollapsibleContent>
            </Collapsible>
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
              <span className="text-4xl font-bold text-purple-700">{currentTideData.currentWaterLevel} ม.</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-medium">สถานะ:</span>
              <Badge variant="outline" className="bg-purple-500 text-white text-base px-3 py-1 font-semibold">
                {currentTideData.waterLevelStatus}
              </Badge>
            </div>
            <p className="mt-4 text-sm text-gray-600">*ระดับน้ำนี้คำนวณจากข้อมูลข้างขึ้นข้างแรมและปัจจัยอื่นๆ เพื่อให้ข้อมูลเบื้องต้น</p>

            {/* Detailed Water Level Calculation Data - Collapsible */}
            <Collapsible className="mt-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full text-blue-600 hover:text-blue-800 font-medium">
                ข้อมูลการคำนวณระดับน้ำเชิงลึก
                <ChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 text-gray-700 grid gap-2">
                <p>
                  <span className="font-semibold">หลักการคำนวณ:</span> ระดับน้ำคำนวณโดยพิจารณาจากวันที่ปัจจุบัน, ข้างขึ้นข้างแรม,
                  และสถานะน้ำเป็น/น้ำตาย เพื่อประมาณการระดับน้ำที่คาดการณ์
                </p>
                <p>
                  <span className="font-semibold">ค่าอ้างอิง:</span> ระดับน้ำปกติเฉลี่ยอยู่ที่ 2.5 เมตร
                </p>
                <p className="text-sm text-gray-500">*ข้อมูลนี้เป็นการจำลองและอาจไม่ตรงกับข้อมูลจริงจาก API</p>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
