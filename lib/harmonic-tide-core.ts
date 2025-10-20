/**
 * Harmonic Tide Computation Core
 * Based on harmonic constituents + astronomical arguments + nodal corrections
 * 
 * References:
 * - Schureman, P. (1958). Manual of Harmonic Analysis and Prediction of Tides.
 * - Foreman, M. G. G. (1977). Manual for Tidal Heights Analysis and Prediction.
 */

import { calculateAstronomicalArguments, type AstronomicalArguments } from './ephemerides'
export { calculateAstronomicalArguments } from './ephemerides'

// Constituent definitions (37+ major constituents)
export interface TideConstituent {
  name: string
  speed: number // degrees per hour
  amplitude: number // meters
  phase: number // degrees (phase lag)
  description: string
}

// Nodal corrections
interface NodalCorrection {
  f: number // nodal factor (amplitude correction)
  u: number // nodal angle (phase correction) in degrees
}

/**
 * Major tide constituents with their speeds (degrees/hour)
 * Sorted by importance and grouped by type
 */
export const CONSTITUENTS_DATABASE: Record<string, { speed: number; doodson: number[]; description: string }> = {
  // Semi-diurnal (Principal lunar)
  M2: { speed: 28.9841042, doodson: [2, 0, 0, 0, 0, 0], description: 'Principal lunar semidiurnal' },
  S2: { speed: 30.0000000, doodson: [2, 2, -2, 0, 0, 0], description: 'Principal solar semidiurnal' },
  N2: { speed: 28.4397295, doodson: [2, -1, 0, 1, 0, 0], description: 'Larger lunar elliptic semidiurnal' },
  K2: { speed: 30.0821373, doodson: [2, 2, 0, 0, 0, 0], description: 'Lunisolar semidiurnal' },
  
  // Diurnal (Principal)
  K1: { speed: 15.0410686, doodson: [1, 1, 0, 0, 0, 0], description: 'Lunisolar diurnal' },
  O1: { speed: 13.9430356, doodson: [1, -1, 0, 0, 0, 0], description: 'Principal lunar diurnal' },
  P1: { speed: 14.9589314, doodson: [1, 1, -2, 0, 0, 0], description: 'Principal solar diurnal' },
  Q1: { speed: 13.3986609, doodson: [1, -2, 0, 1, 0, 0], description: 'Larger lunar elliptic diurnal' },
  
  // Semi-diurnal (Minor)
  NU2: { speed: 28.5125831, doodson: [2, -1, 2, -1, 0, 0], description: 'Larger lunar evectional' },
  MU2: { speed: 27.9682084, doodson: [2, -2, 2, 0, 0, 0], description: 'Variational' },
  '2N2': { speed: 27.8953548, doodson: [2, -2, 0, 2, 0, 0], description: 'Lunar elliptical semidiurnal second-order' },
  LAMBDA2: { speed: 29.4556253, doodson: [2, 1, -2, 1, 0, 0], description: 'Smaller lunar evectional' },
  L2: { speed: 29.5284789, doodson: [2, 1, 0, -1, 0, 0], description: 'Smaller lunar elliptic' },
  T2: { speed: 29.9589333, doodson: [2, 2, -3, 0, 0, 1], description: 'Larger solar elliptic' },
  
  // Diurnal (Minor)
  J1: { speed: 15.5854433, doodson: [1, 2, 0, -1, 0, 0], description: 'Smaller lunar elliptic diurnal' },
  M1: { speed: 14.4966939, doodson: [1, 0, 0, 0, 0, 0], description: 'Smaller lunar elliptic diurnal' },
  OO1: { speed: 16.1391017, doodson: [1, 3, 0, 0, 0, 0], description: 'Lunar diurnal' },
  
  // Long period
  MM: { speed: 0.5443747, doodson: [0, 1, 0, -1, 0, 0], description: 'Lunar monthly' },
  MF: { speed: 1.0980331, doodson: [0, 2, 0, 0, 0, 0], description: 'Lunisolar fortnightly' },
  SSA: { speed: 0.0821373, doodson: [0, 0, 2, 0, 0, 0], description: 'Solar semiannual' },
  SA: { speed: 0.0410686, doodson: [0, 0, 1, 0, 0, -1], description: 'Solar annual' },
  
  // Shallow water constituents (non-linear)
  M4: { speed: 57.9682084, doodson: [4, 0, 0, 0, 0, 0], description: 'Shallow water overtide of M2' },
  MS4: { speed: 58.9841042, doodson: [2, 2, -2, 0, 0, 0], description: 'Shallow water quarter diurnal' },
  MN4: { speed: 57.4238337, doodson: [4, -1, 0, 1, 0, 0], description: 'Shallow water quarter diurnal' },
  M6: { speed: 86.9523127, doodson: [6, 0, 0, 0, 0, 0], description: 'Shallow water overtide of M2' },
  '2MS6': { speed: 87.9682084, doodson: [6, 2, -2, 0, 0, 0], description: 'Shallow water overtide' },
  '2MK6': { speed: 88.9523127, doodson: [6, 0, 2, 0, 0, 0], description: 'Shallow water overtide' },
  
  // Additional constituents
  MSF: { speed: 1.0158958, doodson: [0, 2, -2, 0, 0, 0], description: 'Lunisolar synodic fortnightly' },
  '2Q1': { speed: 12.8542862, doodson: [1, -3, 0, 2, 0, 0], description: 'Larger elliptic diurnal' },
  SIGMA1: { speed: 12.9271398, doodson: [1, -3, 2, 0, 0, 0], description: 'Lunar diurnal' },
  RHO1: { speed: 13.4715145, doodson: [1, -2, 2, -1, 0, 0], description: 'Larger lunar evectional diurnal' },
  
  // Third-order constituents
  M8: { speed: 115.9364169, doodson: [8, 0, 0, 0, 0, 0], description: 'Shallow water eighth diurnal' },
  M3: { speed: 43.4761563, doodson: [3, 0, 0, 0, 0, 0], description: 'Lunar terdiurnal' },
}

/**
 * Calculate nodal corrections for a constituent
 */
export function calculateNodalCorrections(
  constituentName: string,
  date: Date
): NodalCorrection {
  const args = calculateAstronomicalArguments(date)
  const N = args.N * Math.PI / 180 // Convert to radians

  // Simplified nodal corrections (f and u) for major constituents
  // Based on Schureman (1958) formulas
  
  let f = 1.0
  let u = 0.0

  switch (constituentName) {
    case 'M2':
      f = 1.0 - 0.037 * Math.cos(N)
      u = -2.1 * Math.sin(N)
      break
    case 'S2':
      f = 1.0 // Solar constituents have no nodal correction
      u = 0.0
      break
    case 'N2':
      f = 1.0 - 0.037 * Math.cos(N)
      u = -2.1 * Math.sin(N)
      break
    case 'K2':
      f = 1.0 + 0.286 * Math.cos(N)
      u = -17.7 * Math.sin(N)
      break
    case 'K1':
      f = 1.0 + 0.115 * Math.cos(N)
      u = -8.9 * Math.sin(N)
      break
    case 'O1':
      f = 1.0 + 0.189 * Math.cos(N)
      u = 10.8 * Math.sin(N)
      break
    case 'P1':
      f = 1.0
      u = 0.0
      break
    case 'Q1':
      f = 1.0 + 0.189 * Math.cos(N)
      u = 10.8 * Math.sin(N)
      break
    // Add more constituents as needed
    default:
      // For constituents without specific corrections
      f = 1.0
      u = 0.0
  }

  return { f, u }
}

/**
 * Predict tide level at a specific time using harmonic constituents
 */
export function predictTideLevel(
  date: Date,
  constituents: TideConstituent[],
  longitude: number = 0 // in degrees
): number {
  const args = calculateAstronomicalArguments(date, longitude)
  const hoursFromEpoch = (date.getTime() - new Date('2000-01-01T00:00:00Z').getTime()) / (1000 * 3600)
  
  let level = 0.0

  for (const constituent of constituents) {
    const nodal = calculateNodalCorrections(constituent.name, date)
    
    // Calculate equilibrium argument
    const V = calculateEquilibriumArgument(constituent.name, args, hoursFromEpoch)
    
    // Harmonic formula: H * f * cos(V + u - phase)
    const angle = (V + nodal.u - constituent.phase) * Math.PI / 180
    const amplitude = constituent.amplitude * nodal.f
    
    level += amplitude * Math.cos(angle)
  }

  return level
}

/**
 * Calculate equilibrium argument (V) for a constituent
 */
function calculateEquilibriumArgument(
  constituentName: string,
  args: AstronomicalArguments,
  hoursFromEpoch: number
): number {
  const constituent = CONSTITUENTS_DATABASE[constituentName]
  if (!constituent) return 0

  // V = speed * t + V0
  // where V0 is calculated from Doodson numbers and astronomical arguments
  const speed = constituent.speed
  const doodson = constituent.doodson

  // Simplified: V = speed * hours
  // In full implementation, add V0 from Doodson numbers
  let V = speed * hoursFromEpoch

  // Add Doodson components (simplified)
  V += doodson[0] * args.tau
  V += doodson[1] * args.s
  V += doodson[2] * args.h
  V += doodson[3] * args.p
  V += doodson[4] * args.N
  V += doodson[5] * args.pp

  return normalizeAngle(V)
}

/**
 * Find high and low tides in a time series
 */
export interface TideExtreme {
  time: Date
  level: number
  type: 'high' | 'low'
}

export function findHighLowTides(
  startDate: Date,
  endDate: Date,
  constituents: TideConstituent[],
  stepMinutes: number = 10,
  longitude: number = 0
): TideExtreme[] {
  const extremes: TideExtreme[] = []
  const stepMs = stepMinutes * 60 * 1000

  let prevLevel: number | null = null
  let prevSlope: number | null = null

  for (let t = startDate.getTime(); t <= endDate.getTime(); t += stepMs) {
    const date = new Date(t)
    const level = predictTideLevel(date, constituents, longitude)

    if (prevLevel !== null) {
      const slope = level - prevLevel

      // Detect zero crossing (change in slope direction)
      if (prevSlope !== null && Math.sign(slope) !== Math.sign(prevSlope)) {
        const type = prevSlope > 0 ? 'high' : 'low'
        extremes.push({
          time: new Date(t - stepMs),
          level: prevLevel,
          type
        })
      }

      prevSlope = slope
    }

    prevLevel = level
  }

  return extremes
}

// Helper functions

function normalizeAngle(degrees: number): number {
  let angle = degrees % 360
  if (angle < 0) angle += 360
  return angle
}

/**
 * Create a prediction time series
 */
export interface TidePrediction {
  time: Date
  level: number
  slope: number // rate of change (m/hour)
}

export function createPredictionSeries(
  startDate: Date,
  endDate: Date,
  constituents: TideConstituent[],
  stepMinutes: number = 10,
  longitude: number = 0
): TidePrediction[] {
  const series: TidePrediction[] = []
  const stepMs = stepMinutes * 60 * 1000

  let prevLevel: number | null = null

  for (let t = startDate.getTime(); t <= endDate.getTime(); t += stepMs) {
    const date = new Date(t)
    const level = predictTideLevel(date, constituents, longitude)

    let slope = 0
    if (prevLevel !== null) {
      slope = (level - prevLevel) / (stepMinutes / 60) // m/hour
    }

    series.push({ time: date, level, slope })
    prevLevel = level
  }

  return series
}
