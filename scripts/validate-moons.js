const fs = require('fs')
const path = require('path')
// require the Tide service via a small loader that uses Node's require with transpiled code
// Our tide-service is TypeScript; import via esm require by using ts-node/register is heavy.
// Instead, we'll call the calculateLunarPhase via a small child-process node that uses astronomy-engine directly
// to reproduce the mapping logic (same logic as in lib/tide-service). This avoids TS runtime import issues.

const AE = require('astronomy-engine')

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'authoritative-moons.json'), 'utf8'))

function localDateIndexMs(date, tzHours = 7) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24
  const TZ_OFFSET_MS = tzHours * 60 * 60 * 1000
  return Math.floor((new Date(date).getTime() + TZ_OFFSET_MS) / MS_PER_DAY) * MS_PER_DAY - TZ_OFFSET_MS
}

function calculateWithAE(date) {
  const t = AE.MakeTime(date)
  const prevNew = AE.SearchMoonPhase(0, t, -30)
  const prevFull = AE.SearchMoonPhase(180, t, -30)
  const MS_PER_DAY = 1000 * 60 * 60 * 24
  const synodicMonth = 29.530588853
  
  if (!prevNew || !prevFull) return { error: 'ae_search_failed' }

  const prevNewDate = prevNew.date
  const prevFullDate = prevFull.date

  const dateLocalIdx = localDateIndexMs(date)
  const newLocalIdx = localDateIndexMs(prevNewDate)
  const fullLocalIdx = localDateIndexMs(prevFullDate)

  const daysSinceNewLocal = Math.floor((dateLocalIdx - newLocalIdx) / MS_PER_DAY)
  const daysSinceFullLocal = Math.floor((dateLocalIdx - fullLocalIdx) / MS_PER_DAY)
  // include day 15 in waxing to match Thai calendrical convention
  const isWaxing = daysSinceNewLocal >= 0 && daysSinceNewLocal <= 15
  let kham
  if (isWaxing) kham = Math.min(15, Math.max(1, daysSinceNewLocal + 1))
  else kham = Math.min(15, Math.max(1, daysSinceFullLocal + 1))

  return { isWaxing, kham, prevNew: prevNewDate.toISOString(), prevFull: prevFullDate.toISOString(), daysSinceNewLocal, daysSinceFullLocal }
}

const mismatches = []
for (const entry of data) {
  const eventDate = new Date(entry.date)
  // test at local-midnight of that event's date in Bangkok
  const testIndexMs = localDateIndexMs(eventDate)
  const testDate = new Date(testIndexMs)
  const result = calculateWithAE(testDate)
  if (result.error) {
    mismatches.push({ entry, reason: result.error })
    continue
  }

  if (entry.type === 'new') {
    // New moon should map to ขึ้น 1 (kham 1) and be in waxing period
    if (!(result.isWaxing && result.kham === 1)) {
      mismatches.push({ entry, testDate: testDate.toISOString(), result })
    }
  } else if (entry.type === 'full') {
    // Full moon should map to ขึ้น 15 (kham 15) and be in waxing period
    if (!(result.isWaxing && result.kham === 15)) {
      mismatches.push({ entry, testDate: testDate.toISOString(), result })
    }
  }
}

if (mismatches.length === 0) {
  console.log('All authoritative events mapped to kham 1 as expected.')
  process.exit(0)
} else {
  console.log('Found', mismatches.length, 'mismatches:')
  console.log(JSON.stringify(mismatches.slice(0,20), null, 2))
  process.exit(2)
}
