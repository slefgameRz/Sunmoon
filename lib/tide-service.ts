// In a real application, this would fetch data from a tide prediction API.
// For demonstration, we'll simulate an API call.

export type TideData = {
  isWaxingMoon: boolean // ข้างขึ้น (waxing) or ข้างแรม (waning)
  tideStatus: "น้ำเป็น" | "น้ำตาย" // น้ำเป็น (spring tide) or น้ำตาย (neap tide)
  highTideTime: string
  lowTideTime: string
  isSeaLevelHighToday: boolean // วันนี้หนุนสูงมั้ย
  currentWaterLevel: number // meters
  waterLevelStatus: string // e.g., "ระดับน้ำปกติ", "ระดับน้ำสูงเล็กน้อย", "ระดับน้ำต่ำ"
}

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
