/**
 * 🤖 LINE Message Handler Service
 * 
 * Handles all incoming LINE webhook messages
 * - Text messages (location extraction)
 * - Location messages (GPS coordinates)
 * - Follow events (welcome message)
 */

import { mkdir, appendFile } from 'node:fs/promises'
import path from 'node:path'

import { compactClient } from '@/lib/compression/compact-client'
import type { LocationData } from '@/lib/tide-service'

function resolveLineApiBaseUrl(): string {
  const raw = process.env.LINE_API_BASE_URL?.trim()
  if (!raw) return 'https://api.line.me'

  try {
    const url = new URL(raw)
    if (url.hostname === 'api.line.biz') {
      console.warn('[LINE] LINE_API_BASE_URL uses deprecated api.line.biz, switching to api.line.me')
      url.hostname = 'api.line.me'
      return url.toString().replace(/\/+$/, '')
    }
    return url.toString().replace(/\/+$/, '')
  } catch {
    console.warn('[LINE] Invalid LINE_API_BASE_URL value, falling back to https://api.line.me')
    return 'https://api.line.me'
  }
}

const LINE_API_BASE_URL = resolveLineApiBaseUrl()

async function logOfflineReply(payload: { replyToken: string; messages: Record<string, unknown>[] }) {
  const fallbackPath =
    process.env.LINE_OFFLINE_LOG_PATH || path.join(process.cwd(), '.next', 'logs', 'line-offline-replies.log')
  const directory = path.dirname(fallbackPath)

  try {
    await mkdir(directory, { recursive: true })
    const line = `${new Date().toISOString()} ${JSON.stringify(payload)}\n`
    await appendFile(fallbackPath, line, 'utf8')
    console.log(`[LINE] Offline reply recorded at ${fallbackPath}`)
  } catch (error) {
    console.warn('[LINE] Failed to record offline reply log:', error)
  }
}

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

  // Eastern Thailand
  'ชลบุรี': { lat: 13.361, lon: 100.984, name: 'ชลบุรี' },
  'ระนอง': { lat: 9.969, lon: 98.629, name: 'ระนอง' },
  'บันฉุง': { lat: 11.933, lon: 100.073, name: 'บันฉุง' },
  'กำแพงแสน': { lat: 13.202, lon: 99.981, name: 'กำแพงแสน' },
  'เพชรบุรี': { lat: 12.831, lon: 99.787, name: 'เพชรบุรี' },
  'ประจวบคีรีขันธ์': { lat: 11.811, lon: 99.807, name: 'ประจวบคีรีขันธ์' },

  // Alternative names
  'เกาะสมุย': { lat: 8.6391, lon: 100.3348, name: 'เกาะสมุย' },
  'ภูมิพล': { lat: 17.3, lon: 104.6, name: 'ภูมิพล' },
  'ทะเบียน': { lat: 14.8, lon: 104.1, name: 'ทะเบียน' },
  
  // Common spelling variations
  'ชลบุรีศรีราชา': { lat: 13.361, lon: 100.984, name: 'ชลบุรี' },
  'ระยองมาบแจ': { lat: 6.8495, lon: 101.9674, name: 'ระยอง' },
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
    if (!event.message) {
      console.log('⚠️ No message in event')
      return
    }

    if (event.message.type === 'text') {
      console.log('📝 Processing text message')
      await handleTextMessage(event)
    } else if (event.message.type === 'location') {
      console.log('📍 Processing location message')
      await handleLocationMessage(event)
    } else {
      console.log(`⚠️ Unsupported message type: ${event.message.type}`)
    }
  } catch (error) {
    console.error('❌ Error handling LINE message:', error)
    try {
      await sendLineMessage(event.replyToken, [
        {
          type: 'text',
          text: '⚠️ ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
        }
      ])
    } catch (sendError) {
      console.error('❌ Failed to send error message:', sendError)
    }
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
        text: '🌊 ไม่พบจังหวัดที่ระบุ\n\n' +
              '━━━━━━━━━━━━━━━━━━\n' +
              '📍 จังหวัยที่รองรับ:\n\n' +
              '🔵 ภาคใต้:\n' +
              'ภูเก็ต • ระยอง • หาดใหญ่\n' +
              'สตูล • ชุมพร • กระบี่\n' +
              'สงขลา • พังงา • ตรัง\n\n' +
              '🔵 ภาคตะวันออก:\n' +
              'ชลบุรี • ระนอง • บันฉุง\n' +
              'กำแพงแสน • เพชรบุรี • ประจวบฯ\n\n' +
              '🔵 เกาะและอื่นๆ:\n' +
              'เกาะสมุย • ชลบุรีศรีราชา\n\n' +
              '━━━━━━━━━━━━━━━━━━\n' +
              '💡 ลองใหม่: ทำนายน้ำ ชลบุรี\n' +
              '📍 หรือแชร์ตำแหน่ง GPS'
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
 * Format forecast as LINE message (Brief Summary Mode)
 * Shows only essential info for quick mobile viewing
 * Users tap link to see detailed data on web
 */
function formatForecastMessage(
  forecast: Record<string, unknown>,
  location: LocationData
): Record<string, unknown> {
  const tideStatus =
    (forecast.tideData as Record<string, unknown>)?.waterLevelStatus ||
    'ไม่ทราบ'
  const currentHeight =
    (forecast.tideData as Record<string, unknown>)?.currentWaterLevel !== undefined
      ? (forecast.tideData as Record<string, unknown>).currentWaterLevel
      : null
  
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
    ((forecast.weatherData as Record<string, unknown>).main as Record<string, number>)?.humidity
      ? ((forecast.weatherData as Record<string, unknown>).main as Record<string, number>).humidity
      : null
  const description =
    (forecast.weatherData as Record<string, unknown>)?.weather &&
    Array.isArray((forecast.weatherData as Record<string, unknown>).weather)
      ? ((forecast.weatherData as Record<string, unknown>).weather as Array<{ main: string }>)[0]?.main
      : null

  // Improved format with better data display
  const tideEmoji = tideStatus === 'น้ำขึ้น' ? '🔺' : '🔻'
  const tideLabel = tideStatus === 'น้ำขึ้น' ? 'น้ำขึ้น' : 'น้ำลง'
  const tempDisplay = typeof temp === 'number' ? Math.round(temp) : '?'
  const windDisplay = typeof windSpeed === 'number' ? Math.round(windSpeed * 10) / 10 : '?'
  const humidityDisplay = typeof humidity === 'number' ? humidity : '?'

  // Get weather emoji based on description
  const weatherEmoji = description
    ? description.includes('Rain') || description.includes('rain')
      ? '🌧️'
      : description.includes('Cloud') || description.includes('cloud')
        ? '☁️'
        : description.includes('Clear') || description.includes('Sunny')
          ? '☀️'
          : '🌡️'
    : '🌡️'

  // Build height info if available
  const heightInfo = typeof currentHeight === 'number' ? ` (${(currentHeight as number).toFixed(2)}ม.)` : ''
  
  // Build web link with coordinates
  const webUrl = `https://${process.env.VERCEL_URL || 'yourdomain.com'}/forecast?lat=${location.lat}&lon=${location.lon}&mode=full`

  // Improved message format
  return {
    type: 'text',
    text: `🌊 ${location.name}\n` +
          `━━━━━━━━━━━━━━━━\n` +
          `${tideEmoji} ${tideLabel}${heightInfo}\n` +
          `${weatherEmoji} ${tempDisplay}°C | 💨 ${windDisplay}m/s | 💧 ${humidityDisplay}%\n` +
          `━━━━━━━━━━━━━━━━\n` +
          `📊 ข้อมูลเต็ม: ${webUrl}\n\n` +
          `💡 ส่ง: ทำนายน้ำ [จังหวัด]\n` +
          `📍 หรือแชร์ GPS`
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

  try {
    console.log(`📤 Sending ${messages.length} message(s) to LINE`)
    
    const messageArray = Array.isArray(messages) ? messages : [messages]

    const response = await fetch(`${LINE_API_BASE_URL}/v2/bot/message/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        replyToken,
        messages: messageArray
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ LINE API error:', error)
      throw new Error(`LINE API error: ${response.statusText}`)
    }
    
    console.log('✅ Message sent successfully')
  } catch (error) {
    console.error('❌ Send message failed:', error)
    // In development, log but don't crash
    if (process.env.NODE_ENV !== 'production') {
      await logOfflineReply({ replyToken, messages })
      console.warn('⚠️ Warning: Message send failed, storing offline log instead.')
    } else {
      throw error
    }
  }
}

/**
 * Send welcome message on follow
 */
export async function sendWelcomeMessage(replyToken: string): Promise<void> {
  await sendLineMessage(replyToken, [
    {
      type: 'text',
      text: '👋 สวัสดี! ยินดีต้อนรับ 🌊 Sunmoon\n\n' +
            '━━━━━━━━━━━━━━━━━━\n' +
            '⚡ การใช้งาน:\n' +
            '📝 ทำนายน้ำ [จังหวัด]\n' +
            '   เช่น: ทำนายน้ำ ชลบุรี\n\n' +
            '📍 แชร์ GPS\n' +
            '   ระบบจะหาพื้นที่ให้อัตโนมัติ\n\n' +
            '🔗 ดูข้อมูลเต็มได้บนเว็บ\n' +
            '━━━━━━━━━━━━━━━━━━\n\n' +
            '🎯 ระดับน้ำ • อุณหภูมิ • ลมและความชื้น\n' +
            '💡 สำหรับชาวประมง ณ ทะเล'
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

  const response = await fetch(`${LINE_API_BASE_URL}/v2/bot/message/push`, {
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

  const response = await fetch(`${LINE_API_BASE_URL}/v2/bot/message/broadcast`, {
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
