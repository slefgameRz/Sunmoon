# 🧪 Test Suite - CLI Calculation Tests

This directory contains standalone CLI tests for validating the Sunmoon Tide Prediction System core functionality.

## 📋 Test Files

### 1. `harmonic-calculation-test.js`
Tests the harmonic tide prediction engine with real-world Thai locations.

**What it tests:**
- Astronomical arguments calculation (Julian dates, solar/lunar elements)
- Harmonic constituent database (37 constituents)
- Nodal factors and corrections
- Water level predictions for multiple locations
- Tidal curve generation (24-hour forecast)

**Run:**
```bash
node tests/harmonic-calculation-test.js
```

**Output example:**
```
🌊 HARMONIC TIDE CALCULATION TEST
======================================================================

📍 Test 1: Bangkok (Khlong Toei)
   Coordinates: 13.6427°N, 100.5976°E
   Constituents: M2, S2, N2, K1, O1

⏰ Hourly Water Level Predictions:
   Hour | Time  | Level (m) | Absolute (m)
   ──────────────────────────────────────────────
   00 | 00:00 |    -0.523 | 0.48
   03 | 03:00 |     0.156 | 1.16
   06 | 06:00 |     0.421 | 1.42
   ...

📈 Statistics:
   High tide: 1.89m
   Low tide: 0.12m
   Tidal range: 1.77m
   Mean level: 1.00m (MSL)

   ✅ Test passed - calculation complete
```

---

### 2. `storage-compression-test.js`
Tests data storage, compression algorithms, and LRU cache management.

**What it tests:**
- Deflate compression with various data sizes
- SHA-256 cryptographic hashing
- HMAC-SHA256 signing for manifest authentication
- LRU cache eviction policy (oldest items removed)
- Tile manifest creation and compression statistics

**Run:**
```bash
node tests/storage-compression-test.js
```

**Output example:**
```
💾 STORAGE & COMPRESSION TEST
======================================================================

📦 COMPRESSION TESTS
✅ Test 1: Deflate: Small data
   original: 78 bytes
   compressed: 65 bytes
   ratio: 16.7%

✅ Test 2: Deflate: Large data
   original: 4256 bytes
   compressed: 1821 bytes
   ratio: 57.2%

✅ Test 3: SHA-256 Hash
   input: {"level":1.234,"time":"2025-10-19T12:00:00Z"}
   output: 3f4c8a9b...
   length: 64

✅ Test 4: HMAC-SHA256 Sign
   dataLength: 78
   secretLength: 17
   signatureLength: 64

🗂️  LRU CACHE TESTS
Cache Stats:
  Size: 5/5
  Utilization: 100.0%
  Remaining items: tile_3, tile_4, tile_5, tile_6, tile_7

  ✅ LRU eviction working - oldest items removed

📍 TILE MANIFEST TESTS
✅ Tile 13.15,100.82 - added and compressed
✅ Tile 13.16,100.83 - added and compressed
✅ Tile 13.17,100.84 - added and compressed

Manifest Stats:
  Total tiles: 3
  Compressed: 3/3
  Original size: 1248 bytes
  Compressed size: 756 bytes
  Total savings: 39.4%
```

---

### 3. `integration-test.js`
End-to-end integration test combining all components.

**What it tests:**
- Harmonic constituent database validation
- Multi-location tide predictions
- Data compression pipeline
- Cryptographic hashing
- Tile manifest signing with HMAC
- Complete end-to-end workflow
- Performance metrics

**Run:**
```bash
node tests/integration-test.js
```

**Output example:**
```
🔗 INTEGRATION TEST - END-TO-END SYSTEM
======================================================================

Starting all storage and compression tests...

✅ Test 1: Harmonic Constituent Database
   constituents: 7
   validated: M2, S2, N2, K1, O1, M4, MN4

✅ Test 2: Multi-Location Predictions
   locations: 3
   predictions: Bangkok (24h), Ko Sichang (24h), Phuket (24h)

✅ Test 3: Data Compression Pipeline
   originalSize: 2468 bytes
   compressedSize: 1123 bytes
   compressionRatio: 54.5%
   pipelineStatus: Working correctly

✅ Test 4: Cryptographic Hashing (SHA-256)
   input: Bangkok,13.6427,100.5976,2025-10-19
   outputLength: 64 hex chars
   sample: 9f8a7c6b...

✅ Test 5: Tile Manifest Signing (HMAC)
   manifestSize: 1847 bytes
   tileCount: 3
   signatureLength: 64 hex chars
   sample: e3d4c5b6...

✅ Test 6: End-to-End Workflow
   steps: 10
   workflow:
       ✓ Load tide constituent database
       ✓ Calculate predictions for 3 locations
       ✓ Generate 24-hour forecast
       ✓ Compress prediction data
       ✓ Calculate compression ratio
       ✓ Generate manifest hash
       ✓ Create HMAC signature
       ✓ Package tiles
       ✓ Ready for cache storage

✅ Test 7: Performance Metrics
   harmonicCalcTime: 45ms (1M calculations)
   compressionTime: 12ms (100KB data)
   calculationSpeed: 22222 ops/sec
   compressionSpeed: 8.3 MB/sec
```

---

## 🚀 Running All Tests

**Run all tests in sequence:**
```bash
node tests/harmonic-calculation-test.js && \
node tests/storage-compression-test.js && \
node tests/integration-test.js
```

**Or use npm scripts:**
```bash
npm run test:harmonic    # Run harmonic calculations test
npm run test:storage     # Run storage and compression test
npm run test             # Run integration test
npm run test:all         # Run all tests in sequence
```

---

## 🌏 UTF-8 Encoding (International Character Support)

The tests include emoji and special Unicode characters (°, ─, │, etc.) which require UTF-8 encoding.

### Windows PowerShell Setup

**Option 1: Using PowerShell script** (recommended for the session):
```powershell
# Run in PowerShell
.\set-utf8-encoding.ps1
# Then run tests
npm run test:harmonic
```

**Option 2: Manual setup** (for individual commands):
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
npm run test:harmonic
```

**Option 3: Batch file setup** (command prompt):
```cmd
# Run in cmd.exe
set-utf8-encoding.bat
npm run test:harmonic
```

### macOS / Linux
UTF-8 is usually enabled by default:
```bash
npm run test:harmonic
```

### Troubleshooting Character Encoding

**Issue:** Emoji/special characters appear garbled (e.g., `โ` instead of `┌`)

**Solution:** Check your terminal encoding:

```powershell
# Check current encoding
[Console]::OutputEncoding

# Fix it
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Verify
npm run test:harmonic
```

**Note:** Each PowerShell session needs encoding reset, or use the `set-utf8-encoding.ps1` script.

---

## Run All Tests

**Run all tests in sequence:**
```bash
node tests/harmonic-calculation-test.js && \
node tests/storage-compression-test.js && \
node tests/integration-test.js
```

---

## 📊 What Each Test Validates

| Test | Component | Validates |
|------|-----------|-----------|
| Harmonic | Engine | 37 constituents, nodal corrections, Doodson numbers, water level math |
| Storage | Cache | LRU eviction, compression ratio, manifest integrity |
| Integration | System | End-to-end workflow, performance, all components working together |

---

## ✅ Expected Results

All tests should output:
- ✅ Status indicators for passed tests
- 📊 Detailed metrics and statistics
- ⏱️ Performance timings
- 🎯 Validation confirmations

**Test Success Criteria:**
- All calculations mathematically correct
- Compression ratio > 30% for typical data
- LRU cache eviction working properly
- Cryptographic hashes exactly 64 hex characters
- HMAC signatures verifiable
- Complete workflow executable in < 500ms total

---

## 🔍 Troubleshooting

**If tests fail:**
1. Ensure Node.js 18+ is installed: `node --version`
2. Verify crypto and zlib modules are available: `node -e "require('crypto'); require('zlib')"`
3. Check file permissions in the tests/ directory
4. Run with explicit path: `node /absolute/path/to/test-file.js`

---

## 📝 Notes

- Tests use real geographic coordinates for Thai locations
- Calculations are based on astronomical algorithms (Meeus)
- Compression uses Node.js built-in zlib (deflate)
- No external API calls - all computation is local
- Tests are independent and can be run separately

---

**Last Updated:** October 19, 2025  
**Test Framework:** Node.js built-in modules (crypto, zlib)  
**Status:** ✅ All tests ready for execution
