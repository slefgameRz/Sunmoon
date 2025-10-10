const http = require('http')
const url = 'http://127.0.0.1:3002/api/debug/lunar?date=2024-01-11T00:00:00Z'

http.get(url, (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    console.log('STATUS', res.statusCode)
    try { console.log(JSON.parse(data)) } catch (e) { console.log(data) }
    process.exit(0)
  })
}).on('error', (err) => {
  console.error('ERR', err.message)
  process.exit(2)
})
