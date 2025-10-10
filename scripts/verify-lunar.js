function toJulian(d) {
  const year = d.getUTCFullYear()
  let month = d.getUTCMonth() + 1
  const day = d.getUTCDate() + (d.getUTCHours() + (d.getUTCMinutes() + d.getUTCSeconds() / 60) / 60) / 24

  let Y = year
  let M = month
  if (M <= 2) {
    Y -= 1
    M += 12
  }
  const A = Math.floor(Y / 100)
  const B = 2 - A + Math.floor(A / 4)
  const JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + day + B - 1524.5
  return JD
}

function calc(date) {
  const jd = toJulian(date)
  const T = (jd - 2451545.0) / 36525
  const deg2rad = Math.PI / 180
  const D = (297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + (T * T * T) / 545868 - (T * T * T * T) / 113065000) % 360
  const M = (357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + (T * T * T) / 24490000) % 360
  const Mp = (134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + (T * T * T) / 69699 - (T * T * T * T) / 14712000) % 360

  const phaseAngle = (180 - D
    - 6.289 * Math.sin(deg2rad * Mp)
    + 2.100 * Math.sin(deg2rad * M)
    - 1.274 * Math.sin(deg2rad * (2 * D - Mp))
    - 0.658 * Math.sin(deg2rad * (2 * D))
    - 0.214 * Math.sin(deg2rad * (2 * Mp))
    - 0.110 * Math.sin(deg2rad * D))

  const phaseNormalized = ((phaseAngle % 360) + 360) % 360
  const synodicMonth = 29.530588853
  const ageDays = (phaseNormalized / 360) * synodicMonth
  const isWaxingMoon = ageDays <= synodicMonth / 2

  let lunarPhaseKham
  if (ageDays <= 15) {
    lunarPhaseKham = Math.max(1, Math.round(ageDays))
  } else {
    lunarPhaseKham = Math.max(1, Math.round(synodicMonth - ageDays))
  }
  lunarPhaseKham = Math.min(15, lunarPhaseKham)

  return { ageDays: Number(ageDays.toFixed(3)), isWaxingMoon, lunarPhaseKham, phaseNormalized: Number(phaseNormalized.toFixed(3)) }
}

const testDates = [
  '2024-01-11T00:00:00Z', // known new moon
  '2024-01-25T00:00:00Z', // known full moon approx
  '2025-10-09T00:00:00Z', // today
  '2025-10-17T00:00:00Z'  // random future date
]

for (const ds of testDates) {
  const d = new Date(ds)
  const r = calc(d)
  console.log(ds, '=>', r)
}
