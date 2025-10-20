# 🎯 Roadmap: SEAPALO → Offline-First Production PWA
**Status**: ✅ Blueprint Phase | **Last Updated**: 2025-10-20  
**Target**: High-accuracy tide prediction, offline-capable, low-bandwidth, Thai-localized PWA

---

## 📊 Current State vs. MEGA SPEC Requirements

| Feature | Current | Required | Gap | Priority |
|---------|---------|----------|-----|----------|
| **Harmonic Constituents** | ≈ 4–8 (sim) | ≥ 37 + minor/shallow | 🔴 High | MUST |
| **Astronomical Calc** | astronomy-engine (JS) | DE430 ephemerides + leap seconds | 🟡 Medium | MUST |
| **Offline-First PWA** | ❌ No | ✅ Service Worker + IndexedDB | 🔴 High | MUST |
| **Tile-Based Data** | ❌ No | ✅ ≤500KB/tile, delta updates | 🔴 High | MUST |
| **WASM Core** | ❌ No | ✅ Rust/C (72hrs ≤150ms) | 🔴 High | MUST |
| **Vertical Datums** | ❌ No | ✅ MSL/LAT/MLLW + convert | 🟡 Medium | MUST |
| **Signed Manifest** | ❌ No | ✅ Checksum + rollback | 🔴 High | MUST |
| **Multi-Language** | ✅ Thai/Eng | ✅ Extend + consistent format | 🟢 Low | SHOULD |
| **QA/Acceptance** | Partial | ✅ Field test 3 sites, RMSE ≤0.15m | 🔴 High | MUST |
| **Confidence Band** | ❌ No | ✅ Model stats + visual | 🟡 Medium | SHOULD |
| **Meteorological Residual** | ❌ No | ✅ IB + wind param (optional) | 🟢 Low | SHOULD |

---

## 🚀 Phase 1: Foundation (Weeks 1–3)
**Goal**: Set up WASM core, tile schema, and PWA infrastructure

### 1.1 WASM Core Setup
- [ ] Create `lib/wasm/` (Rust or C) for:
  - `astronomical_args(t)` → nodal factors + arguments for 37+ constituents
  - `harmonic_sum(constituents, args, t)` → tide level
  - `find_high_low(series)` → times + levels with ±confidence
- [ ] Define **37+ Constituent Set** (M2, S2, N2, K2, K1, O1, P1, Q1, Mf, Mm, Sa, Ssa, M4, MS4, MN4, ...)
- [ ] Implement **Nodal Factor & Astronomical Correction** (V+u formulas per IHO standard)
- [ ] Fallback JS implementation for browsers without WASM

**Acceptance**: WASM binary <500KB; JS fallback ≥90% accuracy vs WASM

### 1.2 Tile Schema & Packaging
- [ ] Design `TileMeta` (bbox, datum, tz_hint, version, checksum)
- [ ] Design `Constituent[]` (float16 amplitude/phase, compression)
- [ ] Design `MinorRules` (shallow water inference rules, parameterized)
- [ ] Create packing script (brotli/zstd, delta support)
- [ ] Target ≤500KB per tile after compression

**Acceptance**: Sample tile for Bangkok area <300KB

### 1.3 PWA Infrastructure
- [ ] Create Service Worker (precache core app, runtime cache tiles)
- [ ] Set up IndexedDB schema (chunks, LRU eviction)
- [ ] Manifest.json with correct icons/capabilities
- [ ] Offline detection + sync queue

**Acceptance**: App opens offline after first load; badges show "Offline" + last updated

---

## 📦 Phase 2: Data Integration (Weeks 4–6)
**Goal**: Integrate real data sources, build tile generation pipeline

### 2.1 Data Sources & Licensing
- [ ] Audit FES2022 / TPXO licensing → decide which for core
- [ ] Locate **Thai government tide station data** (ท่าเรือ, ศูนย์เศรษฐกิจ, อื่น)
- [ ] Document **license matrix** (distribution, modification, attribution)
- [ ] Create **ATTRIBUTION.md** for all data sources

### 2.2 Tile Generation Pipeline
- [ ] Build `scripts/generate-tiles.ts`:
  - Input: FES/TPXO model + tile bounding boxes (e.g., 1°×1° grid)
  - Extract harmonic constituents per tile
  - Compute local calibration (height/phase offset) if station data available
  - Pack + compress + compute checksum
  - Output: manifest.json (signed with private key) + tile files
- [ ] Delta update mechanism (bsdiff for patches)

### 2.3 Signed Manifest
- [ ] Generate manifest with checksum per tile + app version
- [ ] Sign with Ed25519 (key pair stored securely on backend)
- [ ] Verify on app load; reject if signature mismatch
- [ ] Rollback mechanism (keep previous 2 versions in IndexedDB)

**Acceptance**: Generate Bangkok tile, verify checksum, rollback on tampered update

---

## 🎯 Phase 3: Computation Engine & API (Weeks 7–9)
**Goal**: Implement prediction core, expose JS API, optimize performance

### 3.1 Core Prediction Functions
- [ ] `loadTile(tilePayload, tileId)` → validate + cache + parse constituents
- [ ] `computeAstronomy(tStart, tEnd, step_mins)` → cache arguments if possible
- [ ] `predictLevel(tStart, tEnd, step_mins, options)` → time-series + metadata
  - Include confidence bands (from model stats)
  - Flag missing constituents
  - Apply local calibration if available
- [ ] `findHighLow(series)` → array of {time, level, type, confidence}

### 3.2 Performance Optimization
- [ ] Benchmark on mid-range phone: 72hrs @ 10min step ≤ 150ms
- [ ] Cache astronomical arguments per day (block cache)
- [ ] Profile WASM vs JS; adjust fallback if needed
- [ ] Memory cap at 80MB (including tile + compute buffers)

### 3.3 Error Handling
- [ ] Guard NaN/Inf; return zero with warning if constituent missing
- [ ] Expand confidence band if major constituent absent
- [ ] Graceful degradation to **Equilibrium Tide** if offline + no tile

**Acceptance**: Predict Bangkok 72hrs in <150ms; display confidence band

---

## 🗺️ Phase 4: UI/UX Redesign (Weeks 10–12)
**Goal**: Rebuild UI for accuracy + usability, add new features

### 4.1 Map & Location Selection
- [ ] Keep current interactive map + favorites
- [ ] Add **"Save Tile"** button → triggers download for offline
- [ ] Show coverage (green = have tile, gray = not available)
- [ ] Fallback to equilibrium if no tile available (show warning)

### 4.2 Prediction Display
- [ ] **48–72hr graph** with:
  - Smooth curve (harmonic)
  - Red dots: high tides (time + level ± confidence)
  - Blue dots: low tides
  - Purple indicator: current level
  - Dashed confidence band around curve
- [ ] **High/Low Table**: time, level, confidence %, rate (m/hr)
- [ ] **Datum Selector**: MSL (default) / LAT / MLLW (if available)
- [ ] **Units**: meters (default) / feet toggle

### 4.3 Status Indicators
- [ ] Offline badge: "📡 Offline • Last updated: YYYY-MM-DD"
- [ ] Data freshness: "Model: FES2022 v2.1 • Calibrated: 2025-Q3"
- [ ] API health: indicator if telemetry available
- [ ] **Warning**: "Not for Navigation. Wind/pressure/currents may differ."

### 4.4 Additional UX
- [ ] Dark/light mode (existing good)
- [ ] Accessibility (WCAG 2.1 AA):
  - High contrast mode
  - Keyboard nav
  - Screen reader labels (ARIA)
  - Graph: provide text summary for high/low
- [ ] Language toggle: Thai / English
  - Consistent number format (date/time/decimals)

**Acceptance**: Graph renders correctly offline; high/low accurate ±10 min

---

## ✅ Phase 5: Calibration & Field Testing (Weeks 13–16)
**Goal**: Validate against real tide stations; optimize accuracy

### 5.1 Prepare Test Sites (Thai Coastal)
- [ ] **Site A**: Bangkok (Chao Phraya inner) — semi-enclosed, wind-driven
- [ ] **Site B**: Ban Pong (Chachoengsao estuary) — river-influenced
- [ ] **Site C**: Phuket (Andaman) — open ocean

### 5.2 Field Data Collection
- [ ] Deploy or source logger data: ≥60 days/site, ≥4 samples/day
- [ ] Record: time (UTC), water level (meters above benchmark), conditions (weather notes)
- [ ] Span ≥1 spring + 1 neap cycle

### 5.3 Calibration Analysis
- [ ] Run UTide/T-Tide (or T-Tide WASM) on 60-day series
  - Extract harmonic constituents per site
  - Compare vs. global model (FES/TPXO)
  - Identify local bias (height offset, phase shift)
- [ ] Compute skill scores (RMSE, MAE, SI, CC):
  - Times: separate spring/neap; goal ≤±10 min
  - Heights: separate high/low; goal RMSE ≤0.15–0.20m
- [ ] Store local calibration in tile (height_offset_m, phase_offset_deg, valid_from, valid_to)

### 5.4 Report & Iterate
- [ ] Generate skill report per site/model
- [ ] Publish on "Data" page: "Model Accuracy" table
- [ ] If RMSE exceeds target: investigate (missing constituents? datum error? data quality?)
- [ ] Adjust tile generation or minor-rule params accordingly

**Acceptance**: All 3 sites ≥85% skill, time error ≤±10 min, height RMSE ≤0.15m

---

## 🔒 Phase 6: Security & Privacy (Weeks 17–18)
**Goal**: Implement signed updates, privacy-first telemetry, data protection

### 6.1 Signed Manifest & Rollback
- [ ] Generate Ed25519 keypair (server-side)
- [ ] Manifest: {version, tiles: [{id, checksum, size}], timestamp, signature}
- [ ] On fetch: verify signature before applying; reject if invalid
- [ ] Rollback: keep last 2 versions; allow user to downgrade if major bug
- [ ] Test: tamper with tile → verify rejection

### 6.2 Privacy & Telemetry
- [ ] Telemetry (opt-in):
  - Anonymous: compute time, memory used, model version used, tile coverage
  - NO coordinates, NO predictions, NO timestamps
- [ ] Store offline → send batch when online (if user enabled)
- [ ] Privacy Notice: explain what is/isn't collected
- [ ] Option to disable all telemetry

### 6.3 GDPR/Data Protection
- [ ] LocalStorage/IndexedDB: user data only (no cloud sync)
- [ ] ServiceWorker: no tracking cookies
- [ ] Manifest: declare "permissions" clearly
- [ ] Terms: "Not for Navigation"

**Acceptance**: Offline telemetry queue works; no coords sent; Privacy Notice clear

---

## 📚 Phase 7: Documentation & Handover (Weeks 19–20)
**Goal**: Complete all deliverables and guides

### 7.1 Technical Documentation
- [ ] **API Reference**: loadTile, predictLevel, findHighLow, etc. (JSDoc + examples)
- [ ] **Tile Schema**: structure + compression + delta format
- [ ] **Astronmy Module**: constituent list + formulas (V+u) + nodal corrections + reference
- [ ] **Calibration Guide**: step-by-step to run UTide on new site data
- [ ] **Field Test Protocol**: how to collect + validate data
- [ ] **Deployment Guide**: how to generate/sign/serve tiles

### 7.2 User Documentation
- [ ] **Quick Start**: how to download tile, use offline, interpret graph
- [ ] **FAQ**: "Why offline?", "How accurate?", "Can I contribute data?"
- [ ] **Troubleshooting**: "App won't sync", "Tile won't download", "Graph looks wrong"
- [ ] **Scientific Basis**: explain harmonic method, constituents, confidence bands (simplified Thai)
- [ ] **Attribution & Licenses**: full credits + data source links

### 7.3 Test Suite & Reports
- [ ] Unit tests (WASM + JS): astronomical args, harmonic sum, high/low finder
- [ ] Golden dataset tests (spring/neap reference days)
- [ ] Field test results: 3 sites, skill scores, RMSE tables
- [ ] Acceptance checklist: all MUST items ✅

### 7.4 Code Cleanup & Release
- [ ] Lint + format all code
- [ ] Build PWA: test offline, cache busting, icons
- [ ] Deploy to staging → full UAT
- [ ] Tag release (semver): v1.0.0-production
- [ ] GitHub release notes + deployment notes

**Acceptance**: All docs complete; UAT sign-off; deploy button ready

---

## 🎯 Success Criteria (Checklist)

**MUST (Non-negotiable)**
- [ ] ✅ Offline fully functional after tile download
- [ ] ✅ 72-hour prediction ≤150ms (mid-range phone)
- [ ] ✅ High/Low time error ≤±10 min (calibrated sites)
- [ ] ✅ High/Low height RMSE ≤0.15–0.20m
- [ ] ✅ 37+ constituents implemented
- [ ] ✅ Signed manifest + rollback working
- [ ] ✅ Tile size ≤500KB; app size ≤2MB
- [ ] ✅ Thai localization complete
- [ ] ✅ Privacy-first (no coord upload by default)

**SHOULD (High priority)**
- [ ] ✅ Confidence band visible on graph
- [ ] ✅ Meteorological residual (simple IB model)
- [ ] ✅ Local calibration stored per tile
- [ ] ✅ Multiple datum options (MSL/LAT/MLLW)

---

## 📅 Timeline Summary
| Phase | Duration | Milestones |
|-------|----------|-----------|
| 1: Foundation | Weeks 1–3 | WASM core, tile schema, PWA setup |
| 2: Data Integration | Weeks 4–6 | Tile generation, signed manifest, calibration data |
| 3: Engine & API | Weeks 7–9 | Prediction functions, optimization, performance budget met |
| 4: UI/UX | Weeks 10–12 | Graph + controls, offline badges, datum selector |
| 5: Field Testing | Weeks 13–16 | 3-site calibration, skill scores, accuracy validation |
| 6: Security & Privacy | Weeks 17–18 | Signed updates, privacy telemetry, compliance |
| 7: Documentation & Release | Weeks 19–20 | Docs, tests, UAT, deploy |
| **TOTAL** | **20 weeks** | **Production-ready** |

---

## 🔗 Reference Links (To Create)
- [ ] `docs/ARCHITECTURE.md` — System design overview
- [ ] `docs/CONSTITUENTS.md` — Full 37+ list with formulas
- [ ] `docs/TILE_FORMAT.md` — Binary schema + compression
- [ ] `docs/CALIBRATION.md` — How to calibrate against station data
- [ ] `docs/FIELD_TEST.md` — Protocol for 3-site validation
- [ ] `docs/API_REFERENCE.md` — JS/WASM API docs
- [ ] `docs/DEPLOYMENT.md` — How to generate + publish tiles
- [ ] `scripts/generate-tiles.ts` — Tile generation pipeline
- [ ] `lib/wasm/` — Rust/C WASM module
- [ ] `.github/workflows/release.yml` — Automated tile signing + publish

---

## 💡 Next Immediate Action
1. **Decide WASM language**: Rust (recommended, safety) vs. C (speed) vs. keep JS (faster dev, slower compute)
2. **Confirm data sources**: Which model (FES2022/TPXO)? Thai station data available?
3. **Set baseline accuracy**: Use current harmonic approx to establish RMSE baseline for 3 test sites
4. **Team assignment**: WASM engineer, tile pipeline, UI/UX, QA/field testing

---

**Owner**: Architecture Team  
**Status**: Awaiting approval to start Phase 1  
**Contact**: @team-lead
