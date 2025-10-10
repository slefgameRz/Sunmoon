const AE = require('astronomy-engine')

function khamFor(date) {
  const t = AE.MakeTime(new Date(date))
  const prevNew = AE.SearchMoonPhase(0, t, -30)
  const prevFull = AE.SearchMoonPhase(180, t, -30)
  const prevNewDate = prevNew.date
  const prevFullDate = prevFull.date
  const MS_PER_DAY = 1000 * 60 * 60 * 24
  const TZ_OFFSET_HOURS = 7
  function localMidnightUTC(d) {
    const utc = d.getTime()
    const tzOffsetMs = TZ_OFFSET_HOURS * 60 * 60 * 1000
    const local = new Date(utc + tzOffsetMs)
    local.setUTCHours(0, 0, 0, 0)
    return local.getTime() - tzOffsetMs
  }
  const dateLocalMid = localMidnightUTC(new Date(date))
  const newLocalMid = localMidnightUTC(prevNewDate)
  const fullLocalMid = localMidnightUTC(prevFullDate)
  const daysSinceNewLocal = Math.floor((dateLocalMid - newLocalMid) / MS_PER_DAY)
  const daysSinceFullLocal = Math.floor((dateLocalMid - fullLocalMid) / MS_PER_DAY)
  const isWaxing = daysSinceNewLocal >= 0 && daysSinceNewLocal <= Math.floor(29.530588853 / 2)
  let kham
  if (isWaxing) {
    kham = Math.min(15, Math.max(1, daysSinceNewLocal + 1))
  } else {
    kham = Math.min(15, Math.max(1, daysSinceFullLocal + 1))
  }
  return { date, prevNew: prevNewDate.toISOString(), prevFull: prevFullDate.toISOString(), daysSinceNewLocal, daysSinceFullLocal, isWaxing, kham }
}

const dates = ['2024-01-11T00:00:00Z','2024-01-25T00:00:00Z','2025-10-09T00:00:00Z']
for (const d of dates) console.log(khamFor(d))
