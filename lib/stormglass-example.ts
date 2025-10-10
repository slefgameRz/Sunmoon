/**
 * ตัวอย่างการใช้ Stormglass API ฟรี (150 requests/day)
 * วิธีสมัครและใช้งาน:
 * 1. ไปที่ https://stormglass.io/
 * 2. สมัครสมาชิกฟรี
 * 3. คัดลอก API Key ใส่ในไฟล์ .env.local
 */

// ตัวอย่างการเรียกใช้ Stormglass API
export async function getStormglassTideData(lat: number, lon: number, date: string) {
  const STORMGLASS_API_KEY = process.env.STORMGLASS_API_KEY
  
  if (!STORMGLASS_API_KEY) {
    console.log('No Stormglass API key - using internal prediction system')
    return null
  }

  try {
    const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lon}&start=${date}T00:00:00Z&end=${date}T23:59:59Z`
    
    const response = await fetch(url, {
      headers: {
        'Authorization': STORMGLASS_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    // แปลงข้อมูลเป็นรูปแบบที่แอปใช้
    return data.data?.map((item: any) => ({
      time: new Date(item.time).toISOString().substring(11, 16), // 'HH:mm' format for SSR/CSR consistency
      level: parseFloat(item.height.toFixed(2)),
      type: item.type // 'high' or 'low'
    })) || []
    
  } catch (error) {
    console.error('Stormglass API Error:', error)
    return null
  }
}

// ตัวอย่างการใช้งาน
export async function exampleUsage() {
  // พิกัดภูเก็ต
  const phuketLat = 7.8804
  const phuketLon = 98.3923
  const today = new Date().toISOString().split('T')[0]
  
  const tideData = await getStormglassTideData(phuketLat, phuketLon, today)
  
  if (tideData) {
    console.log('ข้อมูลจาก Stormglass API:', tideData)
  } else {
    console.log('ใช้ระบบคำนวณภายในแทน (ทำงานได้ดีเหมือนกัน!)')
  }
}

// API Limits และข้อมูล
export const STORMGLASS_INFO = {
  freeLimit: '150 requests/day',
  coverage: 'ทั่วโลกรวมทั้งไทย',
  data: 'น้ำขึ้นน้ำลง + สภาพอากาศทะเล',
  accuracy: 'สูง - จากโมเดลระดับโลก',
  signup: 'https://stormglass.io/',
  
  // ตัวอย่าง Response
  sampleResponse: {
    "data": [
      {
        "height": 2.34,
        "time": "2025-10-08T06:15:00+00:00",
        "type": "high"
      },
      {
        "height": 0.67,
        "time": "2025-10-08T12:30:00+00:00", 
        "type": "low"
      }
    ]
  }
}

export default {
  getStormglassTideData,
  exampleUsage,
  STORMGLASS_INFO
}