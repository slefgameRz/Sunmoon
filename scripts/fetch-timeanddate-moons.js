// downloads and parses timeanddate moon phase pages for Bangkok for given years
// writes data/authoritative-moons.json as [{type:'new'|'full', date:'ISO string UTC'}...]

const https = require('https')
const fs = require('fs')
const { JSDOM } = require('jsdom')
const path = require('path')

async function fetchUrl(url) {
  return new Promise((res, rej) => {
    https.get(url, (r) => {
      let body = ''
      r.on('data', (c) => (body += c))
      r.on('end', () => res(body))
      r.on('error', rej)
    })
  })
}

function parsePage(html, year) {
  // Use a forgiving regex-based parser: extract occurrences of "New Moon on ..." and "Full Moon on ..."
  const results = []
  const re = /(?:New Moon|Full Moon) on[^\n<]*?(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})[,\s]*?(\d{1,2}:\d{2})/ig
  let m
  while ((m = re.exec(html)) !== null) {
    const day = parseInt(m[1], 10)
    const monthName = m[2]
    const yearStr = m[3]
    const timeStr = m[4]
    const type = /New Moon/i.test(m[0]) ? 'new' : 'full'
    const months = {
      January:1,February:2,March:3,April:4,May:5,June:6,July:7,August:8,September:9,October:10,November:11,December:12
    }
    const mnum = months[monthName]
    if (!mnum) continue
    // Build a Date using the local Bangkok date/time, then convert to UTC (subtract 7 hours)
    const local = new Date(Date.UTC(parseInt(yearStr,10), mnum-1, day, ...timeStr.split(':').map(Number)))
    const utc = new Date(local.getTime() - 7*60*60*1000)
    results.push({ type, date: utc.toISOString() })
  }

  // Some pages include short phrases like "Full Moon on 7 October 10:47" without weekday; additional regex:
  const re2 = /(?:New Moon|Full Moon) on[^\n<]*?(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})?[,\s]*?(\d{1,2}:\d{2})/ig
  while ((m = re2.exec(html)) !== null) {
    const day = parseInt(m[1], 10)
    const monthName = m[2]
    const yearStr = m[3] ? m[3] : year.toString()
    const timeStr = m[4]
    const type = /New Moon/i.test(m[0]) ? 'new' : 'full'
    const months = {
      January:1,February:2,March:3,April:4,May:5,June:6,July:7,August:8,September:9,October:10,November:11,December:12
    }
    const mnum = months[monthName]
    if (!mnum) continue
    const local = new Date(Date.UTC(parseInt(yearStr,10), mnum-1, day, ...timeStr.split(':').map(Number)))
    const utc = new Date(local.getTime() - 7*60*60*1000)
    results.push({ type, date: utc.toISOString() })
  }

  return results
}

async function main() {
  const years = [2023,2024,2025,2026]
  const all = []
  for (const y of years) {
    const url = `https://www.timeanddate.com/moon/phases/thailand/bangkok?year=${y}`
    console.log('fetch', url)
    const html = await fetchUrl(url)
    const parsed = parsePage(html, y)
    console.log('parsed', y, parsed.length, 'items')
    all.push(...parsed)
  }
  // sort by date
  all.sort((a,b)=> new Date(a.date) - new Date(b.date))
  const outPath = path.join(process.cwd(), 'data', 'authoritative-moons.json')
  fs.writeFileSync(outPath, JSON.stringify(all, null, 2))
  console.log('Wrote', all.length, 'events to', outPath)
}

main().catch(err=>{
  console.error(err)
  process.exit(1)
})
