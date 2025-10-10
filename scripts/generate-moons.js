const AE = require('astronomy-engine')
const fs = require('fs')

function generate(startYear = 2023, endYear = 2026) {
  const results = []
  for (let y = startYear; y <= endYear; y++) {
    // search new/full moons by scanning each month (SearchMoonPhase uses lon target)
    for (let m = 1; m <= 12; m++) {
      // approximate date in middle of month
      const mid = new Date(Date.UTC(y, m - 1, 15, 0, 0, 0))
      const t = AE.MakeTime(mid)
      // find nearest NEW around mid (search +/- 20 days)
      const newTime = AE.SearchMoonPhase(0, t, -20) || AE.SearchMoonPhase(0, t, 20)
      const fullTime = AE.SearchMoonPhase(180, t, -20) || AE.SearchMoonPhase(180, t, 20)
      if (newTime) results.push({ type: 'new', date: new Date(newTime.date).toISOString() })
      if (fullTime) results.push({ type: 'full', date: new Date(fullTime.date).toISOString() })
    }
  }
  // dedupe by date
  const map = new Map()
  for (const r of results) map.set(r.date + '|' + r.type, r)
  const arr = Array.from(map.values()).sort((a,b)=> a.date.localeCompare(b.date))
  fs.writeFileSync('data/authoritative-moons.json', JSON.stringify(arr, null, 2))
  console.log('Wrote', arr.length, 'entries to data/authoritative-moons.json')
}

generate(2023,2026)
