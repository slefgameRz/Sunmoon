// Generate authoritative new/full moon times using astronomy-engine (JPL-like precision)
// Writes data/authoritative-moons.json

const fs = require('fs')
const path = require('path')

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AE = require('astronomy-engine')
  const years = [2023, 2024, 2025, 2026]
  const events = []
  for (const y of years) {
    // We'll search over the whole year: iterate months and call SearchMoonPhase forward
    // Start at Jan 1 00:00 UTC of year y
    let t = AE.MakeTime(new Date(Date.UTC(y, 0, 1, 0, 0, 0)))
    // find first new after start-1 day backward to capture if new near start
    // But simpler: loop day by day and call SearchMoonPhase forward
    let cursor = AE.MakeTime(new Date(Date.UTC(y, 0, 1)))
    const end = AE.MakeTime(new Date(Date.UTC(y+1, 0, 1)))
    while (cursor.tt < end.tt) {
      // find next New and Full from cursor
      try {
        const nextNew = AE.SearchMoonPhase(0, cursor, 40)
        const nextFull = AE.SearchMoonPhase(180, cursor, 40)
        if (nextNew && nextNew.date && new Date(nextNew.date).getUTCFullYear() === y) {
          events.push({ type: 'new', date: new Date(nextNew.date).toISOString() })
        }
        if (nextFull && nextFull.date && new Date(nextFull.date).getUTCFullYear() === y) {
          events.push({ type: 'full', date: new Date(nextFull.date).toISOString() })
        }
        // advance cursor to just after the earlier of the two to avoid finding the same event
        const nextDates = [nextNew && new Date(nextNew.date), nextFull && new Date(nextFull.date)].filter(Boolean).map(d=>d.getTime())
        if (nextDates.length === 0) break
        const minNext = Math.min(...nextDates)
        // move cursor to +1 second after minNext
        cursor = AE.MakeTime(new Date(minNext + 1000))
      } catch (e) {
        // if search fails, advance a day
        cursor = AE.MakeTime(new Date(cursor.date.getTime() + 24*3600*1000))
      }
    }
  }

  // dedupe and sort
  events.sort((a,b)=> new Date(a.date) - new Date(b.date))
  const dedup = []
  for (const e of events) {
    const key = e.type + '|' + e.date
    if (!dedup.find(x=>x.type===e.type && x.date===e.date)) dedup.push(e)
  }
  const outPath = path.join(process.cwd(), 'data', 'authoritative-moons.json')
  fs.writeFileSync(outPath, JSON.stringify(dedup, null, 2))
  console.log('Wrote', dedup.length, 'events to', outPath)
}

main().catch(err=>{ console.error(err); process.exit(1) })
