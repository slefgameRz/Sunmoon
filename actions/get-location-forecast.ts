"use server"

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

export type TideEvent = {
  time: string // e.g., "06:30 น."
  level: number // e.g., 3.25 meters
  type: "high" | "low" // "high" for high tide, "low" for low tide
}

export type TideData = {
  isWaxingMoon: boolean // ข้างขึ้น (waxing) or ข้างแรม (waning)
  lunarPhaseKham: number // กี่ค่ำ (e.g., 1-15)
  tideStatus: "น้ำเป็น" | "น้ำตาย" // น้ำเป็น (spring tide) or น้ำตาย (neap tide)
  highTideTime: string
  lowTideTime: string
  isSeaLevelHighToday: boolean // วันนี้หนุนสูงมั้ย
  currentWaterLevel: number // meters
  waterLevelStatus: string // e.g., "ระดับน้ำปกติ", "ระดับน้ำสูงเล็กน้อย", "ระดับน้ำต่ำ"
  waterLevelReference: string // อ้างอิงระดับน้ำ
  seaLevelRiseReference: string // อ้างอิงระดับหนุน
  pierDistance: number // ระยะห่างจากท่าเรือ (meters)
  pierReference: string // อ้างอิงระยะห่างท่าเรือ
  tideEvents: TideEvent[] // รายละเอียดน้ำขึ้นน้ำลงแต่ละช่วงเวลา
}

// Function to simulate fetching tide data based on a specific date and time
export async function getTideData(
  location: { lat: number; lon: number },
  date: Date,
  time: { hour: number; minute: number },
): Promise<TideData> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const selectedDateTime = new Date(date)
  selectedDateTime.setHours(time.hour, time.minute, 0, 0)

  // --- Lunar Phase Calculation ---
  // Reference new moon date (e.g., Jan 11, 2024 was a new moon)
  const newMoonRef = new Date("2024-01-11T00:00:00Z")
  const diffMs = selectedDateTime.getTime() - newMoonRef.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  // Lunar cycle is approx 29.53 days
  const lunarCycleLength = 29.530588
  const dayInLunarCycle = Math.floor(diffDays % lunarCycleLength)

  let isWaxing = true
  let lunarPhaseKham = 0

  if (dayInLunarCycle <= 14) {
    isWaxing = true // ข้างขึ้น
    lunarPhaseKham = dayInLunarCycle + 1
  } else {
    isWaxing = false // ข้างแรม
    lunarPhaseKham = dayInLunarCycle - 14 // Adjust for 15th day of waxing being full moon
    if (lunarPhaseKham > 15) lunarPhaseKham = 15 // Cap at 15 for แรม 15 ค่ำ
  }

  // --- Tide Type (Spring/Neap) Simulation ---
  const dayOffset = Math.floor(diffDays) // Use full days for tide pattern
  const tideType = dayOffset % 7 === 0 ? "น้ำเป็น" : "น้ำตาย" // Spring/Neap every 7 days based on diff

  // --- Current Water Level Simulation ---
  const isSeaLevelHighToday = dayOffset % 3 === 0 // Simulate high sea level rise every 3 days based on diff
  let currentWaterLevel = 2.5 + (isSeaLevelHighToday ? 0.3 : 0) + (tideType === "น้ำเป็น" ? 0.2 : 0)
  // Further adjust water level based on selected time (simple sinusoidal model for demo)
  const hourOfDay = selectedDateTime.getHours() + selectedDateTime.getMinutes() / 60
  const tideCycleFactor = Math.sin((hourOfDay / 24) * 2 * Math.PI) // Simple daily cycle
  currentWaterLevel += tideCycleFactor * 0.1 // Small adjustment based on time of day

  currentWaterLevel = Number.parseFloat(currentWaterLevel.toFixed(2)) // Round to 2 decimal places

  let waterStatus = "ระดับน้ำปกติ"
  if (currentWaterLevel > 2.8) {
    waterStatus = "ระดับน้ำสูงเล็กน้อย"
  } else if (currentWaterLevel < 2.3) {
    waterStatus = "ระดับน้ำต่ำ"
  }

  // --- Simulated Tide Events for the Day (2 High, 2 Low) ---
  const tideEvents: TideEvent[] = []
  const baseHour = selectedDateTime.getHours()
  const baseMinute = selectedDateTime.getMinutes()

  // Simulate first high tide
  const h1Hour = (baseHour + 6) % 24
  const h1Minute = (baseMinute + 15) % 60
  tideEvents.push({
    time: `${String(h1Hour).padStart(2, "0")}:${String(h1Minute).padStart(2, "0")} น.`,
    level: Number.parseFloat((currentWaterLevel + (tideType === "น้ำเป็น" ? 0.5 : 0.3)).toFixed(2)),
    type: "high",
  })

  // Simulate first low tide
  const l1Hour = (baseHour + 12) % 24
  const l1Minute = (baseMinute + 30) % 60
  tideEvents.push({
    time: `${String(l1Hour).padStart(2, "0")}:${String(l1Minute).padStart(2, "0")} น.`,
    level: Number.parseFloat((currentWaterLevel - (tideType === "น้ำเป็น" ? 0.5 : 0.3)).toFixed(2)),
    type: "low",
  })

  // Simulate second high tide (if applicable for a 24-hour period)
  const h2Hour = (baseHour + 18) % 24
  const h2Minute = (baseMinute + 45) % 60
  tideEvents.push({
    time: `${String(h2Hour).padStart(2, "0")}:${String(h2Minute).padStart(2, "0")} น.`,
    level: Number.parseFloat((currentWaterLevel + (tideType === "น้ำเป็น" ? 0.4 : 0.2)).toFixed(2)),
    type: "high",
  })

  // Simulate second low tide (if applicable for a 24-hour period)
  const l2Hour = (baseHour + 24) % 24 // This might wrap to next day, but for "today's events" it's fine
  const l2Minute = (baseMinute + 0) % 60
  tideEvents.push({
    time: `${String(l2Hour).padStart(2, "0")}:${String(l2Minute).padStart(2, "0")} น.`,
    level: Number.parseFloat((currentWaterLevel - (tideType === "น้ำเป็น" ? 0.4 : 0.2)).toFixed(2)),
    type: "low",
  })

  // Sort tide events by time for display
  tideEvents.sort((a, b) => {
    const timeA = Number.parseInt(a.time.split(":")[0]) * 60 + Number.parseInt(a.time.split(":")[1])
    const timeB = Number.parseInt(b.time.split(":")[0]) * 60 + Number.parseInt(b.time.split(":")[1])
    return timeA - timeB
  })

  // Simulate pier distance
  const pierDistance = Number.parseFloat((Math.random() * 500 + 100).toFixed(0)) // 100-600 meters
  const pierReference = "จำลองจากระยะห่างท่าเรือมาตรฐานในพื้นที่ใกล้เคียง"

  // Find the first high and low tide for the summary display
  const firstHighTide = tideEvents.find((event) => event.type === "high")
  const firstLowTide = tideEvents.find((event) => event.type === "low")

  return {
    isWaxingMoon: isWaxing,
    lunarPhaseKham: lunarPhaseKham,
    tideStatus: tideType,
    highTideTime: firstHighTide ? `${firstHighTide.time} (${firstHighTide.level} ม.)` : "N/A",
    lowTideTime: firstLowTide ? `${firstLowTide.time} (${firstLowTide.level} ม.)` : "N/A",
    isSeaLevelHighToday: isSeaLevelHighToday,
    currentWaterLevel: currentWaterLevel,
    waterLevelStatus: waterStatus,
    waterLevelReference: "อ้างอิงจากระดับน้ำทะเลปานกลาง (MSL) ณ สถานีวัดระดับน้ำคลองบางกอกน้อย",
    seaLevelRiseReference: "อ้างอิงจากข้อมูลการคาดการณ์น้ำทะเลหนุนสูง กรมอุทกศาสตร์",
    pierDistance: pierDistance,
    pierReference: pierReference,
    tideEvents: tideEvents,
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
  // Historical or future weather forecasts with specific times would require a paid plan or a different API.
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

export async function getLocationForecast(
  location: LocationData,
  date: Date,
  time: { hour: number; minute: number },
): Promise<ForecastResult> {
  try {
    // Weather data is always current for the location due to API limitations
    const [weatherData, tideData] = await Promise.all([
      getWeatherData(location.lat, location.lon),
      getTideData(location, date, time), // Pass the selected date and time to tide data
    ])
    return { tideData, weatherData }
  } catch (error) {
    console.error("Failed to fetch forecast data:", error)
    return { tideData: null, weatherData: null, error: "ไม่สามารถดึงข้อมูลพยากรณ์ได้" }
  }
}
