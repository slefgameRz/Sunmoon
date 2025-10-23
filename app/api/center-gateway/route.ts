import { NextResponse } from "next/server"

// Compact frame schema for low-bandwidth transport (short keys)
// k: kind, t: timestamp, p: payload
// Example: { k: "u", t: 1690000000000, p: { wl: 1.23, ws: "ขึ้น" } }
type CompactFrame = {
  k: "u" | "s" // u=update, s=status
  t: number
  p: Record<string, unknown>
}

// In-memory queue for demo purposes. Replace with Redis/RabbitMQ in production.
const queue: CompactFrame[] = []

export async function GET() {
  // Return latest status in compact form; do not flood payload
  const latest = queue.length ? queue[queue.length - 1] : { k: "s", t: Date.now(), p: { ok: 1 } }
  return NextResponse.json(latest, { status: 200 })
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    // Basic validation and compaction enforcement
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "bad_request" }, { status: 400 })
    }
    const frame: CompactFrame = {
      k: data.k === "u" || data.k === "s" ? data.k : "u",
      t: typeof data.t === "number" ? data.t : Date.now(),
      p: typeof data.p === "object" && data.p !== null ? data.p : {},
    }
    // Keep queue bounded
    queue.push(frame)
    if (queue.length > 100) queue.shift()
    return NextResponse.json({ ok: 1 }, { status: 202 })
  } catch (error) {
    console.error("Center gateway payload error:", error)
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }
}

