# 🏗️ SEAPALO: Technical Architecture for Offline-First Production PWA

**Document Version**: 1.0  
**Date**: 2025-10-20  
**Status**: Blueprint Phase  

---

## 1️⃣ High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Browser/Mobile)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
    ┌────▼────┐         ┌─────▼──────┐      ┌─────▼──────┐
    │  UI Layer│         │  Service   │      │ IndexedDB  │
    │ (React)  │◄───────►│  Worker    │◄────►│  Cache     │
    └────┬─────┘         └─────┬──────┘      └────────────┘
         │                     │
    ┌────▼─────────────────────▼────────┐
    │     WASM Tide Engine Core         │
    │  (Harmonic + Astronomical Calc)   │
    │  - Constituents (37+)             │
    │  - Nodal factors                  │
    │  - Ephemerides cache              │
    └────┬──────────────────────────────┘
         │
    ┌────▼──────────────────────────────┐
    │   Tile Management Module          │
    │  - Load/validate tiles            │
    │  - Local calibration              │
    │  - Checksum verification          │
    └────┬──────────────────────────────┘
         │
         ├─────────────────────────────────── (Offline ✅)
         │
         └─ (When online, async)
            ├─► Check Signed Manifest (backend)
            ├─► Download Delta Updates (bsdiff)
            └─► Verify + Apply (with rollback)

┌──────────────────────┐
│   Backend (Optional) │
│  - Tile Server       │
│  - Manifest Signing  │
│  - Field Data Ingress│
└──────────────────────┘
```

---

## 2️⃣ WASM Core Module

### 2.1 Responsibilities

**Input**:
- Constituent array: `[{name, amplitude, phase}, ...]`
- Astronomical arguments: `{V[i], u[i], f[i], t}` per constituent
- Time range: `tStart, tEnd, stepMinutes`
- Location metadata: `{lat, lon, datum, localCalibration}`

**Output**:
- Time-series: `[{time: ISO, level: float, confidence: float}, ...]`
- High/Low markers: `[{time, level, type, confidence}, ...]`
- Metadata: `{computeTimeMs, constituentUsed, flagsMissing}`

### 2.2 Core Algorithm

```
procedure PredictTide(t_start, t_end, step_min, constituents[], astro_cache, localCalib):
    result = []
    for each time t in [t_start, t_start+step, ..., t_end]:
        η(t) = 0
        confidence_band_width = 0
        
        for each constituent c in constituents:
            if c is major (e.g., M2, S2, K1, O1):
                ω = frequency(c)  // known constant
                f_t = nodal_factor(c, t, astro_cache)
                u_t = astronomical_arg(c, t, astro_cache)
                
                η(t) += c.amplitude * f_t * cos(ω*t + c.phase + u_t)
                confidence_band_width += 0.01 * c.amplitude  // rough estimate
            
            else if c is minor/shallow:
                // Apply inference rule: amplitude/phase = f(major constituents)
                inferred_amp, inferred_phase = apply_minor_rule(c, constituents, t)
                η(t) += inferred_amp * cos(frequency(c)*t + inferred_phase)
                confidence_band_width += 0.02 * inferred_amp  // lower confidence
        
        // Apply local calibration (if available)
        if localCalib != null:
            η(t) += localCalib.height_offset
            // phase offset: absorbed in constituent phases if regenerated
        
        // Sanity checks
        if isNaN(η) or isInf(η):
            η(t) = 0, confidence = 0 (flag error)
        
        result.append({
            time: t,
            level: round(η, 2),
            confidence_lower: η - confidence_band_width,
            confidence_upper: η + confidence_band_width,
            source: "harmonic" | "equilibrium_fallback"
        })
    
    return result
```

### 2.3 Ephemerides Caching

- **Strategy**: Pre-compute nodal factors + astronomical arguments in **24-hour blocks**
- **Trigger**: Cache miss when computing for new date
- **Storage**: IndexedDB `ephemerides` table: `{dateString, v[], u[], f[]}`
- **Lifespan**: 1 year (auto-purge older entries)
- **Size**: ~50 KB per year (float32 for 37+ constituents × ~1440 minutes/day)

### 2.4 WASM/JS Interop (Example Rust → JS)

```rust
// lib/wasm/src/lib.rs (Rust)
#[wasm_bindgen]
pub struct TidePrediction {
    pub time_iso: String,
    pub level_m: f32,
    pub confidence_m: f32,
}

#[wasm_bindgen]
pub fn predict_tide_range(
    t_start_iso: &str,
    t_end_iso: &str,
    step_minutes: u32,
    constituents_json: &str,
    local_calib_json: &str,
) -> Result<JsValue, JsValue> {
    // Parse JSON, compute, return Vec<TidePrediction>
    // Serialized to JS array
}
```

```javascript
// app/lib/wasm-client.ts (JS)
import init, { predict_tide_range } from '@/lib/wasm/pkg/seapalo_tide'

export async function initWasm() {
  await init() // Download + instantiate WASM
}

export function predictTide(opts: PredictionOptions) {
  try {
    const result = predict_tide_range(
      opts.tStart.toISOString(),
      opts.tEnd.toISOString(),
      opts.stepMinutes,
      JSON.stringify(opts.constituents),
      JSON.stringify(opts.localCalibration || {})
    )
    return JSON.parse(result) as TidePrediction[]
  } catch (err) {
    console.warn('WASM failed, falling back to JS:', err)
    return predictTideJS(opts) // Fallback
  }
}
```

---

## 3️⃣ Tile & Data Management

### 3.1 Tile Structure

```typescript
interface TileMeta {
  tile_id: string                    // "bangkok_001"
  bbox: { north: number; south: number; east: number; west: number }
  centroid: { lat: number; lon: number }
  model: string                       // "FES2022_v2.1"
  datum: string                       // "MSL" | "LAT" | "MLLW"
  tz_hint: string                    // "Asia/Bangkok"
  constituents_count: number          // 37, 45, ...
  minor_shallow_rules: boolean
  local_calibrations: boolean         // true if contains station offsets
  updated_at: string                  // ISO date
  version: string                     // "1.2.3"
  checksum_sha256: string
}

interface ConstituentData {
  name: string                        // "M2", "S2", "N2", ...
  frequency_rad_per_hour: number
  amplitude_m: number                 // Float16 compressed
  phase_deg: number                   // Float16 compressed
  amplitude_std: number               // Uncertainty (optional)
}

interface MinorRule {
  constituent: string                 // "M4"
  formula: string                     // Linear relation description
  params: { [key: string]: number }   // a, b, c for M4 = a*M2 + b*S2 + c
  source: string                       // "IHO 2023" or research paper
}

interface LocalCalibration {
  lat: number
  lon: number
  name: string                        // "Bangkok Port"
  height_offset_m: number
  phase_offset_deg: number
  valid_from: string                  // ISO date
  valid_to: string
  rmse_m: number                      // Validation RMSE
  n_samples: number                   // Observations used
}

// Packed format (in IndexedDB):
type TilePayload = {
  meta: TileMeta
  constituents: ConstituentData[]
  minor_rules: MinorRule[]
  calibrations: LocalCalibration[]
  compressed_buffer: Uint8Array       // If brotli-compressed
}
```

### 3.2 Manifest Schema

```json
{
  "version": "1.0",
  "app_version": "1.2.3",
  "timestamp": "2025-10-20T10:00:00Z",
  "tiles": [
    {
      "id": "bangkok_001",
      "size_compressed": 245000,
      "size_uncompressed": 580000,
      "checksum_sha256": "abc123def456...",
      "url": "https://tiles.seapalo.app/bangkok_001.br",
      "updated_at": "2025-10-20T09:00:00Z",
      "previous_version": "1.0",
      "delta_available": true,
      "delta_url": "https://tiles.seapalo.app/bangkok_001-v1.0-to-v1.1.patch",
      "delta_size": 45000
    },
    ...
  ],
  "removed_tiles": [],
  "model": "FES2022_v2.1",
  "ephemerides_version": "DE430",
  "delta_t_version": "2025-04",
  "signature": {
    "algorithm": "Ed25519",
    "public_key": "abcd1234...",
    "signature": "sig_base64..."
  }
}
```

### 3.3 Update Pipeline

```
┌─ Development ─────────────────────┐
│ New FES/TPXO data available       │
└─────────────────┬──────────────────┘
                  │
         ┌────────▼─────────┐
         │ Generate tiles   │
         │ (per 1° bbox)    │
         └────────┬─────────┘
                  │
         ┌────────▼──────────────┐
         │ Compute delta patches │
         │ (bsdiff from prev)    │
         └────────┬──────────────┘
                  │
         ┌────────▼──────────────┐
         │ Create manifest.json  │
         │ with all checksums    │
         └────────┬──────────────┘
                  │
         ┌────────▼──────────────┐
         │ Sign manifest         │
         │ (Ed25519 private key) │
         └────────┬──────────────┘
                  │
         ┌────────▼──────────────┐
         │ Deploy to tile server │
         │ + publish URL         │
         └─────────────────────┘

┌─ Client (Browser) ───────────────┐
│ 1. Fetch signed manifest          │
│ 2. Verify signature               │
│ 3. Check local version            │
│ 4. (Optional) Download full tile  │
│ 5. (Preferred) Download delta     │
│ 6. Apply patch (rdiff/similar)    │
│ 7. Verify new checksum            │
│ 8. Commit to IndexedDB            │
│ 9. Show success badge             │
└─────────────────────────────────┘
```

---

## 4️⃣ IndexedDB Schema

```sql
/* Tile Storage */
CREATE TABLE tiles (
  tile_id TEXT PRIMARY KEY,
  version TEXT,
  meta_json TEXT,
  constituents_blob BLOB,
  calibrations_json TEXT,
  checksum_sha256 TEXT,
  downloaded_at INTEGER,  -- timestamp
  used_at INTEGER  -- for LRU eviction
);

/* Ephemerides Cache */
CREATE TABLE ephemerides (
  date_key TEXT PRIMARY KEY,  -- "2025-10-20"
  v_array_blob BLOB,          -- Serialized [V1, V2, ...]
  u_array_blob BLOB,
  f_array_blob BLOB,
  computed_at INTEGER,
  expires_at INTEGER
);

/* Update/Sync Queue */
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY,
  tile_id TEXT,
  action TEXT,  -- "download_full" | "download_delta" | "verify"
  status TEXT,  -- "pending" | "in_progress" | "done" | "failed"
  error_msg TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

/* Telemetry (if opt-in) */
CREATE TABLE telemetry (
  id INTEGER PRIMARY KEY,
  metric TEXT,           -- "predict_time_ms", "memory_mb", "constituent_used"
  value TEXT,
  timestamp INTEGER,
  synced_at INTEGER     -- NULL if not sent yet
);
```

---

## 5️⃣ Service Worker Strategy

### 5.1 Cache Strategy

```typescript
// sw.ts
const CACHE_VERSION = 'seapalo-v1'
const PRECACHE_URLS = [
  '/',
  '/app.js',
  '/app.css',
  '/wasm/seapalo_tide.wasm',
  // Icons, manifest
]
const TILE_CACHE = 'seapalo-tiles-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(PRECACHE_URLS)
    })
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // App core: cache first
  if (url.pathname === '/' || url.pathname.startsWith('/app.')) {
    event.respondWith(
      caches.match(event.request).then((resp) => resp || fetch(event.request))
    )
    return
  }
  
  // Tiles: cache first, but check for updates
  if (url.pathname.includes('/tiles/')) {
    event.respondWith(
      caches.open(TILE_CACHE).then((cache) => {
        return cache.match(event.request).then((resp) => {
          const fetchPromise = fetch(event.request).then((resp) => {
            cache.put(event.request, resp.clone())
            return resp
          })
          return resp || fetchPromise
        })
      })
    )
    return
  }
  
  // Everything else: network first with fallback
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  )
})
```

### 5.2 Background Sync (30-day check)

```typescript
// Register sync event (if supported)
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  navigator.serviceWorker.controller?.ready.then((reg) => {
    // Request sync every 30 days
    reg.sync.register('check-tile-updates')
  })
}

// In SW:
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-tile-updates') {
    event.waitUntil(
      fetch('https://api.seapalo.app/manifest.json')
        .then(checkForUpdates)
        .then(downloadIfNeeded)
        .catch(() => {
          // Offline, retry later
          return self.registration.sync.register('check-tile-updates')
        })
    )
  }
})
```

---

## 6️⃣ Constituent List & Astronomical Basis

### 6.1 Core 37+ Constituents (IHO Standard)

| Name | Type | Period (hours) | ω (rad/hour) | Notes |
|------|------|-----------------|-------------|-------|
| **Diurnal** |
| K1 | Lunar-solar | 23.93 | 0.0418 | Lunisolar declinational |
| O1 | Lunar | 25.82 | 0.0387 | Lunar declinational |
| P1 | Solar | 24.07 | 0.0416 | Solar declinational |
| Q1 | Lunar | 26.87 | 0.0372 | Smaller lunar elliptic |
| **Semi-diurnal** |
| M2 | Lunar | 12.42 | 0.0805 | Principal lunar |
| S2 | Solar | 12.00 | 0.0833 | Principal solar |
| N2 | Lunar | 12.66 | 0.0787 | Lunar elliptic |
| K2 | Lunisolar | 11.97 | 0.0835 | Lunisolar declinational |
| **Long-period** |
| Mf | Lunar | 327.86 | 0.00115 | Lunar fortnightly |
| Mm | Lunar | 661.30 | 0.000573 | Lunar monthly |
| Sa | Solar | 8766 | 7.21e-5 | Solar annual |
| Ssa | Solar | 4383 | 1.44e-4 | Solar semi-annual |
| **Shallow-water (if coeff available)** |
| M4 | Lunar | 6.21 | 0.161 | Over-tide: 2×M2 |
| MS4 | Lunar-solar | 6.10 | 0.165 | Combination |
| MN4 | Lunar | 6.27 | 0.157 | Lunar elliptic over-tide |
| ... | ... | ... | ... | + more as data supports |

### 6.2 Nodal Correction (Rayleigh Corrections)

For **semi-diurnal** tides:

$$f_i(t) = \prod_{j} [1 + \epsilon_j \cos(N_j(t))]$$

where $N_j$ is the nodal argument (e.g., lunar node ≈18.6 year cycle).

**Common nodal factors** (computed for major constituents):
- M2: factor ≈ 1.0 (small variation)
- N2: factor ≈ varies with M2
- K1, O1: factors ≈ vary with lunar declination node

**Implementation**: Pre-compute $f_i$ and $u_i$ (astronomical argument) per day, cache in IndexedDB.

### 6.3 Astronomical Arguments (V + u Formula)

$$V_i(t) + u_i(t) = V_{0i}(t) + \sum_j A_{ij} \times \theta_j(t)$$

where:
- $V_{0i}$ = reference phase (tabulated per constituent)
- $A_{ij}$ = coefficient (e.g., +1, -1, +2)
- $\theta_j$ = astronomical angle (e.g., mean moon, mean sun, lunar node position)

**Required ephemerides**:
- Mean longitude of moon, sun
- Mean perigee/apogee
- Lunar node longitude
- *Derived from**: DE430 or Meeus' algorithms

**Leap seconds & ΔT**: Account for in UTC→astronomical time conversion.

---

## 7️⃣ UI Component Architecture

### 7.1 Main Pages

```
App/
├── HomePage/
│   ├── MapSelector (Leaflet/Pigeon)
│   │   ├── Show tile coverage (colored)
│   │   ├── Marker: selected location
│   │   └── Buttons: favorite, download tile
│   ├── TideGraph (SVG/Recharts)
│   │   ├── Time series line (48–72 hrs)
│   │   ├── Confidence band (shaded)
│   │   ├── High/low markers (red/blue dots)
│   │   └── Legend + controls (show/hide)
│   ├── QuickStats
│   │   ├── High tide: time + level ± confidence
│   │   ├── Low tide: time + level ± confidence
│   │   ├── Current rate (m/hr)
│   │   └── Confidence %
│   └── OfflineStatus
│       ├── Badge: "Offline • Last updated: ..."
│       ├── Button: "Download tile for offline"
│       └── Button: "Check for updates" (if online)
│
├── SettingsPage/
│   ├── Datum selector (MSL, LAT, MLLW)
│   ├── Units (m, ft)
│   ├── Language (Thai, English)
│   ├── Telemetry opt-in
│   └── Clear cache / Reset
│
└── DataPage/
    ├── Model info (FES2022 v2.1, updated 2025-09)
    ├── Constituent count
    ├── Field test results (3 sites, RMSE tables)
    ├── Attribution / Licenses
    └── "Not for Navigation" warning
```

### 7.2 Key UI Elements

**Confidence Band on Graph**:
```
level_upper = prediction + uncertainty_band
level_lower = prediction - uncertainty_band
Render as semi-transparent shaded region
```

**High/Low Marker**:
```
{
  time: "2025-10-20T05:30+07:00",
  level_m: 1.25,
  type: "high",
  confidence: 0.92,  // 92%
  rate_m_per_hour: 0.015
}
```

**Datum Conversion**:
```
level_display = level_predicted + datum_offset
datum_offset = {
  MSL: 0 (default),
  LAT: +0.35,  // example for Bangkok
  MLLW: -0.85
}
// Show in tooltip: "Relative to MSL (LAT +0.35m)"
```

---

## 8️⃣ Performance Budget

| Metric | Target | Notes |
|--------|--------|-------|
| **App size (initial)** | ≤2 MB | gzipped |
| **WASM binary** | ≤800 KB | brotli compressed |
| **Tile size** | ≤500 KB | brotli compressed |
| **Predict 72hrs @ 10min** | ≤150 ms | mid-range phone (Android) |
| **Memory (idle)** | ≤50 MB | App + 1 tile |
| **Memory (prediction)** | ≤80 MB | App + tile + compute buffers |
| **Time to First Paint** | ≤2 s | on 3G (online) or offline |
| **Graph render** | ≤500 ms | 72-point SVG/Canvas |
| **Tile download** | ≤5 s | on 4G; ≤30 s on 3G |

---

## 9️⃣ Security Model

### 9.1 Tile Verification

```
Manifest URL: https://api.seapalo.app/manifest.json

Flow:
1. Client fetches manifest + signature
2. Client verifies Ed25519 signature against hardcoded public key
3. If invalid → reject & alert user
4. Extract tile URLs + checksums
5. Download tile (may be partial via CDN)
6. Compute SHA256 of downloaded data
7. Compare vs manifest checksum
8. If mismatch → delete & retry or use cached version
```

### 9.2 Rollback Mechanism

```
IndexedDB:
  tiles_v1 (current)
  tiles_v0 (previous, kept for 30 days)
  tiles_v-1 (oldest, kept for 30 days)

If new version detected as faulty:
  1. User can "Downgrade tile" from Settings
  2. App replays from tiles_v0
  3. Flag is set; future updates require confirmation
```

---

## 🔟 Testing & Validation Strategy

### 10.1 Unit Tests

```typescript
// test/astronomy.test.ts
describe('Astronomical Arguments', () => {
  it('should compute V+u for M2 on reference date', () => {
    const args = computeAstronomicalArg('M2', new Date('2025-01-01T00:00:00Z'))
    expect(args.V).toBeCloseTo(expected_V, 2)
    expect(args.u).toBeCloseTo(expected_u, 2)
  })
  
  it('should handle leap seconds correctly', () => {
    // Verify UTC→AstroTime conversion includes leap seconds
  })
})

describe('Harmonic Sum', () => {
  it('should compute tide level without NaN', () => {
    const level = harmonicSum(constituents, t, nodal_factors)
    expect(Number.isFinite(level)).toBe(true)
  })
})

describe('High/Low Finder', () => {
  it('should find spring tide high at ±10 min accuracy', () => {
    const series = generateReferenceSpringTide()
    const high = findHighLow(series)
    expect(high[0].time).toBeCloseTo(expectedTime, 600000) // 10 min
  })
})
```

### 10.2 Golden Dataset Tests

Use **verified reference data** (e.g., NOAA predictions for Hawaii, UK Hydrographic Office for UK):
- Spring tide (neap factor ≈1.8)
- Neap tide (neap factor ≈0.4)
- Equinox + solstice (seasonal effects)

### 10.3 Field Test Protocol (3 Sites)

**Site A: Bangkok (Inner Chao Phraya)**
- Location: ~40 km upstream
- Expected: Mixed semi-diurnal, wind effects
- Duration: 60 days (Jan 2026 preferred)
- Samples: 4/day
- Acceptance: Time RMSE ≤±12 min, height RMSE ≤0.20m

**Site B: Chachoengsao (Estuary)**
- Location: Bang Pakong estuary mouth
- Expected: River + tide interaction
- Duration: 60 days
- Samples: 4/day
- Acceptance: Time RMSE ≤±12 min, height RMSE ≤0.20m

**Site C: Phuket (Open Andaman)**
- Location: Offshore, minimal river influence
- Expected: Pure semidiurnal
- Duration: 60 days
- Samples: 4/day
- Acceptance: Time RMSE ≤±8 min, height RMSE ≤0.15m

---

## 1️⃣1️⃣ Deployment Checklist

- [ ] WASM binary optimized + tested on 5 device types
- [ ] Service Worker tested: offline scenario, update push, cache eviction
- [ ] IndexedDB tested: quota limits, LRU eviction, recovery after corruption
- [ ] Tiles signed + checksums verified
- [ ] Manifest rotated (keep old sigs for rollback)
- [ ] UAT with real users on 3G/LTE
- [ ] Monitoring: error rates, compute times, cache hit ratios
- [ ] Runbook: how to sign + push hotfix tile
- [ ] Privacy audit: no coord leaks, opt-in telemetry only

---

## 1️⃣2️⃣ References & Standards

- **IHO (2023)**: Tidal Harmonic Analysis and Prediction
- **Godin, G. (1972)**: The Analysis of Tides
- **Foreman, M. (1977)**: Manual for Tidal Heights Analysis and Prediction
- **Meeus, J. (1998)**: Astronomical Algorithms (Leap seconds, ΔT)
- **JPL DE430**: Planetary/lunar ephemerides
- **NOAA**: NOS Tidal Predictions (reference baseline)
- **FES2022**: Global ocean tide model (ESA/CNES)
- **TPXO**: Global tide model (Egbert & Erofeeva)

---

**Architecture Owner**: @tech-lead  
**Last Reviewed**: 2025-10-20  
**Next Review**: After Phase 1 completion
