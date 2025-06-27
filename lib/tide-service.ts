export type LocationData = {
  lat: number
  lon: number
  name: string
}

export type TideEvent = {
  type: "high" | "low"
  time: string // HH:MM format
  level: number // Water level in meters
}

export type TideData = {
  isWaxingMoon: boolean // ข้างขึ้น (true) / ข้างแรม (false)
  lunarPhaseKham: number // จำนวนค่ำ (1-15)
  tideStatus: "น้ำเป็น" | "น้ำตาย" // น้ำเป็น (spring tide) / น้ำตาย (neap tide)
  highTideTime: string // เวลาที่น้ำขึ้นสูงสุด
  lowTideTime: string // เวลาที่น้ำลงต่ำสุด
  isSeaLevelHighToday: boolean // วันนี้น้ำทะเลหนุนสูงหรือไม่
  currentWaterLevel: number // ระดับน้ำปัจจุบัน (จำลอง)
  waterLevelStatus: string // สถานะระดับน้ำ (เช่น "ปกติ", "สูง", "ต่ำ")
  waterLevelReference: string // แหล่งอ้างอิงระดับน้ำ
  seaLevelRiseReference: string // แหล่งอ้างอิงน้ำทะเลหนุน
  pierDistance: number // ระยะห่างจากท่าเรือ (เมตร)
  pierReference: string // แหล่งอ้างอิงระยะห่างท่าเรือ
  tideEvents: TideEvent[] // รายละเอียดเหตุการณ์น้ำขึ้นน้ำลง
}

// Function to simulate tide data based on location and date
export async function getTideData(
  location: LocationData,
  date: Date,
  currentTime: { hour: number; minute: number },
): Promise<TideData> {
  // Simulate lunar phase and tide status based on date (simplified)
  const dayOfMonth = date.getDate()
  const isWaxingMoon = dayOfMonth % 2 === 0 // Simulate waxing/waning
  const lunarPhaseKham = (dayOfMonth % 15) + 1 // Simulate 1-15 kām

  let tideStatus: "น้ำเป็น" | "น้ำตาย" = "น้ำตาย"
  if (lunarPhaseKham === 8 || lunarPhaseKham === 15 || lunarPhaseKham === 1 || lunarPhaseKham === 2) {
    tideStatus = "น้ำเป็น" // Simulate spring tide around new/full moon
  }

  // Simulate high/low tide times and levels
  const simulatedTideEvents: TideEvent[] = []

  // Simulate 2 high tides and 2 low tides for the day
  // Times are arbitrary for simulation
  simulatedTideEvents.push({ type: "high", time: "06:30", level: 2.8 + Math.random() * 0.4 }) // High tide 1
  simulatedTideEvents.push({ type: "low", time: "12:45", level: 0.5 + Math.random() * 0.3 }) // Low tide 1
  simulatedTideEvents.push({ type: "high", time: "19:00", level: 3.1 + Math.random() * 0.5 }) // High tide 2
  simulatedTideEvents.push({ type: "low", time: "01:15", level: 0.2 + Math.random() * 0.2 }) // Low tide 2 (next day's early morning)

  // Sort tide events by time
  simulatedTideEvents.sort((a, b) => {
    const [ah, am] = a.time.split(":").map(Number)
    const [bh, bm] = b.time.split(":").map(Number)
    if (ah !== bh) return ah - bh
    return am - bm
  })

  // Determine highTideTime and lowTideTime for the main card from the sorted events
  const firstHighTide = simulatedTideEvents.find((event) => event.type === "high")
  const firstLowTide = simulatedTideEvents.find((event) => event.type === "low")

  const highTideTime = firstHighTide ? `${firstHighTide.time} น. (${firstHighTide.level.toFixed(2)} ม.)` : "N/A"
  const lowTideTime = firstLowTide ? `${firstLowTide.time} น. (${firstLowTide.level.toFixed(2)} ม.)` : "N/A"

  // Simulate current water level based on time (very simplified)
  const currentHour = currentTime.hour
  const currentMinute = currentTime.minute
  let currentWaterLevel =
    1.5 + Math.sin(((currentHour + currentMinute / 60) / 24) * 2 * Math.PI) * 1.0 + Math.random() * 0.1 // Simple sine wave simulation
  currentWaterLevel = Number.parseFloat(currentWaterLevel.toFixed(2))

  let waterLevelStatus = "ปกติ"
  let isSeaLevelHighToday = false
  if (currentWaterLevel > 2.5) {
    waterLevelStatus = "สูง"
    isSeaLevelHighToday = true
  } else if (currentWaterLevel < 0.8) {
    waterLevelStatus = "ต่ำ"
  }

  // Simulate pier distance based on water level (example)
  let pierDistance = 5 + (3.0 - currentWaterLevel) * 2 // Closer to pier if water is lower
  if (pierDistance < 0) pierDistance = 0.5 // Cannot be negative
  pierDistance = Number.parseFloat(pierDistance.toFixed(2))

  return {
    isWaxingMoon,
    lunarPhaseKham,
    tideStatus,
    highTideTime,
    lowTideTime,
    isSeaLevelHighToday,
    currentWaterLevel,
    waterLevelStatus,
    waterLevelReference: "กรมอุทกศาสตร์ กองทัพเรือ (จำลอง)",
    seaLevelRiseReference: "ข้อมูลจำลองเพื่อการศึกษา",
    pierDistance,
    pierReference: "ท่าเรือจำลอง A",
    tideEvents: simulatedTideEvents,
  }
}
