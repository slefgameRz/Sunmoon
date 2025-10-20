# Tidal Constituents Implementation

## Overview
Complete implementation of **37 tidal constituents** with precise nodal corrections for Thailand waters (Gulf of Thailand and Andaman Sea).

## Constituent Categories

### Semidiurnal (12+ hours period)
| Code | Name | Speed (°/hr) | Doodson | Description |
|------|------|--------------|---------|-------------|
| M2 | Principal Lunar | 28.9841042 | 255.555 | Main lunar tide (moon twice daily) |
| S2 | Principal Solar | 30.0 | 273.555 | Main solar tide (sun twice daily) |
| N2 | Larger Lunar Elliptic | 28.4397295 | 245.655 | Moon's elliptic orbit variation |
| K2 | Lunisolar | 30.0821373 | 275.555 | Combined sun-moon semidiurnal |
| 2N2 | Lunar Elliptic | 27.8953548 | 235.755 | Second-order lunar elliptic |
| NU2 | Larger Lunar Evectional | 28.5125831 | 247.455 | Evection (lunar orbital anomaly) |
| L2 | Smaller Lunar Elliptic | 29.5284789 | 265.455 | Lunar distance variation |
| T2 | Larger Solar Elliptic | 29.9589333 | 272.556 | Solar perigee variation |
| LAMBDA2 | Smaller Lunar Elliptic | 29.4556253 | 263.655 | Lunar longitude variation |
| MU2 | Variational | 27.9682084 | 257.555 | Solar-lunar interaction |
| EPS2 | Lunar Elliptical Minor | 28.3230090 | 253.755 | Minor elliptical component |

### Diurnal (24+ hours period)
| Code | Name | Speed (°/hr) | Doodson | Description |
|------|------|--------------|---------|-------------|
| K1 | Lunisolar Diurnal | 15.0410686 | 165.555 | Combined sun-moon daily (DOMINANT in Gulf) |
| O1 | Principal Lunar Diurnal | 13.9430356 | 145.555 | Main lunar daily tide (DOMINANT in Gulf) |
| P1 | Principal Solar Diurnal | 14.9589314 | 163.555 | Main solar daily tide |
| Q1 | Larger Lunar Elliptic | 13.3986609 | 135.655 | Lunar elliptic daily |
| 2Q1 | Smaller Lunar Elliptic | 12.8542862 | 137.455 | Second lunar elliptic daily |
| RHO1 | Larger Lunar Evectional | 13.4715145 | 155.455 | Evection daily |
| J1 | Smaller Lunar Elliptic | 15.5854433 | 175.455 | Lunar distance daily |
| OO1 | Lunar Diurnal | 16.1391017 | 185.555 | Lunar anomalistic daily |
| S1 | Solar Diurnal | 15.0 | 164.556 | Solar daily |

### Long Period (> 24 hours)
| Code | Name | Speed (°/hr) | Doodson | Description |
|------|------|--------------|---------|-------------|
| Mf | Lunar Fortnightly | 1.0980331 | 075.555 | ~14 day cycle (moon phases) |
| Mm | Lunar Monthly | 0.5443747 | 065.455 | ~27.3 day cycle (perigee/apogee) |
| Sa | Solar Annual | 0.0410686 | 056.554 | Yearly sun cycle |
| Ssa | Solar Semiannual | 0.0821373 | 057.555 | 6-month cycle |
| MSf | Lunisolar Synodic Fortnightly | 1.0158958 | 073.555 | Combined moon-sun fortnightly |
| MFM | Lunisolar Fortnightly | 1.0980331 | 085.455 | Lunar fortnightly variant |

### Shallow Water (Overtides & Compounds)
These arise from non-linear effects in shallow coastal waters:

| Code | Name | Speed (°/hr) | Doodson | Description |
|------|------|--------------|---------|-------------|
| M4 | Quarter-diurnal | 57.9682084 | 4×M2 | Overtide of M2 (6h 12m period) |
| MS4 | Quarter-diurnal Compound | 58.9841042 | M2+S2 | M2-S2 interaction |
| MN4 | Quarter-diurnal Compound | 57.4238337 | M2+N2 | M2-N2 interaction |
| M6 | Sixth-diurnal | 86.9523127 | 6×M2 | Overtide of M2 (4h 6m period) |
| M8 | Eighth-diurnal | 115.9364169 | 8×M2 | Overtide of M2 (3h 6m period) |
| 2MS6 | Sixth-diurnal Compound | 87.9682084 | 2M2+S2 | Shallow water compound |
| 2(MS)8 | Eighth-diurnal Compound | 116.9523127 | 3M2+S2 | Deep shallow water compound |
| MK3 | Terdiurnal | 44.0251729 | M2+K1 | Mixed semidiurnal/diurnal |
| S4 | Quarter-diurnal Solar | 60.0 | 4×S2 | Solar overtide |
| 2MN6 | Sixth-diurnal | 86.4079380 | 2M2+N2 | Shallow water sixth |
| MSN6 | Sixth-diurnal | 87.4238337 | M2+S2+N2 | Triple compound |

## Nodal Corrections

### Amplitude Correction (f)
Adjusts constituent amplitude based on moon's orbital position:
```typescript
f = f₀ + f₁·cos(N) + f₂·cos(2N)
```
Where N = longitude of moon's ascending node (18.6-year cycle)

### Phase Correction (u)
Adjusts constituent phase:
```typescript
u = u₁·sin(N) + u₂·sin(2N) + u₃·sin(3N)
```

### Major Constituent Corrections

**M2 (Principal Lunar)**
- f = 1.0 - 0.03731·cos(N) + 0.00052·cos(2N)
- u = -2.1408·sin(N) + 0.0138·sin(2N)
- Range: f = 0.964 to 1.037 (±3.7%)

**K1 (Lunisolar Diurnal)**
- f = 1.006 + 0.1150·cos(N) - 0.0088·cos(2N)
- u = -8.86·sin(N) + 0.68·sin(2N) - 0.07·sin(3N)
- Range: f = 0.892 to 1.127 (±11.5%)

**O1 (Lunar Diurnal)**
- f = 1.009 + 0.1870·cos(N) - 0.0147·cos(2N)
- u = 10.8·sin(N) - 1.34·sin(2N) + 0.19·sin(3N)
- Range: f = 0.823 to 1.203 (±18.7%)

## Thailand-Specific Implementation

### Gulf of Thailand
- **Mixed Mainly Diurnal** (Form Factor > 3)
- Dominant: K1, O1
- Secondary: M2, S2
- One high tide and one low tide per day (usually)

### Andaman Sea
- **Mixed Mainly Semidiurnal** (Form Factor 0.25-3)
- Dominant: M2, S2
- Secondary: K1, O1
- Two high tides and two low tides per day

### Bangkok Area (Upper Gulf)
Example amplitudes:
- M2: 0.35m (phase 175°)
- S2: 0.18m (phase 170°)
- K1: 0.55m (phase 125°) **← DOMINANT**
- O1: 0.45m (phase 115°) **← DOMINANT**

### Phuket (Andaman)
Example amplitudes:
- M2: 0.60m (phase 195°) **← DOMINANT**
- S2: 0.35m (phase 190°) **← DOMINANT**
- K1: 0.30m (phase 120°)
- O1: 0.25m (phase 110°)

## Astronomical Arguments

### Fundamental Arguments (J2000.0 epoch)
```typescript
s = 218.3164477° + 481267.88123421°T  // Mean longitude of moon
h = 280.4664567° + 36000.76982779°T   // Mean longitude of sun
p = 83.3532465° + 4069.0137287°T      // Longitude of moon's perigee
N = 125.0445479° - 1934.1362891°T     // Longitude of moon's node
pp = 282.9373480° + 1.71945766°T      // Longitude of sun's perigee
```
Where T = Julian centuries since 2000-01-01 12:00 UTC

### Constituent Phase (V)
```typescript
V = speed × τ + astronomical_terms
```
Where τ = local mean lunar time (hours)

## Usage

```typescript
import { 
  TIDAL_CONSTITUENTS, 
  getLocationConstituents, 
  calculateNodalCorrection,
  predictWaterLevel 
} from '@/lib/harmonic-prediction'

// Get constituents for location
const location = { lat: 13.7563, lon: 100.5018, name: 'Bangkok' }
const constituents = getLocationConstituents(location)

// Predict water level
const waterLevel = predictWaterLevel(new Date(), location, constituents)
```

## References

1. **IHO (International Hydrographic Organization)**: "Constituent Tables" - Standard nodal corrections
2. **NOAA CO-OPS**: "Tidal Analysis and Prediction" - Harmonic analysis methodology
3. **Schureman, Paul (1958)**: "Manual of Harmonic Analysis and Prediction of Tides" - Classic reference
4. **Pugh, D.T. & Woodworth, P.L. (2014)**: "Sea-Level Science" - Modern tidal theory
5. **Royal Thai Navy Hydrographic Department**: Thailand tide station data

## Validation

✅ **37 constituents** implemented
✅ **Full nodal corrections** (f and u) for all constituents
✅ **Doodson numbers** documented
✅ **18.6-year nodal cycle** properly handled
✅ **Thailand-specific amplitudes** for Gulf and Andaman
✅ **Shallow water constituents** for coastal predictions

Last Updated: 2024
