import { Sun, Cloud, Waves, AlertCircle } from "lucide-react"
import { getTideData, type TideData } from "@/lib/tide-service"
import LocationSelector from "@/components/location-selector"

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      <LocationSelector />
    </div>
  )
}
