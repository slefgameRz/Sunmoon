import type { PredictionOptions, PredictionPoint, PredictionResult, TilePayload } from "../types"

/**
 * Lightweight harmonic synthesis in TypeScript as a temporary fallback while
 * the WASM engine is under construction.
 */
export function runFallbackPrediction(tile: TilePayload, options: PredictionOptions): PredictionResult {
  const start = new Date(options.startTimeUtc).getTime()
  const end = new Date(options.endTimeUtc).getTime()
  const stepMs = options.stepMinutes * 60 * 1000

  if (!Number.isFinite(start) || !Number.isFinite(end) || stepMs <= 0) {
    throw new Error("Invalid prediction range")
  }

  const points: PredictionPoint[] = []
  const flags: string[] = []

  if (!tile.constituents.length) {
    flags.push("missing_constituents")
  }

  for (let t = start; t <= end; t += stepMs) {
    const level = synthesizeLevel(tile, t)
    const point: PredictionPoint = {
      timestamp: new Date(t).toISOString(),
      level: convertUnit(level, options.unit),
    }
    points.push(point)
  }

  if (options.includeSlope) {
    annotateSlope(points, stepMs)
  }

  if (options.includeConfidence) {
    applyConfidenceBand(points)
  }

  return {
    tileId: options.tileId,
    points,
    datum: options.datum,
    unit: options.unit,
    source: "fallback",
    generatedAt: new Date().toISOString(),
    flags,
  }
}

function synthesizeLevel(tile: TilePayload, timestamp: number): number {
  if (!tile.constituents.length) {
    // Equilibrium fallback: simple lunar/solar constituent approximation.
    const hours = timestamp / (1000 * 60 * 60)
    return 0.5 * Math.sin((2 * Math.PI * hours) / 12.42)
  }

  const hoursFromEpoch = timestamp / (1000 * 60 * 60)

  let sum = 0
  for (const constituent of tile.constituents) {
    const omega = (constituent.speedDegHr * Math.PI) / 180
    const phase = (constituent.phaseDeg * Math.PI) / 180
    sum += constituent.amplitudeM * Math.cos(omega * hoursFromEpoch + phase)
  }

  return sum
}

function annotateSlope(points: PredictionPoint[], stepMs: number) {
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const slope = (curr.level - prev.level) / (stepMs / (1000 * 60))
    curr.slope = slope
  }
  if (points.length) {
    points[0].slope = points[1]?.slope ?? 0
  }
}

function applyConfidenceBand(points: PredictionPoint[]) {
  const baseUncertainty = 0.1 // meters placeholder
  for (const point of points) {
    point.lower = point.level - baseUncertainty
    point.upper = point.level + baseUncertainty
  }
}

function convertUnit(value: number, unit: PredictionOptions["unit"]): number {
  if (unit === "m") return Number.parseFloat(value.toFixed(3))
  return Number.parseFloat((value * 3.28084).toFixed(3))
}
