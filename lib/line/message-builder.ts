import type { ForecastResult } from "@/lib/services/forecast"
import type { LocationData } from "@/lib/tide-service"
import type { LineMessage } from "./types"

const LINE_MAX_TEXT_LENGTH = 5000

export function buildWeatherMessages(
  location: LocationData,
  forecast: ForecastResult,
  options: { generatedAt?: Date } = {},
): LineMessage[] {
  const generatedAt = options.generatedAt ?? new Date()
  const header = `🌤️ อัปเดตสภาพอากาศ & ระดับน้ำ – ${location.name}`
  const timestamp = generatedAt.toLocaleString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  })

  const lines: string[] = [header, `⏱ เวลาอัปเดต: ${timestamp}`]

  if (forecast.weatherData) {
    const weather = forecast.weatherData
    const description = weather.weather?.[0]?.description ?? "ไม่ทราบ"
    const windSpeed = weather.wind?.speed ?? 0
    lines.push(
      "",
      "🌡️ สภาพอากาศ",
      `• อุณหภูมิ ${weather.main?.temp?.toFixed?.(1) ?? "-"}°C (รู้สึก ${weather.main?.feels_like?.toFixed?.(1) ?? "-"}°C)`,
      `• ความชื้น ${weather.main?.humidity ?? "-"}% | ความกดอากาศ ${weather.main?.pressure ?? "-"} hPa`,
      `• ลม ${windSpeed.toFixed(1)} m/s – ${description}`,
    )
  } else {
    lines.push("", "🌡️ สภาพอากาศ", "• ข้อมูลยังไม่พร้อม")
  }

  if (forecast.tideData) {
    const tide = forecast.tideData
    const events = Array.isArray(tide.tideEvents) ? tide.tideEvents : []
    const nextHigh = events.find((event) => event.type === "high")
    const nextLow = events.find((event) => event.type === "low")

    lines.push(
      "",
      "🌊 ระดับน้ำ",
      `• ระดับล่าสุด ${Number.isFinite(tide.currentWaterLevel) ? tide.currentWaterLevel.toFixed(2) : "-"} เมตร (${tide.waterLevelStatus ?? "ไม่ทราบ"})`,
      `• สถานะน้ำ: ${tide.tideStatus ?? "-"} | ค่ำที่ ${tide.lunarPhaseKham ?? "-"}`,
      nextHigh ? `• น้ำขึ้นถัดไป ${nextHigh.time} (${nextHigh.level.toFixed(2)} ม.)` : "• น้ำขึ้นถัดไป: ไม่พบ",
      nextLow ? `• น้ำลงถัดไป ${nextLow.time} (${nextLow.level.toFixed(2)} ม.)` : "• น้ำลงถัดไป: ไม่พบ",
    )
  } else {
    lines.push("", "🌊 ระดับน้ำ", "• ข้อมูลยังไม่พร้อม")
  }

  if (forecast.error) {
    lines.push("", `⚠️ หมายเหตุ: ${forecast.error}`)
  }

  const text = clampText(lines.join("\n"))
  const messages: LineMessage[] = [{ type: "text", text }]

  const tip = "💡 ระบบจะส่งอัปเดตทุก 2 ชั่วโมง หรือสั่งทันทีได้ที่แดชบอร์ด Sunmoon"
  messages.push({ type: "text", text: tip })

  return messages
}

function clampText(text: string): string {
  if (text.length <= LINE_MAX_TEXT_LENGTH) {
    return text
  }
  return `${text.slice(0, LINE_MAX_TEXT_LENGTH - 1)}…`
}
