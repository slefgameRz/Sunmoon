export type DatumCode = "MSL" | "MLLW" | "LAT" | string
export type UnitCode = "m" | "ft"

export interface TileManifest {
  version: string
  issuedAt: string
  validUntil?: string
  ephemerides: {
    id: string
    deltaTSource: string
    leapSecondsVersion: string
  }
  tiles: TileMeta[]
  signature: string
}

export interface TileMeta {
  tileId: string
  model: string
  datum: DatumCode
  bbox: [number, number, number, number]
  centroid: { lat: number; lon: number }
  tzHint: string
  updatedAt: string
  version: string
  checksum: string
  sizeCompressed: number
  deltaAvailable?: boolean
}

export interface Constituent {
  code: string
  amplitudeM: number
  phaseDeg: number
  speedDegHr: number
}

export interface MinorRule {
  target: string
  formula: "inference" | "ratio"
  coefficients: number[]
  references: string[]
  phaseOffsetDeg: number
}

export interface LocalCalibration {
  locationId: string
  heightOffsetM?: number
  phaseOffsetDeg?: number
  validFrom?: string
  validTo?: string
  source: string
}

export interface DatumTransform {
  from: DatumCode
  to: DatumCode
  offsetM: number
  uncertaintyM: number
}

export interface ModelStats {
  rmseHigh: number
  rmseLow: number
  maeHigh: number
  maeLow: number
  skillScore: number
  sampleSpanDays: number
}

export interface TilePayload {
  tileId: string
  constituents: Constituent[]
  minorRules?: MinorRule[]
  localCalibration?: LocalCalibration[]
  datumTransforms?: DatumTransform[]
  stats?: ModelStats
}

export interface PredictionOptions {
  tileId: string
  stepMinutes: number
  startTimeUtc: string
  endTimeUtc: string
  datum: DatumCode
  unit: UnitCode
  includeConfidence: boolean
  includeSlope: boolean
  featureFlags?: Record<string, boolean>
}

export interface PredictionPoint {
  timestamp: string
  level: number
  slope?: number
  lower?: number
  upper?: number
}

export interface PredictionResult {
  tileId: string
  points: PredictionPoint[]
  datum: DatumCode
  unit: UnitCode
  source: "wasm" | "fallback" | "equilibrium"
  generatedAt: string
  flags: string[]
}

export interface OfflineStatus {
  cachedTiles: number
  lastUpdated?: string
  manifestVersion?: string
}
