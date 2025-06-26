"use server"

import type { TideData } from "@/lib/tide-service"

// Define types for OpenWeatherMap API response (simplified)
type WeatherData = {
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  weather: Array<{
    description: string
    icon: string
  }>
  wind: {
    speed: number
    deg: number
  }
  name: string
}

// Function to simulate fetching tide data
export async function getTideData(location: { lat: number; lon: number }): Promise<TideData> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // In a real scenario, you'd use 'location' to fetch specific tide data.
  // For this example, we'll return static mock data.
  const today = new Date()
  const dayOfMonth = today.getDate()

  // Simple logic to simulate changing tide data based on day
  const isWaxing = dayOfMonth % 2 === 0 // Alternating for demo
  const tideType = dayOfMonth % 7 === 0 ? "น้ำเป็น" : "น้ำตาย" // Spring/Neap every 7 days
  const highTide = `0${(dayOfMonth % 12) + 6}:30 น.` // Example times
  const lowTide = `${(dayOfMonth % 12) + 16}:45 น.`
  const isHighToday = dayOfMonth % 3 === 0 // Simulate high sea level rise every 3 days

  let waterLevel = 2.5 + (isHighToday ? 0.3 : 0) + (tideType === "น้ำเป็น" ? 0.2 : 0)
  waterLevel = Number.parseFloat(waterLevel.toFixed(1)) // Round to 1 decimal place

  let waterStatus = "ระดับน้ำปกติ"
  if (waterLevel > 2.8) {
    waterStatus = "ระดับน้ำสูงเล็กน้อย"
  } else if (waterLevel < 2.3) {
    waterStatus = "ระดับน้ำต่ำ"
  }

  return {
    isWaxingMoon: isWaxing,
    tideStatus: tideType,
    highTideTime: highTide,
    lowTideTime: lowTide,
    isSeaLevelHighToday: isHighToday,
    currentWaterLevel: waterLevel,
    waterLevelStatus: waterStatus,
  }
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

export type LocationData = {
  lat: number
  lon: number
  name: string
}

export type ForecastResult = {
  tideData: TideData | null
  weatherData: WeatherData | null
  error?: string
}

export async function getLocationForecast(location: LocationData): Promise<ForecastResult> {
  try {
    const [weatherData, tideData] = await Promise.all([
      getWeatherData(location.lat, location.lon),
      getTideData(location),
    ])
    return { tideData, weatherData }
  } catch (error) {
    console.error("Failed to fetch forecast data:", error)
    return { tideData: null, weatherData: null, error: "ไม่สามารถดึงข้อมูลพยากรณ์ได้" }
  }
}
