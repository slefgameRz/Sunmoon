import { getLocationForecast } from '@/actions/get-location-forecast'
import type { LocationData } from '@/lib/tide-service'

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message'
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || ''

/**
 * Send reply message to LINE user
 */
async function replyMessage(replyToken: string, messages: unknown[]) {
  if (!CHANNEL_ACCESS_TOKEN) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is not configured')
    return
  }

  try {
    const response = await fetch(`${LINE_MESSAGING_API}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('LINE API error:', error)
    }
  } catch (error) {
    console.error('Failed to send LINE reply:', error)
  }
}

/**
 * Send push message to LINE user
 */
async function pushMessage(userId: string, messages: unknown[]) {
  if (!CHANNEL_ACCESS_TOKEN) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is not configured')
    return
  }

  try {
    const response = await fetch(`${LINE_MESSAGING_API}/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: userId,
        messages,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('LINE API error:', error)
    }
  } catch (error) {
    console.error('Failed to send LINE push:', error)
  }
}

/**
 * Parse location from user message
 */
function parseLocation(text: string): LocationData | null {
  const lowerText = text.toLowerCase().trim()

  // Popular locations mapping
  const locationMap: Record<string, LocationData> = {
    กรุงเทพ: { lat: 13.7563, lon: 100.5018, name: 'กรุงเทพมหานคร' },
    กทม: { lat: 13.7563, lon: 100.5018, name: 'กรุงเทพมหานคร' },
    ภูเก็ต: { lat: 7.8804, lon: 98.3923, name: 'ภูเก็ต' },
    phuket: { lat: 7.8804, lon: 98.3923, name: 'ภูเก็ต' },
    สมุย: { lat: 9.1378, lon: 99.3328, name: 'เกาะสมุย' },
    samui: { lat: 9.1378, lon: 99.3328, name: 'เกาะสมุย' },
    พัทยา: { lat: 12.9236, lon: 100.8783, name: 'พัทยา' },
    pattaya: { lat: 12.9236, lon: 100.8783, name: 'พัทยา' },
    หัวหิน: { lat: 11.2567, lon: 99.9534, name: 'หัวหิน' },
    'hua hin': { lat: 11.2567, lon: 99.9534, name: 'หัวหิน' },
    กระบี่: { lat: 8.0367, lon: 98.9069, name: 'กระบี่' },
    krabi: { lat: 8.0367, lon: 98.9069, name: 'กระบี่' },
    เกาะช้าง: { lat: 9.9673, lon: 99.0515, name: 'เกาะช้าง' },
    'koh chang': { lat: 9.9673, lon: 99.0515, name: 'เกาะช้าง' },
    บางแสน: { lat: 13.3611, lon: 100.9847, name: 'บางแสน' },
    bangsaen: { lat: 13.3611, lon: 100.9847, name: 'บางแสน' },
  }

  // Check for location keywords
  for (const [keyword, location] of Object.entries(locationMap)) {
    if (lowerText.includes(keyword)) {
      return location
    }
  }

  // Try to parse coordinates (lat,lon format)
  const coordMatch = text.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/)
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1])
    const lon = parseFloat(coordMatch[2])
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon, name: `${lat.toFixed(2)}, ${lon.toFixed(2)}` }
    }
  }

  return null
}

/**
 * Format tide data for LINE message with comprehensive information
 */
function formatTideMessage(
  location: LocationData,
  tideData: unknown,
  weatherData: unknown
): string {
  const tide = tideData as {
    highTideTime?: string
    lowTideTime?: string
    currentWaterLevel?: number
    waterLevelStatus?: string
    tideStatus?: string
    lunarPhaseKham?: number
    isWaxingMoon?: boolean
    nearestPierName?: string
    nearestPierDistance?: number
    nearestPierRegion?: string
    tideEvents?: Array<{ time: string; level: number; type: string }>
  }

  const weather = weatherData as {
    main?: { temp?: number; humidity?: number }
    weather?: Array<{ description?: string }>
    wind?: { speed?: number }
    name?: string
  }

  let message = `🌊 SEAPALO - สรุปข้อมูล\n\n`
  message += `📍 ${location.name}\n`
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`

  // Tide times - brief
  message += `🌊 น้ำขึ้น-น้ำลง\n`
  if (tide.highTideTime && tide.highTideTime !== 'N/A') {
    message += `📈 ขึ้น: ${tide.highTideTime}\n`
  }
  if (tide.lowTideTime && tide.lowTideTime !== 'N/A') {
    message += `📉 ลง: ${tide.lowTideTime}\n`
  }

  // Quick weather
  if (weather && weather.main) {
    message += `\n🌡️ ${weather.main.temp?.toFixed(0)}°C`
    if (weather.main.humidity !== undefined) {
      message += ` | 💨 ${weather.main.humidity}%`
    }
    if (weather.weather?.[0]?.description) {
      message += ` | ${weather.weather[0].description}`
    }
    message += `\n`
  }

  // Lunar phase - brief
  if (tide.tideStatus) {
    message += `\n🌙 ${tide.tideStatus}`
    if (tide.lunarPhaseKham && tide.isWaxingMoon !== undefined) {
      const phase = tide.isWaxingMoon ? 'ขึ้น' : 'แรม'
      message += ` (${tide.lunarPhaseKham} ${phase})`
    }
    message += `\n`
  }

  // Nearest pier - brief
  if (tide.nearestPierName) {
    message += `\n⚓ ${tide.nearestPierName}`
    if (tide.nearestPierRegion) {
      message += ` (${tide.nearestPierRegion})`
    }
    if (tide.nearestPierDistance !== undefined) {
      message += ` • ${tide.nearestPierDistance.toFixed(1)}km`
    }
    message += `\n`
  }

  // Link to website for detailed data
  message += `\n━━━━━━━━━━━━━━━━━━━━\n`
  message += `👉 ดูข้อมูลละเอียด:\n`
  message += `https://seapalo.app?lat=${location.lat}&lon=${location.lon}\n\n`
  message += `⏰ ${new Date().toLocaleTimeString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour: '2-digit',
    minute: '2-digit',
  })}`

  return message
}

/**
 * Handle incoming LINE message
 */
export async function handleLineMessage(
  userId: string,
  messageText: string,
  replyToken: string
) {
  try {
    const text = messageText.trim()

    // Help command
    if (text === 'help' || text === 'ช่วยเหลือ' || text === '?' || text === 'สวัสดี') {
      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `🌊 SEAPALO - พยากรณ์น้ำขึ้นลง

สวัสดีครับ! �
ฉันสามารถบอกข้อมูลน้ำขึ้นน้ำลง สภาพอากาศ และท่าเรือใกล้เคียงให้คุณได้

�📍 วิธีใช้งาน:
━━━━━━━━━━━━━━━
1️⃣ พิมพ์ชื่อสถานที่
   • ภูเก็ต
   • พัทยา  
   • กรุงเทพ
   • สมุย

2️⃣ พิมพ์พิกัด
   • 13.7563, 100.5018
   • 7.8804, 98.3923

3️⃣ คำสั่งพิเศษ
   • help - แสดงคำแนะนำ
   • สถานที่ - ดูรายการสถานที่

🗺️ สถานที่ยอดนิยม:
━━━━━━━━━━━━━━━
• กรุงเทพมหานคร (กทม)
• ภูเก็ต (Phuket)
• เกาะสมุย (Samui)  
• พัทยา (Pattaya)
• หัวหิน (Hua Hin)
• กระบี่ (Krabi)
• เกาะช้าง (Koh Chang)
• บางแสน (Bangsaen)

📊 ข้อมูลที่จะได้รับ:
━━━━━━━━━━━━━━━
🌊 เวลาน้ำขึ้น-น้ำลง
💧 ระดับน้ำปัจจุบัน
🌙 สถานะน้ำเป็น/น้ำตาย
☁️ สภาพอากาศ (อุณหภูมิ, ลม, ความชื้น)
⚓ ท่าเรือใกล้ที่สุด + ระยะทาง

⏱️ ข้อมูลอัปเดตทุก 2 ชั่วโมง

ลองเลย! พิมพ์ชื่อสถานที่ที่ต้องการ 🏖️`,
        },
      ])
      return
    }

    // Locations list command
    if (text === 'สถานที่' || text === 'รายการ' || text === 'ตำแหน่ง') {
      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `📍 รายการสถานที่ทั้งหมด

🏖️ ภาคกลาง & ตะวันออก:
• กรุงเทพมหานคร (กทม)
• พัทยา (Pattaya)
• บางแสน (Bangsaen)
• เกาะช้าง (Koh Chang)

🌴 ภาคใต้ฝั่งอ่าวไทย:
• หัวหิน (Hua Hin)
• เกาะสมุย (Samui)

🏝️ ภาคใต้ฝั่งอันดามัน:
• ภูเก็ต (Phuket)
• กระบี่ (Krabi)

💡 เคล็ดลับ:
• สามารถพิมพ์ทั้งภาษาไทยและอังกฤษ
• พิมพ์พิกัดโดยตรงได้ (lat, lon)
• พิมพ์ "help" เพื่อดูวิธีใช้

เลือกสถานที่ที่ต้องการได้เลย! �`,
        },
      ])
      return
    }

    // Try to parse location
    const location = parseLocation(text)

    if (!location) {
      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `❌ ไม่พบสถานที่ "${text}"

ลองใหม่ด้วยวิธีนี้:

📍 ชื่อสถานที่:
• ภูเก็ต
• พัทยา
• กรุงเทพ

🗺️ พิกัด:
• 13.7563, 100.5018

💡 คำแนะนำ:
• พิมพ์ "สถานที่" - ดูรายการทั้งหมด
• พิมพ์ "help" - ดูวิธีใช้งาน

ลองใหม่ได้เลยครับ! 😊`,
        },
      ])
      return
    }

    // Fetch forecast data
    console.log(`Fetching forecast for ${location.name}...`)
    const result = await getLocationForecast(location)

    if (!result.tideData) {
      await replyMessage(replyToken, [
        {
          type: 'text',
          text: `❌ ขออภัย ไม่สามารถดึงข้อมูลได้

สถานที่: ${location.name}

🔄 กรุณาลองใหม่:
• รอสักครู่แล้วลองอีกครั้ง
• ตรวจสอบชื่อสถานที่
• ลองพิกัดอื่น

💡 ต้องการความช่วยเหลือ?
พิมพ์ "help" ได้เลยครับ`,
        },
      ])
      return
    }

    // Format and send tide data
    const message = formatTideMessage(location, result.tideData, result.weatherData)
    await replyMessage(replyToken, [
      {
        type: 'text',
        text: message,
      },
    ])

    console.log(`Sent tide forecast to user ${userId}`)
  } catch (error) {
    console.error('Error handling LINE message:', error)
    await replyMessage(replyToken, [
      {
        type: 'text',
        text: `❌ เกิดข้อผิดพลาดระหว่างประมวลผล

🔄 กรุณา:
• ลองใหม่อีกครั้ง
• ตรวจสอบคำสั่ง
• พิมพ์ "help" เพื่อดูวิธีใช้

ขออภัยในความไม่สะดวก 🙏`,
      },
    ])
  }
}

/**
 * Send scheduled tide update to user
 */
export async function sendScheduledUpdate(userId: string, location: LocationData) {
  try {
    const result = await getLocationForecast(location)

    if (!result.tideData) {
      console.error(`Failed to fetch forecast for scheduled update: ${location.name}`)
      return
    }

    const message = `⏰ อัปเดตตามกำหนด\n\n${formatTideMessage(location, result.tideData, result.weatherData)}`

    await pushMessage(userId, [
      {
        type: 'text',
        text: message,
      },
    ])

    console.log(`Sent scheduled update to user ${userId}`)
  } catch (error) {
    console.error('Error sending scheduled update:', error)
  }
}
