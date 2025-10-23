/**
 * 🤖 LINE Message Handler Service
 * 
 * Handles all incoming LINE webhook messages
 * - Text messages (location extraction)
 * - Location messages (GPS coordinates)
 * - Follow events (welcome message)
 */

import { compactClient } from '@/lib/compression/compact-client'
import type { LocationData } from '@/lib/tide-service'

// Thai locations mapping
const LOCATION_MAP: Record<string, LocationData> = {
  // Southern Thailand - Main Fishing Areas
  'ภูเก็ต': { lat: 8.627, lon: 98.398, name: 'ภูเก็ต' },
  'ระยอง': { lat: 6.8495, lon: 101.9674, name: 'ระยอง' },
  'หาดใหญ่': { lat: 7.1973, lon: 100.4734, name: 'หาดใหญ่' },
  'สตูล': { lat: 6.6288, lon: 100.0742, name: 'สตูล' },
  'ชุมพร': { lat: 8.6682, lon: 99.1807, name: 'ชุมพร' },
  'กระบี่': { lat: 8.627, lon: 98.814, name: 'กระบี่' },
  'สงขลา': { lat: 7.1906, lon: 100.6087, name: 'สงขลา' },
  'พังงา': { lat: 8.4304, lon: 98.5298, name: 'พังงา' },
  'ตรัง': { lat: 7.5589, lon: 99.6259, name: 'ตรัง' },
  'สตูล': { lat: 6.6288, lon: 100.0742, name: 'สตูล' },

  // Alternative names
  'เกาะสมุย': { lat: 8.6391, lon: 100.3348, name: 'เกาะสมุย' },
  'ภูมิพล': { lat: 17.3, lon: 104.6, name: 'ภูมิพล' },
  'ทะเบียน': { lat: 14.8, lon: 104.1, name: 'ทะเบียน' },
}

interface LineEvent {
  type: string
  message?: {
    type: string
    text?: string
    latitude?: number
    longitude?: number
    title?: string
  }
  replyToken: string
}

/**
 * Main message handler
 */
export async function handleLineMessage(event: LineEvent): Promise<void> {
  try {
    if (!event.message) return

    if (event.message.type === 'text') {
      await handleTextMessage(event)
    } else if (event.message.type === 'location') {
      await handleLocationMessage(event)
    }
  } catch (error) {
    console.error('Error handling LINE message:', error)
    await sendLineMessage(event.replyToken, [
      {
        type: 'text',
        text: '⚠️ ขออภัยค่ะ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      }
    ])
  }
}

/**
 * Handle text messages with location extraction
 */
async function handleTextMessage(event: LineEvent): Promise<void> {
  const text = event.message?.text || ''
  const location = parseLocationFromText(text)

  if (!location) {
    await sendLineMessage(event.replyToken, [
      {
        type: 'text',
        text: '📍 กรุณาระบุจังหวัด เช่น:\n' +
              '• ทำนายน้ำ ภูเก็ต\n' +
              '• สภาอากาศ ระยอง\n' +
              '• ข้อมูล หาดใหญ่\n\n' +
              'หรือแชร์📍 ตำแหน่ง GPS'
      }
    ])
    return
  }

  // Fetch compact forecast
  const forecast = await compactClient.fetchCompactForecast(
    location.lat,
    location.lon
  )

  const message = formatForecastMessage(forecast, location)
  await sendLineMessage(event.replyToken, [message])
}

/**
 * Handle location messages with GPS coordinates
 */
async function handleLocationMessage(event: LineEvent): Promise<void> {
  const msg = event.message
  if (!msg?.latitude || !msg?.longitude) return

  const location: LocationData = {
    lat: msg.latitude,
    lon: msg.longitude,
    name: msg.title || `📍 ${msg.latitude.toFixed(2)}°N ${msg.longitude.toFixed(2)}°E`
  }

  // Fetch compact forecast
  const forecast = await compactClient.fetchCompactForecast(
    location.lat,
    location.lon
  )

  const message = formatForecastMessage(forecast, location)
  await sendLineMessage(event.replyToken, [message])
}

/**
 * Parse location from Thai text
 */
function parseLocationFromText(text: string): LocationData | null {
  const cleanText = text.toLowerCase().trim()

  // Try exact match first
  for (const [name, location] of Object.entries(LOCATION_MAP)) {
    if (cleanText.includes(name.toLowerCase())) {
      return location
    }
  }

  // Try pattern: "ทำนายน้ำ ..." or "สภาอากาศ ..."
  const parts = text.split(/\s+/)
  if (parts.length >= 2) {
    const place = parts[parts.length - 1]
    const location = LOCATION_MAP[place]
    if (location) return location
  }

  return null
}

/**
 * Format forecast as LINE message
 */
function formatForecastMessage(
  forecast: Record<string, unknown>,
  location: LocationData
): Record<string, unknown> {
  const tideStatus =
    (forecast.tideData as Record<string, unknown>)?.waterLevelStatus ||
    'ไม่ทราบ'
  const temp =
    (forecast.weatherData as Record<string, unknown>)?.main &&
    ((forecast.weatherData as Record<string, unknown>).main as Record<string, number>)
      ?.temp !== undefined
      ? ((forecast.weatherData as Record<string, unknown>).main as Record<string, number>).temp
      : 'ไม่ทราบ'
  const windSpeed =
    (forecast.weatherData as Record<string, unknown>)?.wind &&
    ((forecast.weatherData as Record<string, unknown>).wind as Record<string, number>)?.speed
      ? ((forecast.weatherData as Record<string, unknown>).wind as Record<string, number>).speed
      : 'ไม่ทราบ'
  const humidity =
    (forecast.weatherData as Record<string, unknown>)?.main &&
    ((forecast.weatherData as Record<string, unknown>).main as Record<string, number>)
      ?.humidity !== undefined
      ? ((forecast.weatherData as Record<string, unknown>).main as Record<string, number>)
          .humidity
      : 'ไม่ทราบ'

  // Emoji based on status
  const tideEmoji = tideStatus === 'น้ำขึ้น' ? '⬆️' : '⬇️'
  const tempNumber = typeof temp === 'number' ? temp : 25
  const tempEmoji = tempNumber > 30 ? '🔥' : tempNumber > 20 ? '🌤️' : '❄️'

  return {
    type: 'text',
    text: `🌊 ข้อมูลสภาอากาศ\n\n` +
          `📍 ${location.name}\n` +
          `────────────\n` +
          `${tideEmoji} น้ำ: ${tideStatus}\n` +
          `${tempEmoji} อุณหภูมิ: ${temp}°C\n` +
          `💨 ลม: ${windSpeed} m/s\n` +
          `💧 ความชื้น: ${humidity}%\n` +
          `────────────\n` +
          `🕐 อัปเดท: ${new Date().toLocaleTimeString('th-TH')}\n\n` +
          `📌 ส่งจังหวัดอื่นหรือแชร์📍 GPS`
  }
}

/**
 * Send message to LINE user
 */
export async function sendLineMessage(
  replyToken: string,
  messages: Record<string, unknown>[]
): Promise<void> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured')
  }

  const response = await fetch('https://api.line.biz/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      replyToken,
      messages: Array.isArray(messages) ? messages : [messages]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('LINE API error:', error)
    throw new Error(`LINE API error: ${response.statusText}`)
  }
}

/**
 * Send welcome message on follow
 */
export async function sendWelcomeMessage(replyToken: string): Promise<void> {
  await sendLineMessage(replyToken, [
    {
      type: 'text',
      text: '👋 สวัสดีครับ! ยินดีต้อนรับเข้าสู่ 🌊 Sunmoon\n\n' +
            'เราให้ข้อมูลน้ำและสภาอากาศแบบ Real-time ' +
            'สำหรับชาวประมงทั่วไทย\n\n' +
            '📍 วิธีใช้:\n' +
            '1️⃣ ส่งชื่อจังหวัด เช่น "ภูเก็ต"\n' +
            '2️⃣ หรือแชร์📍 GPS ตำแหน่งของคุณ\n\n' +
            '⚡ ข้อมูลจะมาในไม่กี่วินาที!'
    }
  ])
}

/**
 * Push message to user (not reply)
 */
export async function pushLineMessage(
  userId: string,
  messages: Record<string, unknown>[]
): Promise<void> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured')
  }

  const response = await fetch('https://api.line.biz/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      to: userId,
      messages: Array.isArray(messages) ? messages : [messages]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('LINE API error:', error)
    throw new Error(`LINE API error: ${response.statusText}`)
  }
}

/**
 * Send notification message to multiple users
 */
export async function broadcastLineMessage(
  messages: Record<string, unknown>[]
): Promise<void> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN is not configured')
  }

  const response = await fetch('https://api.line.biz/v2/bot/message/broadcast', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      messages: Array.isArray(messages) ? messages : [messages]
    })
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('LINE API broadcast error:', error)
    throw new Error(`LINE API error: ${response.statusText}`)
  }
}
