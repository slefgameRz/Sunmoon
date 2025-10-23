/**
 * Data compression and optimization utilities for SEAPALO
 * Reduces payload size while maintaining accuracy for emergency communications
 */
import type {
  ApiStatus,
  LocationData,
  TideData,
  TideEvent,
  WaterLevelGraphData,
  WeatherData,
} from './tide-service'

export interface CompressedTideData {
  v: number // version
  t: number // timestamp
  l: number // current water level (compressed)
  h: number // high tide time (minutes from midnight)
  o: number // low tide time (minutes from midnight)
  H: number // high tide level (compressed)
  O: number // low tide level (compressed)
  p: number // lunar phase (0-29)
  s: number // tide status (0=น้ำเป็น, 1=น้ำตาย)
  w: number // waxing moon (0=false, 1=true)
  e: number[] // tide events (compressed)
  g: number[] // graph data (compressed)
  a: number // api status (0=success, 1=error, 2=loading)
}

export interface CompressedWeatherData {
  v: number // version
  t: number // timestamp
  temp: number // temperature (compressed)
  feels: number // feels like (compressed)
  hum: number // humidity
  pres: number // pressure (compressed)
  ws: number // wind speed (compressed)
  wd: number // wind direction
  desc: string // weather description
  icon: string // weather icon
}

export interface CompressedLocationData {
  lat: number // latitude (compressed)
  lon: number // longitude (compressed)
  name: string // location name
}

type TideDataSnapshot = Pick<
  TideData,
  | 'currentWaterLevel'
  | 'highTideTime'
  | 'lowTideTime'
  | 'tideEvents'
  | 'lunarPhaseKham'
  | 'tideStatus'
  | 'isWaxingMoon'
  | 'graphData'
  | 'apiStatus'
  | 'lastUpdated'
>

type WeatherDataSnapshot = WeatherData

type LocationDataSnapshot = LocationData

export type EmergencyPacketPayload = {
  emergency: 'flood' | 'storm' | 'tsunami' | 'general'
  timestamp: number
  tide: CompressedTideData
  weather: CompressedWeatherData
  location: CompressedLocationData
}

export type EmergencyPacket = {
  compressed: {
    tide: CompressedTideData
    weather: CompressedWeatherData
    location: CompressedLocationData
  }
  analog: AnalogSignal[]
  checksum: string
  payload: EmergencyPacketPayload
}

/**
 * Compress tide data for transmission
 */
export function compressTideData(data: TideDataSnapshot): CompressedTideData {
  return {
    v: 1, // version
    t: Math.floor(Date.now() / 1000), // timestamp in seconds
    l: Math.round(data.currentWaterLevel * 100), // compress to 2 decimal places
    h: timeToMinutes(data.highTideTime),
    o: timeToMinutes(data.lowTideTime),
    H: Math.round((data.tideEvents?.find((event) => event.type === 'high')?.level ?? 0) * 100),
    O: Math.round((data.tideEvents?.find((event) => event.type === 'low')?.level ?? 0) * 100),
    p: Math.round(data.lunarPhaseKham),
    s: data.tideStatus === "น้ำเป็น" ? 0 : 1,
    w: data.isWaxingMoon ? 1 : 0,
    e: compressTideEvents(data.tideEvents || []),
    g: compressGraphData(data.graphData || []),
    a: data.apiStatus === "success" ? 0 : data.apiStatus === "error" ? 1 : 2
  }
}

/**
 * Decompress tide data
 */
export function decompressTideData(data: CompressedTideData): TideDataSnapshot {
  const apiStatus: ApiStatus = data.a === 0 ? 'success' : data.a === 1 ? 'error' : 'loading'

  return {
    currentWaterLevel: data.l / 100,
    highTideTime: minutesToTime(data.h),
    lowTideTime: minutesToTime(data.o),
    tideEvents: decompressTideEvents(data.e),
    lunarPhaseKham: data.p,
    tideStatus: data.s === 0 ? 'น้ำเป็น' : 'น้ำตาย',
    isWaxingMoon: data.w === 1,
    graphData: decompressGraphData(data.g),
    apiStatus,
    lastUpdated: new Date(data.t * 1000).toISOString(),
  }
}

/**
 * Compress weather data
 */
export function compressWeatherData(data: WeatherDataSnapshot): CompressedWeatherData {
  return {
    v: 1,
    t: Math.floor(Date.now() / 1000),
    temp: Math.round(data.main.temp * 10), // compress to 1 decimal place
    feels: Math.round(data.main.feels_like * 10),
    hum: data.main.humidity,
    pres: Math.round(data.main.pressure),
    ws: Math.round(data.wind.speed * 10),
    wd: Math.round(data.wind.deg || 0),
    desc: data.weather?.[0]?.description || "",
    icon: data.weather?.[0]?.icon || ""
  }
}

/**
 * Decompress weather data
 */
export function decompressWeatherData(data: CompressedWeatherData): WeatherDataSnapshot {
  return {
    main: {
      temp: data.temp / 10,
      feels_like: data.feels / 10,
      humidity: data.hum,
      pressure: data.pres
    },
    wind: {
      speed: data.ws / 10,
      deg: data.wd
    },
    weather: [{
      description: data.desc,
      icon: data.icon
    }],
    name: ''
  }
}

/**
 * Compress location data
 */
export function compressLocationData(data: LocationDataSnapshot): CompressedLocationData {
  return {
    lat: Math.round(data.lat * 1000000), // compress to 6 decimal places
    lon: Math.round(data.lon * 1000000),
    name: data.name
  }
}

/**
 * Decompress location data
 */
export function decompressLocationData(data: CompressedLocationData): LocationDataSnapshot {
  return {
    lat: data.lat / 1000000,
    lon: data.lon / 1000000,
    name: data.name
  }
}

/**
 * Convert time string (HH:MM) to minutes from midnight
 */
function timeToMinutes(timeStr: string): number {
  if (!timeStr || timeStr === "--:--") return 0
  const [hours, minutes] = timeStr.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * Convert minutes from midnight to time string (HH:MM)
 */
function minutesToTime(minutes: number): string {
  if (minutes === 0) return "--:--"
  const hours = Math.floor(minutes / 60) % 24
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Compress tide events array
 */
function compressTideEvents(events: TideEvent[]): number[] {
  return events.flatMap((event) => [
    timeToMinutes(event.time),
    Math.round(event.level * 100),
    event.type === "high" ? 1 : 0
  ])
}

/**
 * Decompress tide events array
 */
function decompressTideEvents(compressed: number[]): TideEvent[] {
  const events: TideEvent[] = []
  for (let i = 0; i < compressed.length; i += 3) {
    events.push({
      time: minutesToTime(compressed[i]),
      level: compressed[i + 1] / 100,
      type: compressed[i + 2] === 1 ? "high" : "low"
    })
  }
  return events
}

/**
 * Compress graph data (reduce precision for transmission)
 */
function compressGraphData(data: WaterLevelGraphData[]): number[] {
  // Sample every 10th point and compress values
  return data
    .filter((_, index) => index % 10 === 0)
    .flatMap(point => [
      timeToMinutes(point.time),
      Math.round(point.level * 100)
    ])
}

/**
 * Decompress graph data (interpolate missing points)
 */
function decompressGraphData(compressed: number[]): WaterLevelGraphData[] {
  const data: WaterLevelGraphData[] = []
  for (let i = 0; i < compressed.length; i += 2) {
    data.push({
      time: minutesToTime(compressed[i]),
      level: compressed[i + 1] / 100,
      prediction: true
    })
  }
  return data
}

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(original: unknown, compressed: unknown): number {
  const originalSize = JSON.stringify(original).length
  const compressedSize = JSON.stringify(compressed).length
  return ((originalSize - compressedSize) / originalSize) * 100
}

/**
 * Emergency communication protocol - convert data to analog signals
 */
export interface AnalogSignal {
  frequency: number // Hz
  amplitude: number // 0-1
  duration: number // seconds
  pattern: number[] // Morse-like pattern
}

/**
 * Convert compressed data to analog signals for emergency transmission
 */
export function dataToAnalogSignals(data: CompressedTideData | CompressedWeatherData): AnalogSignal[] {
  const jsonStr = JSON.stringify(data)
  const signals: AnalogSignal[] = []

  // Convert each character to frequency/amplitude pattern
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr.charCodeAt(i)
    signals.push({
      frequency: 1000 + (char * 10), // Base 1kHz + char code
      amplitude: (char % 256) / 255, // Normalize to 0-1
      duration: 0.1, // 100ms per character
      pattern: charToMorsePattern(jsonStr[i])
    })
  }

  return signals
}

/**
 * Convert analog signals back to digital data
 */
export function analogSignalsToData(signals: AnalogSignal[]): string {
  let result = ''

  for (const signal of signals) {
    // Decode frequency to character
    const charCode = Math.round((signal.frequency - 1000) / 10)
    result += String.fromCharCode(charCode)
  }

  return result
}

/**
 * Convert character to Morse code pattern
 */
function charToMorsePattern(char: string): number[] {
  const morseCode: { [key: string]: number[] } = {
    '0': [1, 1, 1, 1, 1], // -----
    '1': [0, 1, 1, 1, 1], // .----
    '2': [0, 0, 1, 1, 1], // ..---
    '3': [0, 0, 0, 1, 1], // ...--
    '4': [0, 0, 0, 0, 1], // ....-
    '5': [0, 0, 0, 0, 0], // .....
    '6': [1, 0, 0, 0, 0], // -....
    '7': [1, 1, 0, 0, 0], // --...
    '8': [1, 1, 1, 0, 0], // ---..
    '9': [1, 1, 1, 1, 0], // ----.
    '{': [1, 0, 1, 0, 1], // -.-
    '}': [1, 0, 1, 0, 1], // -.-
    '[': [1, 0, 1, 0, 1], // -.-
    ']': [1, 0, 1, 0, 1], // -.-
    ':': [1, 1, 1, 0, 0], // ---
    ',': [1, 1, 0, 0, 1], // --.-
    '"': [0, 1, 1, 0, 1], // .-..
    '.': [0, 1], // .
    '-': [1], // -
    ' ': [0, 0, 0] // / (word separator)
  }

  return morseCode[char.toLowerCase()] || [0] // Default to dot for unknown chars
}

/**
 * Emergency broadcast system - create emergency data packet
 */
export function createEmergencyPacket(
  tideData: TideDataSnapshot,
  weatherData: WeatherDataSnapshot,
  locationData: LocationDataSnapshot,
  emergencyType: 'flood' | 'storm' | 'tsunami' | 'general'
): EmergencyPacket {
  const compressedTide = compressTideData(tideData)
  const compressedWeather = compressWeatherData(weatherData)
  const compressedLocation = compressLocationData(locationData)

  const packetData: EmergencyPacketPayload = {
    emergency: emergencyType,
    timestamp: Date.now(),
    tide: compressedTide,
    weather: compressedWeather,
    location: compressedLocation
  }

  const jsonStr = JSON.stringify(packetData)
  const checksum = simpleHash(jsonStr)

  return {
    compressed: {
      tide: compressedTide,
      weather: compressedWeather,
      location: compressedLocation
    },
    analog: dataToAnalogSignals(compressedTide), // Use tide data as primary signal
    checksum,
    payload: packetData,
  }
}

/**
 * Simple hash function for checksum
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}