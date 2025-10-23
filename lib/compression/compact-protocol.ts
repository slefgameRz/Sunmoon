/**
 * 🐟 Compact Protocol - ระบบบีบอัดข้อมูลสำหรับชาวประมงกลางทะเล
 * 
 * วัตถุประสงค์:
 * - ลดขนาดข้อมูลจาก ~2KB เหลือ ~200 bytes (90% compression)
 * - ใช้สัญญาณ 4G/LTE อ่อนได้
 * - รองรับการส่งข้อมูลแบบ Batch
 */

import type { TideData, WeatherData, LocationData } from "@/lib/tide-service"

/**
 * Compact Frame Format
 * 
 * Header (1 byte): [Version(3 bits) | Type(3 bits) | Flags(2 bits)]
 * 
 * Types:
 * - 0x0: Tide data only
 * - 0x1: Weather only
 * - 0x2: Tide + Weather
 * - 0x3: Alert (Tsunami/Storm)
 * - 0x4: Status ping
 * - 0x5: Batch data
 */

export interface CompactFrame {
  // Header info
  type: 'tide' | 'weather' | 'combined' | 'alert' | 'ping' | 'batch'
  timestamp: number // Unix timestamp in seconds (2 bytes)
  
  // Location (optional, if changed)
  loc?: {
    lat: number // float16 (1 byte)
    lon: number // float16 (1 byte)
  }
  
  // Tide data
  tide?: {
    h: number      // Current height (1 byte: 0-300cm encoded)
    trend: number  // 0=stable, 1=rising, 2=falling (1 bit)
    ht?: number    // High tide height (1 byte, optional)
    ht_time?: number // Hours until high tide (1 byte, optional)
  }
  
  // Weather data
  weather?: {
    t: number      // Temperature -10..50°C → 0..60 (1 byte)
    w: number      // Wind speed 0-20 m/s (1 byte)
    c: number      // Cloud coverage 0-100% (1 byte)
    wd: number     // Wind direction 0-359° (1 byte)
  }
  
  // Signal strength
  signal?: number // 0-5 bars
  
  // Battery level
  battery?: number // 0-100%
}

/**
 * Float16 Encoding (1 byte, 0-359°)
 * Compress longitude/latitude to 1 byte with 0.5° precision
 */
export function encodeFloat16(value: number, min: number, max: number): number {
  const normalized = (value - min) / (max - min)
  return Math.max(0, Math.min(255, Math.round(normalized * 255)))
}

export function decodeFloat16(encoded: number, min: number, max: number): number {
  const normalized = encoded / 255
  return min + normalized * (max - min)
}

/**
 * Encode Tide Height (0-300cm)
 */
export function encodeTideHeight(cm: number): number {
  return Math.max(0, Math.min(255, Math.round((cm + 50) / 1.4)))
}

export function decodeTideHeight(encoded: number): number {
  return encoded * 1.4 - 50
}

/**
 * Main Compression Function
 */
export function compressForecast(
  location: LocationData,
  tideData: TideData | null,
  weatherData: WeatherData | null,
  lastLocation?: LocationData,
): Uint8Array {
  const buffer: number[] = []
  
  // 1. Determine type and create header
  let typeCode = 0x4 // default: ping
  if (tideData && weatherData) typeCode = 0x2
  else if (tideData) typeCode = 0x0
  else if (weatherData) typeCode = 0x1
  
  const header = (0 << 6) | (typeCode << 3) | 0 // version=0, flags=0
  buffer.push(header)
  
  // 2. Timestamp (2 bytes, little-endian)
  const ts = Math.floor(Date.now() / 1000)
  buffer.push(ts & 0xFF, (ts >> 8) & 0xFF)
  
  // 3. Location (only if changed)
  const locChanged = !lastLocation || 
    Math.abs(location.lat - lastLocation.lat) > 0.01 ||
    Math.abs(location.lon - lastLocation.lon) > 0.01
  
  if (locChanged) {
    buffer.push(encodeFloat16(location.lat, 1, 20))    // Thailand latitude
    buffer.push(encodeFloat16(location.lon, 97, 106))  // Thailand longitude
  }
  
  // 4. Tide data
  if (tideData) {
    const height = tideData.currentHeight ?? 0
    buffer.push(encodeTideHeight(height))
    
    // Trend (1 bit)
    let trend = 0
    if (tideData.trend === 'rising') trend = 1
    else if (tideData.trend === 'falling') trend = 2
    buffer.push(trend)
    
    // High tide info (optional)
    if (tideData.highTide) {
      const htHeight = encodeTideHeight(tideData.highTide.height ?? 0)
      const htTime = Math.min(255, Math.floor((tideData.highTide.time?.getTime() ?? 0 - Date.now()) / 3600000))
      buffer.push(htHeight)
      buffer.push(Math.max(0, htTime))
    }
  }
  
  // 5. Weather data
  if (weatherData) {
    const temp = Math.round(weatherData.temperature ?? 25) + 10 // shift to 0-60
    const wind = Math.round(weatherData.windSpeed ?? 0)
    const cloud = Math.round(weatherData.cloudCoverage ?? 0)
    const windDir = Math.round(weatherData.windDirection ?? 0)
    
    buffer.push(Math.max(0, Math.min(255, temp)))
    buffer.push(Math.max(0, Math.min(255, wind)))
    buffer.push(Math.max(0, Math.min(255, cloud)))
    buffer.push(Math.max(0, Math.min(255, windDir)))
  }
  
  return new Uint8Array(buffer)
}

/**
 * Main Decompression Function
 */
export function decompressForecast(data: Uint8Array, lastLocation?: LocationData): CompactFrame {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  let offset = 0
  
  // 1. Parse header
  const header = view.getUint8(offset++)
  const version = (header >> 6) & 0x3
  const typeCode = (header >> 3) & 0x7
  const flags = header & 0x3
  
  const typeMap = ['tide', 'weather', 'combined', 'alert', 'ping', 'batch'] as const
  const type = typeMap[typeCode] ?? 'ping'
  
  // 2. Parse timestamp (little-endian)
  const ts = view.getUint8(offset++) | (view.getUint8(offset++) << 8)
  const timestamp = ts
  
  // 3. Location
  let loc: { lat: number; lon: number } | undefined
  const hasLocation = (flags & 0x1) !== 0
  if (hasLocation && offset + 1 < data.length) {
    const latEnc = view.getUint8(offset++)
    const lonEnc = view.getUint8(offset++)
    loc = {
      lat: decodeFloat16(latEnc, 1, 20),
      lon: decodeFloat16(lonEnc, 97, 106),
    }
  } else if (lastLocation) {
    loc = { lat: lastLocation.lat, lon: lastLocation.lon }
  }
  
  // 4. Tide data
  let tide: CompactFrame['tide'] | undefined
  if (typeCode === 0x0 || typeCode === 0x2) {
    const heightEnc = view.getUint8(offset++)
    const h = decodeTideHeight(heightEnc)
    const trend = view.getUint8(offset++)
    
    tide = { h, trend }
    
    // High tide info
    if (offset + 1 < data.length) {
      const htHeight = decodeTideHeight(view.getUint8(offset++))
      const htTime = view.getUint8(offset++)
      tide.ht = htHeight
      tide.ht_time = htTime
    }
  }
  
  // 5. Weather data
  let weather: CompactFrame['weather'] | undefined
  if (typeCode === 0x1 || typeCode === 0x2) {
    const t = (view.getUint8(offset++) ?? 25) - 10
    const w = view.getUint8(offset++) ?? 0
    const c = view.getUint8(offset++) ?? 0
    const wd = view.getUint8(offset++) ?? 0
    
    weather = { t, w, c, wd }
  }
  
  return {
    type,
    timestamp,
    loc,
    tide,
    weather,
  }
}

/**
 * Batch Compression - ส่งข้อมูลหลายจุดพร้อมกัน
 */
export function compressBatch(frames: Uint8Array[]): Uint8Array {
  const batches = [0x05 << 3] // Type: batch
  
  // Add count (1 byte)
  batches.push(Math.min(255, frames.length))
  
  // Add all frames
  for (const frame of frames) {
    batches.push(...Array.from(frame))
  }
  
  return new Uint8Array(batches)
}

/**
 * Signal Strength Optimization
 * ขึ้นอยู่กับสัญญาณ ปรับขนาดข้อมูล
 */
export function selectCompressionLevel(signalStrength: number): 'minimal' | 'compact' | 'full' {
  // 0-2 bars: minimal data only
  // 2-4 bars: compact format
  // 4-5 bars: full data
  
  if (signalStrength <= 2) return 'minimal'
  if (signalStrength <= 4) return 'compact'
  return 'full'
}

/**
 * ขนาดข้อมูลประมาณ:
 * - Original: ~2000 bytes
 * - Compressed: ~40-80 bytes (98% compression)
 * 
 * เวลาส่ง LTE ที่ 1 Mbps:
 * - Original: 16 ms
 * - Compressed: 0.3 ms
 */
export function estimateCompressionStats(original: any, compressed: Uint8Array): {
  originalSize: number
  compressedSize: number
  ratio: number
  estimatedTimeMs: number
} {
  const originalSize = JSON.stringify(original).length
  const compressedSize = compressed.byteLength
  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1)
  
  // Assume 1 Mbps connection
  const estimatedTimeMs = (compressedSize * 8) / 1_000_000 * 1000
  
  return {
    originalSize,
    compressedSize,
    ratio: parseFloat(ratio),
    estimatedTimeMs,
  }
}
