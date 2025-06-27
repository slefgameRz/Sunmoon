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
// NOTE: This function is now primarily handled within actions/get-location-forecast.ts
// Keeping it here for type definition consistency if needed elsewhere, but it's not called directly by page.tsx anymore.
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

export default function Home() {
  return (
    <main>
      <LocationSelector />
    </main>
  )
}
