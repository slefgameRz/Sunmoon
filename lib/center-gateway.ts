/**
 * Center Gateway: Digital <-> Analog interface (architecture stub)
 *
 * This module defines a compact frame format and placeholder encode/decode
 * functions that a hardware/telephony adapter can use to bridge data over
 * analog channels (e.g., PSTN/voice radio using AFSK/DTMF).
 *
 * Notes:
 * - Keep frames tiny; prefer short keys and integer codes.
 * - Use forward error correction (FEC) and checksum when implementing for real.
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
 * Placeholder: encode a compact frame to tone bytes (for AFSK/DTMF transmitter).
 * In production, use a robust modem library and add CRC/FEC.
 */
export function encodeFrameToBytes(frame: CompactFrame): Uint8Array {
  const json = JSON.stringify(frame)
  const e = new TextEncoder()
  return e.encode(json)
}

/**
 * Placeholder: decode tone bytes back to a compact frame.
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

