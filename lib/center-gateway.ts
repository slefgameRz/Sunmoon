/**
 * Center Gateway: Digital <-> Analog interface
 *
 * This module defines a compact frame format for data transmission
 * over various channels including web, API, and future hardware interfaces.
 *
 * Features:
 * - Compact payload format for efficient data transfer
 * - JSON-based encoding for compatibility
 * - Extensible for future FEC and checksum implementations
 */

export type CompactFrame = {
  k: "u" | "s" // u = update, s = status
  t: number // epoch ms
  p: Record<string, unknown> // compact payload (e.g., { wl: 1.23, ws: "ขึ้น" })
}

export type TideCompactPayload = {
  // wl: water level, ws: water status (ขึ้น/ลง/นิ่ง), ht: high tide HH:MM, lt: low tide HH:MM
  wl?: number
  ws?: string
  ht?: string
  lt?: string
}

/**
 * Compress a verbose app object into a compact payload suitable for low-bandwidth links.
 */
export function compressTidePayload(input: {
  currentWaterLevel?: number
  waterLevelStatus?: string
  highTideTime?: string
  lowTideTime?: string
}): TideCompactPayload {
  return {
    wl: typeof input.currentWaterLevel === "number" ? Number.parseFloat(input.currentWaterLevel.toFixed(2)) : undefined,
    ws: input.waterLevelStatus,
    ht: input.highTideTime,
    lt: input.lowTideTime,
  }
}

/**
 * Expand a compact payload to app shape. Keep types narrow.
 */
export function expandTidePayload(compact: TideCompactPayload) {
  return {
    currentWaterLevel: typeof compact.wl === "number" ? compact.wl : 0,
    waterLevelStatus: typeof compact.ws === "string" ? compact.ws : "ไม่ทราบ",
    highTideTime: typeof compact.ht === "string" ? compact.ht : "N/A",
    lowTideTime: typeof compact.lt === "string" ? compact.lt : "N/A",
  }
}

/**
 * Encode a compact frame to bytes for transmission.
 * Uses JSON encoding for broad compatibility.
 */
export function encodeFrameToBytes(frame: CompactFrame): Uint8Array {
  const json = JSON.stringify(frame)
  const e = new TextEncoder()
  return e.encode(json)
}

/**
 * Decode bytes back to a compact frame with validation.
 */
export function decodeBytesToFrame(bytes: Uint8Array): CompactFrame | null {
  try {
    const d = new TextDecoder()
    const obj = JSON.parse(d.decode(bytes))
    if (obj && (obj.k === "u" || obj.k === "s") && typeof obj.t === "number" && typeof obj.p === "object") {
      return obj as CompactFrame
    }
    return null
  } catch {
    return null
  }
}

