import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { calculateLunarPhase } from '@/lib/tide-service'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const dateParam = url.searchParams.get('date') || undefined
    const date = dateParam ? new Date(dateParam) : new Date()

    const result = calculateLunarPhase(date)
    return NextResponse.json({ date: date.toISOString(), ...result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
