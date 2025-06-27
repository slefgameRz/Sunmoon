import type { LocationData, TideEvent } from "@/actions/get-location-forecast"

export interface TideData {
  isWaxingMoon: boolean
  lunarPhaseKham: number
  tideStatus: "น้ำเป็น" | "น้ำตาย"
  highTideTime: string
  lowTideTime: string
  isSeaLevelHighToday: boolean
  currentWaterLevel: number
  waterLevelStatus: string
  waterLevelReference: string
  seaLevelRiseReference: string
  pierDistance: number
  pierReference: string
  tideEvents: TideEvent[]
}

export async function getTideData(location: LocationData, date: Date): Promise<TideData> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Simulate tide data based on location and date
  const isBangkok = location.name.includes("กรุงเทพมหานคร")
  const dayOfMonth = date.getDate()
  const month = date.getMonth() // 0-11
  const year = date.getFullYear()

  const isWaxingMoon = true // Simulate waxing/waning moon
  const lunarPhaseKham = (dayOfMonth % 15) + 1 // Simulate lunar phase 1-15
  let tideStatus: "น้ำเป็น" | "น้ำตาย" = "น้ำเป็น" // Simulate tide status
  let isSeaLevelHighToday = false // Simulate sea level rise

  // Simple logic for tide status based on lunar phase (full moon/new moon = น้ำเป็น, half moon = น้ำตาย)
  if (lunarPhaseKham === 1 || lunarPhaseKham === 8 || lunarPhaseKham === 15) {
    tideStatus = "น้ำเป็น"
  } else {
    tideStatus = "น้ำตาย"
  }

  // Simulate sea level rise for specific dates/locations
  if (isBangkok && (dayOfMonth === 10 || dayOfMonth === 25)) {
    isSeaLevelHighToday = true
  }

  // Simulate current water level (random for now)
  const currentWaterLevel = Number.parseFloat((Math.random() * 2 + 0.5).toFixed(2)) // 0.5 to 2.5 meters

  let waterLevelStatus = "ปกติ"
  if (currentWaterLevel > 1.8) {
    waterLevelStatus = "สูง"
  } else if (currentWaterLevel < 0.8) {
    waterLevelStatus = "ต่ำ"
  }

  // Simulate pier distance
  const pierDistance = Number.parseFloat((Math.random() * 50 + 10).toFixed(0)) // 10 to 60 meters

  // Simulate tide events for the day
  const tideEvents: TideEvent[] = [
    { type: "high", time: "06:30", level: Number.parseFloat((Math.random() * 2 + 1.5).toFixed(2)) }, // High tide 1
    { type: "low", time: "12:45", level: Number.parseFloat((Math.random() * 0.5 + 0.1).toFixed(2)) }, // Low tide 1
    { type: "high", time: "19:00", level: Number.parseFloat((Math.random() * 2 + 1.5).toFixed(2)) }, // High tide 2
    { type: "low", time: "00:30", level: Number.parseFloat((Math.random() * 0.5 + 0.1).toFixed(2)) }, // Low tide 2 (next day's early morning)
  ].sort((a, b) => {
    const [hA, mA] = a.time.split(":").map(Number)
    const [hB, mB] = b.time.split(":").map(Number)
    if (hA !== hB) return hA - hB
    return mA - mB
  })

  // Find the highest and lowest tide times from the simulated events
  const highTideEvent = tideEvents.find((event) => event.type === "high")
  const lowTideEvent = tideEvents.find((event) => event.type === "low")

  return {
    isWaxingMoon,
    lunarPhaseKham,
    tideStatus,
    highTideTime: highTideEvent ? `${highTideEvent.time} น. (${highTideEvent.level.toFixed(2)} ม.)` : "N/A",
    lowTideTime: lowTideEvent ? `${lowTideEvent.time} น. (${lowTideEvent.level.toFixed(2)} ม.)` : "N/A",
    isSeaLevelHighToday,
    currentWaterLevel,
    waterLevelStatus,
    waterLevelReference: "กรมอุทกศาสตร์",
    seaLevelRiseReference: "ศูนย์เตือนภัยพิบัติแห่งชาติ",
    pierDistance,
    pierReference: "ท่าเรือจำลอง",
    tideEvents,
  }
}
