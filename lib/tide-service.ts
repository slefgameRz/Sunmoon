export type LocationData = {
  lat: number
  lon: number
  name: string
}

export type TideEvent = {
  time: string // HH:MM format
  level: number // in meters
  type: "high" | "low"
}

export type TideData = {
  isWaxingMoon: boolean // ข้างขึ้น (true) / ข้างแรม (false)
  lunarPhaseKham: number // 1-15 ค่ำ
  tideStatus: "น้ำเป็น" | "น้ำตาย" // น้ำเป็น (spring tide) / น้ำตาย (neap tide)
  highTideTime: string // HH:MM format
  lowTideTime: string // HH:MM format
  isSeaLevelHighToday: boolean // Indicates if sea level is unusually high today
  currentWaterLevel: number // Current water level in meters
  waterLevelStatus: string // e.g., "น้ำขึ้น", "น้ำลง", "น้ำนิ่ง"
  waterLevelReference: string // Reference for water level data
  seaLevelRiseReference: string // Reference for sea level rise data
  pierDistance: number // Distance from pier in meters
  pierReference: string // Reference for pier distance data
  tideEvents: TideEvent[] // Array of significant tide events for the day
}

export type WeatherData = {
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
  tideData: TideData
  weatherData: WeatherData
  error?: string
}

// This function simulates fetching tide data.
// In a real application, this would call an external API.
export async function getTideData(
  location: LocationData,
  date: Date,
  time: { hour: number; minute: number },
): Promise<TideData> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const dayOfMonth = date.getDate()
  const month = date.getMonth()
  const year = date.getFullYear()

  // Simulate lunar phase and tide status based on date
  const isWaxingMoon = dayOfMonth % 2 === 0 // Just a simple simulation
  const lunarPhaseKham = (dayOfMonth % 15) + 1
  const tideStatus = lunarPhaseKham > 7 && lunarPhaseKham < 15 ? "น้ำตาย" : "น้ำเป็น"

  // Simulate tide events for the day
  const simulatedTideEvents: TideEvent[] = []
  // High tide 1
  simulatedTideEvents.push({
    time: "06:30",
    level: 2.5 + Math.random() * 0.5 * (tideStatus === "น้ำเป็น" ? 1.5 : 0.5), // Higher range for spring tide
    type: "high",
  })
  // Low tide 1
  simulatedTideEvents.push({
    time: "12:45",
    level: 0.5 + Math.random() * 0.3 * (tideStatus === "น้ำเป็น" ? 0.5 : 1.5), // Lower range for spring tide
    type: "low",
  })
  // High tide 2
  simulatedTideEvents.push({
    time: "19:00",
    level: 2.3 + Math.random() * 0.4 * (tideStatus === "น้ำเป็น" ? 1.5 : 0.5),
    type: "high",
  })
  // Low tide 2
  simulatedTideEvents.push({
    time: "00:15", // Next day's early low tide
    level: 0.7 + Math.random() * 0.2 * (tideStatus === "น้ำเป็น" ? 0.5 : 1.5),
    type: "low",
  })

  // Sort tide events by time
  simulatedTideEvents.sort((a, b) => {
    const [ha, ma] = a.time.split(":").map(Number)
    const [hb, mb] = b.time.split(":").map(Number)
    if (ha !== hb) return ha - hb
    return ma - mb
  })

  // Determine current water level and status based on selected time
  const selectedDateTime = new Date(year, month, dayOfMonth, time.hour, time.minute)
  let currentWaterLevel = 1.5 + Math.sin((selectedDateTime.getHours() / 24) * Math.PI * 2) * 1 // Simple sine wave simulation
  currentWaterLevel = Number.parseFloat(currentWaterLevel.toFixed(2))

  let waterLevelStatus = "น้ำนิ่ง"
  // Simple logic: if current time is between a low and high, it's rising, else falling
  const currentHour = time.hour + time.minute / 60
  const firstHighHour = Number.parseInt(simulatedTideEvents[0]?.time.split(":")[0] || "0")
  const firstLowHour = Number.parseInt(simulatedTideEvents[1]?.time.split(":")[0] || "0")

  if (currentHour > firstLowHour && currentHour < firstHighHour) {
    waterLevelStatus = "น้ำขึ้น"
  } else if (currentHour > firstHighHour || currentHour < firstLowHour) {
    waterLevelStatus = "น้ำลง"
  }

  // Simulate if sea level is high today (e.g., for specific dates or conditions)
  const isSeaLevelHighToday = (dayOfMonth === 15 && month === 10) || (dayOfMonth === 1 && month === 11) // Example: Nov 15 or Dec 1

  return {
    isWaxingMoon,
    lunarPhaseKham,
    tideStatus,
    highTideTime: simulatedTideEvents.find((e) => e.type === "high")?.time || "N/A",
    lowTideTime: simulatedTideEvents.find((e) => e.type === "low")?.time || "N/A",
    isSeaLevelHighToday,
    currentWaterLevel,
    waterLevelStatus,
    waterLevelReference: "กรมอุทกศาสตร์ กองทัพเรือ",
    seaLevelRiseReference: "ข้อมูลจากกรมทรัพยากรทางทะเลและชายฝั่ง",
    pierDistance: 50 + Math.floor(Math.random() * 100), // Simulated pier distance
    pierReference: "ข้อมูลจำลองจากท่าเรือท้องถิ่น",
    tideEvents: simulatedTideEvents,
  }
}

// This function simulates fetching weather data from OpenWeatherMap.
// In a real application, this would call the OpenWeatherMap API.
export async function getWeatherData(location: LocationData): Promise<WeatherData> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Simulate weather data
  const simulatedTemp = 25 + Math.random() * 5 - 2.5 // 22.5 to 27.5
  const simulatedFeelsLike = simulatedTemp + Math.random() * 2 - 1 // +/- 1 degree
  const simulatedHumidity = 70 + Math.random() * 20 - 10 // 60 to 80
  const simulatedPressure = 1010 + Math.random() * 10 - 5 // 1005 to 1015
  const simulatedWindSpeed = 2 + Math.random() * 3 // 2 to 5 m/s
  const simulatedWindDeg = Math.floor(Math.random() * 360)

  const weatherConditions = [
    { description: "ท้องฟ้าแจ่มใส", icon: "01d" },
    { description: "มีเมฆบางส่วน", icon: "02d" },
    { description: "เมฆกระจัดกระจาย", icon: "03d" },
    { description: "เมฆมาก", icon: "04d" },
    { description: "ฝนตกปรอยๆ", icon: "09d" },
    { description: "ฝนตก", icon: "10d" },
    { description: "พายุฝนฟ้าคะนอง", icon: "11d" },
    { description: "หิมะตก", icon: "13d" },
    { description: "หมอก", icon: "50d" },
  ]
  const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)]

  return {
    main: {
      temp: Number.parseFloat(simulatedTemp.toFixed(1)),
      feels_like: Number.parseFloat(simulatedFeelsLike.toFixed(1)),
      humidity: Math.floor(simulatedHumidity),
      pressure: Math.floor(simulatedPressure),
    },
    weather: [randomWeather],
    wind: {
      speed: Number.parseFloat(simulatedWindSpeed.toFixed(1)),
      deg: simulatedWindDeg,
    },
    name: location.name,
  }
}

export async function getLocationForecast(
  location: LocationData,
  date: Date,
  time: { hour: number; minute: number },
): Promise<ForecastResult> {
  try {
    const tideData = await getTideData(location, date, time)
    const weatherData = await getWeatherData(location)

    return { tideData, weatherData }
  } catch (error) {
    console.error("Error in getLocationForecast:", error)
    return {
      tideData: {
        isWaxingMoon: true,
        lunarPhaseKham: 0,
        tideStatus: "ไม่ทราบ",
        highTideTime: "N/A",
        lowTideTime: "N/A",
        isSeaLevelHighToday: false,
        currentWaterLevel: 0,
        waterLevelStatus: "ไม่ทราบ",
        waterLevelReference: "ไม่ทราบแหล่งอ้างอิง",
        seaLevelRiseReference: "ไม่ทราบแหล่งอ้างอิง",
        pierDistance: 0,
        pierReference: "ไม่ทราบแหล่งอ้างอิง",
        tideEvents: [],
      },
      weatherData: {
        main: { temp: 0, feels_like: 0, humidity: 0, pressure: 0 },
        weather: [{ description: "ไม่ทราบ", icon: "01d" }],
        wind: { speed: 0, deg: 0 },
        name: "ไม่ทราบ",
      },
      error: "ไม่สามารถดึงข้อมูลพยากรณ์ได้เนื่องจากข้อผิดพลาดภายใน",
    }
  }
}
