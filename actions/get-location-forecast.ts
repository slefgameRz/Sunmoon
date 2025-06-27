import { getTideData, getWeatherData, type LocationData, type TideData } from "@/lib/tide-service"

/**
 * Result shape used by the UI.
 */
export type ForecastResult = {
  weatherData: any | null
  tideData: TideData | null
  error: string | null
}

/**
 * Fetch tide / weather data for a given location.
 * If OPENWEATHER_API_KEY is missing we fall-back to the local weather simulator
 * so the UI can still render without throwing.
 *
 * date        – optional, defaults to today (local time-zone)
 * currentTime – optional {hour, minute}.  Defaults to now().
 */
export async function getLocationForecast(
  location: LocationData,
  date: Date = new Date(),
  currentTime: { hour: number; minute: number } = (() => {
    const now = new Date()
    return { hour: now.getHours(), minute: now.getMinutes() }
  })(),
): Promise<ForecastResult> {
  let weatherData: any | null = null
  let tideData: TideData | null = null
  let errorMessage: string | null = null

  /* ───────────────── Weather ───────────────── */
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (apiKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric&lang=th`
      const res = await fetch(url, { next: { revalidate: 3600 } })
      if (!res.ok) {
        errorMessage = `ไม่สามารถดึงข้อมูลสภาพอากาศได้: ${res.statusText}`
      } else {
        weatherData = await res.json()
      }
    } catch (err) {
      console.error("Weather API error:", err)
      errorMessage = "ไม่สามารถเชื่อมต่อกับบริการสภาพอากาศได้"
    }
  }

  // Fall-back to simulated weather when we have no key or the fetch above failed
  if (!weatherData) {
    weatherData = await getWeatherData(location)
  }

  /* ───────────────── Tide ───────────────── */
  try {
    tideData = await getTideData(location, date, currentTime)
  } catch (err) {
    console.error("Tide service error:", err)
    errorMessage = errorMessage ? `${errorMessage} และไม่สามารถดึงข้อมูลน้ำขึ้นน้ำลงได้` : "ไม่สามารถดึงข้อมูลน้ำขึ้นน้ำลงได้"
  }

  return { weatherData, tideData, error: errorMessage }
}
