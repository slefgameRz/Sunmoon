"use server"

import { getTideData, getWeatherData, type LocationData, type TideData, type WeatherData } from "@/lib/tide-service"

/**
 * Result shape used by the UI.
 */
export type ForecastResult = {
  weatherData: WeatherData | null
  tideData: TideData | null
  error: string | null
}

function mapOpenWeatherToWeatherData(raw: any, fallbackName: string): WeatherData {
  const main = raw?.main ?? {}
  const weather0 = Array.isArray(raw?.weather) && raw.weather.length ? raw.weather[0] : { description: "ไม่ทราบ", icon: "01d" }
  const wind = raw?.wind ?? {}
  return {
    main: {
      temp: Number.isFinite(main.temp) ? Number.parseFloat(Number(main.temp).toFixed(1)) : 0,
      feels_like: Number.isFinite(main.feels_like) ? Number.parseFloat(Number(main.feels_like).toFixed(1)) : 0,
      humidity: Number.isFinite(main.humidity) ? Number(main.humidity) : 0,
      pressure: Number.isFinite(main.pressure) ? Number(main.pressure) : 0,
    },
    weather: [{
      description: typeof weather0.description === "string" ? weather0.description : "ไม่ทราบ",
      icon: typeof weather0.icon === "string" ? weather0.icon : "01d",
    }],
    wind: {
      speed: Number.isFinite(wind.speed) ? Number.parseFloat(Number(wind.speed).toFixed(1)) : 0,
      deg: Number.isFinite(wind.deg) ? Number(wind.deg) : 0,
    },
    name: typeof raw?.name === "string" && raw.name.trim() ? raw.name : fallbackName,
  }
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
  let weatherData: WeatherData | null = null
  let tideData: TideData | null = null
  let errorMessage: string | null = null

  /* ───────────────── Weather ───────────────── */
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (apiKey) {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=metric&lang=th`
      const res = await fetch(url, { 
        cache: 'default',
        next: { revalidate: 3600 }
      } as any)
      if (!res.ok) {
        errorMessage = `ไม่สามารถดึงข้อมูลสภาพอากาศได้: ${res.statusText}`
      } else {
        const raw = await res.json()
        weatherData = mapOpenWeatherToWeatherData(raw, location.name)
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
