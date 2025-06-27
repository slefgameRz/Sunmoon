import { getTideData, type LocationData, type TideData } from "@/lib/tide-service"

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

export type ForecastResult = {
  weatherData: WeatherData | null
  tideData: TideData | null
  error: string | null
}

export async function getLocationForecast(
  location: LocationData,
  date: Date,
  currentTime: { hour: number; minute: number },
): Promise<ForecastResult> {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) {
    console.error("OPENWEATHER_API_KEY is not set.")
    return { weatherData: null, tideData: null, error: "ไม่พบ API Key สำหรับ OpenWeatherMap" }
  }

  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric&lang=th`

  let weatherData: WeatherData | null = null
  let tideData: TideData | null = null
  let errorMessage: string | null = null

  try {
    const weatherResponse = await fetch(weatherUrl, { next: { revalidate: 3600 } }) // Revalidate every hour
    if (!weatherResponse.ok) {
      console.error(`Error fetching weather: ${weatherResponse.statusText}`)
      errorMessage = `ไม่สามารถดึงข้อมูลสภาพอากาศได้: ${weatherResponse.statusText}`
    } else {
      weatherData = await weatherResponse.json()
    }
  } catch (error) {
    console.error("Failed to fetch weather data:", error)
    errorMessage = "ไม่สามารถเชื่อมต่อกับบริการสภาพอากาศได้"
  }

  try {
    // Simulate tide data based on location and date
    tideData = await getTideData(location, date, currentTime)
  } catch (error) {
    console.error("Failed to get tide data:", error)
    if (errorMessage) {
      errorMessage += " และไม่สามารถดึงข้อมูลน้ำขึ้นน้ำลงได้"
    } else {
      errorMessage = "ไม่สามารถดึงข้อมูลน้ำขึ้นน้ำลงได้"
    }
  }

  return { weatherData, tideData, error: errorMessage }
}
