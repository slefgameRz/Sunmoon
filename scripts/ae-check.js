const AE = require('astronomy-engine')

function show(dateStr) {
  const d = new Date(dateStr)
  const t = AE.MakeTime(d)
  console.log('Input:', dateStr)
  console.log('MoonPhase(angle deg):', AE.MoonPhase(t))
  const nextNew = AE.SearchMoonPhase(t, AE.MoonPhase.NEW)
  const nextFull = AE.SearchMoonPhase(t, AE.MoonPhase.FULL)
  console.log('Next NEW:', AE.AstroTimeToString(nextNew))
  console.log('Next FULL:', AE.AstroTimeToString(nextFull))
}

show('2024-01-11T00:00:00Z')
show('2024-01-25T00:00:00Z')
show('2025-10-09T00:00:00Z')
