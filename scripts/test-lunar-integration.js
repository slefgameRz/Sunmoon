const { calculateLunarPhase } = require('../lib/tide-service')

const tests = [
  { date: '2024-01-11T00:00:00Z', expected: { isWaxingMoon: false } }, // known new moon (should be very near new)
  { date: '2024-01-25T00:00:00Z', expected: { isWaxingMoon: true } }, // near full
  { date: '2025-10-09T00:00:00Z', expected: {} }, // today - just show
]

for (const t of tests) {
  const d = new Date(t.date)
  const res = calculateLunarPhase(d)
  console.log(t.date, '=>', res)
}
