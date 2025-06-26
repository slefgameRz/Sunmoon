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

// Function to simulate fetching tide data based on a specific date
export async function getTideData(location: { lat: number; lon: number }, date: Date): Promise<TideData> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to start of day
  date.setHours(0, 0, 0, 0) // Normalize to start of day

  const diffTime = Math.abs(date.getTime() - today.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Simple logic to simulate changing tide data based on the selected date
  const isWaxing = diffDays % 2 === 0 // Alternating based on day difference
  const tideType = diffDays % 7 === 0 ? "น้ำเป็น" : "น้ำตาย" // Spring/Neap every 7 days based on diff

  // Generate high/low tide times that change slightly with date
  const highHour = (date.getDate() % 12) + 6
  const lowHour = (date.getDate() % 12) + 16
  const highTide = `${String(highHour).padStart(2, "0")}:30 น.`
  const lowTide = `${String(lowHour).padStart(2, "0")}:45 น.`

  const isHighToday = diffDays % 3 === 0 // Simulate high sea level rise every 3 days based on diff

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

  // NOTE: OpenWeatherMap's free tier only provides current weather data.
  // Historical or future weather forecasts would require a paid plan or a different API.
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

export async function getLocationForecast(location: LocationData, date: Date): Promise<ForecastResult> {
  try {
    // Weather data is always current for the location due to API limitations
    const [weatherData, tideData] = await Promise.all([
      getWeatherData(location.lat, location.lon),
      getTideData(location, date), // Pass the selected date to tide data
    ])
    return { tideData, weatherData }
  } catch (error) {
    console.error("Failed to fetch forecast data:", error)
    return { tideData: null, weatherData: null, error: "ไม่สามารถดึงข้อมูลพยากรณ์ได้" }
  }
}
