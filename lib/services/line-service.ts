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

// In-memory cache for user's last selected location
// In production, this should be stored in a database
const userLocationCache = new Map<string, LocationData>()

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

// Weather emoji mapping helper
function getWeatherEmoji(condition: string | undefined): string {
  if (!condition) return '🌡️'
  
  const emojiMap: Record<string, string> = {
    'Rain': '🌧️',
    'Drizzle': '🌦️',
    'Thunderstorm': '⛈️',
    'Snow': '🌨️',
    'Clear': '☀️',
    'Clouds': '☁️',
    'Mist': '🌫️',
    'Fog': '🌫️'
  }
  
  return emojiMap[condition] || '🌡️'
}

// Format weather data for display
function formatWeatherData(weatherData: Record<string, unknown>) {
  if (!weatherData?.main || typeof weatherData.main !== 'object') {
    return {
      temp: 'ไม่ทราบ',
      feelsLike: '',
      wind: 'ไม่ทราบ',
      windGust: null,
      humidity: 'ไม่ทราบ',
      description: 'ไม่มีข้อมูล',
      emoji: '🌡️'
    }
  }

  const main = weatherData.main as Record<string, number>
  const wind = (weatherData.wind || {}) as Record<string, number>
  
  return {
    temp: typeof main.temp === 'number' ? Math.round(main.temp).toString() : 'ไม่ทราบ',
    feelsLike: typeof main.feels_like === 'number' ? ` (รู้สึก ${Math.round(main.feels_like)}°C)` : '',
    wind: typeof wind.speed === 'number' ? (wind.speed * 10 / 10).toString() : 'ไม่ทราบ',
    windGust: typeof wind.gust === 'number' ? (wind.gust * 10 / 10).toString() : null,
    humidity: typeof main.humidity === 'number' ? main.humidity.toString() : 'ไม่ทราบ',
    description: Array.isArray(weatherData.weather) ? (weatherData.weather as Array<{main?: string}>)[0]?.main || 'ปกติ' : 'ปกติ',
    emoji: getWeatherEmoji((weatherData.weather as Array<{main?: string}>)?.[0]?.main)
  }
}

// Validate weather data exists and is complete
function validateWeatherData(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  
  const weather = data as Record<string, unknown>
  // Check if we have at least the main temperature data
  return !!(weather.main && 
          typeof weather.main === 'object' && 
          'temp' in (weather.main as object))
}

// Handle weather API errors gracefully
export function handleWeatherError(error: unknown): Record<string, unknown> {
  console.error('⚠️ Weather data unavailable:', error)
  return {
    main: { temp: null, feels_like: null, humidity: null },
    weather: [{ main: 'ไม่สามารถดึงข้อมูลได้' }],
    wind: { speed: null, gust: null }
  }
}

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
  source?: {
    userId?: string
  }
}

/**
 * Get user ID from event
 */
function getUserId(event: LineEvent): string | null {
  return event.source?.userId || null
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

    const userId = getUserId(event)

    if (event.message.type === 'text') {
      console.log('📝 Processing text message')
      await handleTextMessage(event, userId)
    } else if (event.message.type === 'location') {
      console.log('📍 Processing location message')
      await handleLocationMessage(event, userId)
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
async function handleTextMessage(event: LineEvent, userId: string | null): Promise<void> {
  const text = event.message?.text || ''
  let location = parseLocationFromText(text)

  // If no location found and we have a Rich Menu button click, use last location
  if (!location && userId && userLocationCache.has(userId)) {
    console.log('💾 Using cached location from Rich Menu')
    location = userLocationCache.get(userId) || null
  }

  if (!location) {
    await sendLineMessage(event.replyToken, [
      {
        type: 'text',
        text: '🌊 โปรดแจ้งสถานที่\n\n' +
              '━━━━━━━━━━━━━━━━━━\n' +
              '📍 จังหวัดที่รองรับ:\n\n' +
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

  // Save location to cache
  if (userId) {
    userLocationCache.set(userId, location)
    console.log(`💾 Saved location for user: ${location.name}`)
  }

  // Fetch compact forecast
  const forecastResult = await compactClient.fetchCompactForecast(
    location.lat,
    location.lon
  )

  if (forecastResult.error) {
    console.warn(`⚠️ Forecast error: ${forecastResult.error}`)
  }

  const message = formatForecastMessage(forecastResult.data, location)
  await sendLineMessage(event.replyToken, [message])
}

/**
 * Handle location messages with GPS coordinates
 */
async function handleLocationMessage(event: LineEvent, userId: string | null): Promise<void> {
  const msg = event.message
  if (!msg?.latitude || !msg?.longitude) return

  const location: LocationData = {
    lat: msg.latitude,
    lon: msg.longitude,
    name: msg.title || `📍 ${msg.latitude.toFixed(2)}°N ${msg.longitude.toFixed(2)}°E`
  }

  // Save location to cache
  if (userId) {
    userLocationCache.set(userId, location)
    console.log(`💾 Saved GPS location for user: ${location.name}`)
  }

  // Fetch compact forecast
  const forecastResult = await compactClient.fetchCompactForecast(
    location.lat,
    location.lon
  )

  if (forecastResult.error) {
    console.warn(`⚠️ Forecast error: ${forecastResult.error}`)
  }

  const message = formatForecastMessage(forecastResult.data, location)
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
export function formatForecastMessage(
  forecast: any,
  location: LocationData
): Record<string, unknown> {
  // Handle CompactFrame format (compact protocol)
  const isCompactFrame = forecast.type && forecast.tide !== undefined
  
  // Extract tide data
  let tideStatus: string = 'ไม่ทราบ'
  let currentHeight: number | null = null
  let pierDistance: number | null = null
  let nearestPierName: string | null = null
  let nextHighTide: { time: string; level: number } | null = null
  let nextLowTide: { time: string; level: number } | null = null
  
  if (isCompactFrame && forecast.tide) {
    // From CompactFrame
    const tideHeight = forecast.tide.h
    currentHeight = tideHeight
    tideStatus = forecast.tide.trend === 1 ? 'น้ำขึ้น' : forecast.tide.trend === 2 ? 'น้ำลง' : 'เสถียร'
    if (forecast.tide.ht_time !== undefined && forecast.tide.ht !== undefined) {
      nextHighTide = {
        time: new Date(Date.now() + forecast.tide.ht_time * 3600000).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
        level: forecast.tide.ht
      }
    }
  } else {
    // From traditional TideData format
    const tideDataLoc = (forecast.tideData as Record<string, unknown>) || {}
    tideStatus = (tideDataLoc.waterLevelStatus as string) || 'ไม่ทราบ'
    currentHeight = tideDataLoc.currentWaterLevel !== undefined
      ? (tideDataLoc.currentWaterLevel as number)
      : null
    pierDistance = tideDataLoc.pierDistance !== undefined
      ? (tideDataLoc.pierDistance as number)
      : null
    nearestPierName = (tideDataLoc.nearestPierName as string) || null
    
    // Extract next tide events
    const tideEvents = tideDataLoc.tideEvents as Array<{ time: string; type: string; level: number }> | undefined
    if (Array.isArray(tideEvents)) {
      for (const event of tideEvents) {
        if (event.type === 'high' && !nextHighTide) {
          nextHighTide = event
        }
        if (event.type === 'low' && !nextLowTide) {
          nextLowTide = event
        }
      }
    }
  }

  // Extract weather data
  let weatherData: Record<string, unknown> | undefined
  if (isCompactFrame && forecast.weather) {
    // Convert CompactFrame weather to standard format
    weatherData = {
      main: {
        temp: (forecast.weather.t || 0) + 10,
        feels_like: (forecast.weather.t || 0) + 10,
        humidity: forecast.weather.c || 0
      },
      weather: [{ main: 'Cloud' }],
      wind: {
        speed: (forecast.weather.w || 0) * 0.5,
        gust: (forecast.weather.w || 0) * 0.6
      }
    }
  } else {
    weatherData = (forecast.weatherData || {}) as Record<string, unknown> | undefined
  }

  if (!validateWeatherData(weatherData)) {
    console.warn('⚠️ Invalid weather data, using fallback')
    const fallbackWeather = handleWeatherError(new Error('Invalid weather format'))
    // Merge into a new safe object (do not mutate possibly-null source)
    weatherData = Object.assign({}, weatherData || {}, fallbackWeather)
  }

  const weather = formatWeatherData(weatherData || {})
  
  // Format display values
  const tideEmoji = tideStatus === 'น้ำขึ้น' ? '🔺' : '🔻'
  const tideLabel = tideStatus === 'น้ำขึ้น' ? 'น้ำขึ้น' : 'น้ำลง'
  const tempDisplay = weather.temp
  const feelsLikeDisplay = weather.feelsLike
  const windDisplay = weather.wind
  const windGustDisplay = weather.windGust
  const humidityDisplay = weather.humidity

  // Get weather emoji and condition text
  const weatherEmoji = weather.emoji
  const weatherText = weather.description

  // Build current water level info
  const heightInfo = typeof currentHeight === 'number' ? ` (${(currentHeight as number).toFixed(2)}ม.)` : ''

  // Build pier distance info
  const pierInfo = typeof pierDistance === 'number' 
    ? `📍 ท่าเรือ: ${pierDistance < 1000 ? `${pierDistance}ม.` : `${(pierDistance / 1000).toFixed(1)}กม.`}${nearestPierName ? ` (${nearestPierName})` : ''}`
    : ''

  // Build next tide forecast
  const tideForecast = []
  if (nextHighTide) {
    tideForecast.push(`⬆️ น้ำขึ้นสูง: ${nextHighTide.time} (${nextHighTide.level.toFixed(2)}ม.)`)
  }
  if (nextLowTide) {
    tideForecast.push(`⬇️ น้ำลงต่ำ: ${nextLowTide.time} (${nextLowTide.level.toFixed(2)}ม.)`)
  }
  const tideForecastText = tideForecast.length > 0 ? tideForecast.join('\n') : ''

  // Build feels like info
  const feelsLikeText = feelsLikeDisplay ? ` (รู้สึก ${feelsLikeDisplay}°C)` : ''

  // Build web link with coordinates
  const webUrl = `https://${process.env.VERCEL_URL || 'yourdomain.com'}/forecast?lat=${location.lat}&lon=${location.lon}&mode=full`

  // Build comprehensive message
  let messageText = `🌊 ${location.name}\n` +
                   `━━━━━━━━━━━━━━━━━━\n`

  // Current status section
  messageText += `${tideEmoji} ${tideLabel}${heightInfo}\n`

  // Weather section
  messageText += `${weatherEmoji} ${weatherText} | ${tempDisplay}°C${feelsLikeDisplay}\n` +
                 `💨 ${windDisplay}m/s${windGustDisplay ? ` (ต่อ ${windGustDisplay})` : ''} | 💧 ${humidityDisplay}%\n`

  messageText += `━━━━━━━━━━━━━━━━━━\n`

  // Pier distance if available
  if (pierInfo) {
    messageText += `${pierInfo}\n\n`
  }

  // Tide forecast if available
  if (tideForecastText) {
    messageText += `📅 พยากรณ์:\n${tideForecastText}\n\n`
  }

  // Web link and instructions
  messageText += `💡 ส่ง: ทำนายน้ำ [จังหวัด]\n` +
                 `📍 หรือแชร์ GPS`

  return {
    type: 'text',
    text: messageText
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
      text: '👋 สวัสดี! ยินดีต้อนรับ 🌊 SEAPALO\n\n' +
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
