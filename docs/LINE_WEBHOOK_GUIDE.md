# LINE Official Account Integration Guide

## ภาพรวม
SEAPALO รองรับการเชื่อมต่อกับ LINE Official Account เพื่อให้ผู้ใช้สามารถสอบถามข้อมูลน้ำขึ้นน้ำลงผ่าน LINE ได้

## การตั้งค่า LINE Official Account

### 1. สร้าง LINE Official Account
1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง Provider (ถ้ายังไม่มี)
3. สร้าง Messaging API Channel
4. กรอกข้อมูล:
   - Channel name: SEAPALO
   - Channel description: ระบบพยากรณ์น้ำขึ้นน้ำลง
   - Category: เลือกหมวดหมู่ที่เหมาะสม

### 2. ตั้งค่า Webhook
1. ในหน้า Messaging API settings
2. ไปที่ส่วน Webhook settings
3. ตั้ง Webhook URL: `https://your-domain.com/api/webhook/line`
4. เปิดใช้งาน "Use webhook"
5. Verify ว่า webhook ใช้งานได้

### 3. ดึง Credentials
1. ในหน้า Basic settings
   - คัดลอก **Channel Secret**
2. ในหน้า Messaging API
   - คัดลอก **Channel Access Token** (Long-lived)
   - ถ้ายังไม่มี ให้กด "Issue" เพื่อสร้าง

### 4. ตั้งค่า Environment Variables
1. คัดลอก `.env.example` เป็น `.env.local`
2. เพิ่ม credentials:
```bash
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_CHANNEL_SECRET=your_channel_secret_here
```

### 5. Deploy และทดสอบ
1. Deploy application ของคุณ (ต้องมี HTTPS)
2. ตั้งค่า Webhook URL ใน LINE Console
3. ทดสอบ webhook ใน LINE Console

## การใช้งาน

### คำสั่งที่รองรับ

#### 1. สอบถามข้อมูลตามสถานที่
พิมพ์ชื่อสถานที่:
- `ภูเก็ต`
- `พัทยา`
- `กรุงเทพ`
- `สมุย`
- `หัวหิน`

#### 2. สอบถามข้อมูลตามพิกัด
พิมพ์พิกัดในรูปแบบ lat,lon:
- `13.7563, 100.5018`
- `7.8804, 98.3923`

#### 3. ขอความช่วยเหลือ
พิมพ์:
- `help`
- `ช่วยเหลือ`
- `?`

### ตัวอย่างการตอบกลับ

#### ข้อมูลน้ำขึ้นลง
```
🌊 ข้อมูลน้ำขึ้น-น้ำลง: ภูเก็ต

📈 น้ำขึ้นสูงสุด: 14:30 น.
📉 น้ำลงต่ำสุด: 08:15 น.

💧 ระดับน้ำปัจจุบัน: 1.23 ม.
📊 สถานะ: น้ำขึ้น

🌙 น้ำเป็น (12 ขึ้น)

⚓ ท่าเรือใกล้ที่สุด: ท่าเรือภูเก็ต (2.5 กม.)

⏰ อัปเดต: 14:30:45
```

## API Endpoints

### GET /api/webhook/line
Health check endpoint
```bash
curl https://your-domain.com/api/webhook/line
```

Response:
```json
{
  "status": "ok",
  "service": "LINE Webhook",
  "timestamp": "2025-10-23T10:30:00.000Z"
}
```

### POST /api/webhook/line
Webhook endpoint สำหรับรับ events จาก LINE
- ตรวจสอบ signature
- จัดการข้อความจากผู้ใช้
- ส่งข้อมูลน้ำขึ้นลงกลับ

## การทดสอบ

### ทดสอบ Webhook ด้วย LINE Console
1. ไปที่ Messaging API settings
2. คลิก "Verify" ใน Webhook URL
3. ตรวจสอบว่าได้ response 200 OK

### ทดสอบการส่งข้อความ
1. Scan QR Code ของ LINE OA
2. Add เป็นเพื่อน
3. ส่งข้อความทดสอบ เช่น "ภูเก็ต"
4. รอรับข้อมูลน้ำขึ้นลง

### ทดสอบด้วย curl (development)
```bash
# Test health check
curl https://your-domain.com/api/webhook/line

# Test webhook (ต้องมี valid signature)
curl -X POST https://your-domain.com/api/webhook/line \
  -H "Content-Type: application/json" \
  -H "x-line-signature: YOUR_SIGNATURE" \
  -d '{
    "events": [{
      "type": "message",
      "message": {
        "type": "text",
        "text": "ภูเก็ต"
      },
      "replyToken": "test_token",
      "source": {
        "userId": "test_user"
      }
    }]
  }'
```

## Security

### Signature Verification
Webhook จะตรวจสอบ signature ทุกครั้งเพื่อความปลอดภัย:
- ใช้ HMAC-SHA256
- เปรียบเทียบกับ `x-line-signature` header
- ปฏิเสธ request ที่ signature ไม่ตรงกัน

### Best Practices
1. ใช้ HTTPS เสมอ
2. เก็บ Channel Secret อย่างปลอดภัย
3. ตรวจสอบ signature ทุก request
4. จำกัด rate limiting ถ้าจำเป็น

## Troubleshooting

### Webhook ไม่ทำงาน
1. ตรวจสอบว่า URL ถูกต้อง (HTTPS)
2. ตรวจสอบ environment variables
3. ดู logs ใน console
4. Verify webhook ใน LINE Console

### ไม่ได้รับข้อความตอบกลับ
1. ตรวจสอบ Channel Access Token
2. ดู error logs
3. ตรวจสอบว่า replyToken ยังใช้ได้
4. replyToken ใช้ได้ครั้งเดียว ภายใน 1 นาที

### Error: Invalid signature
1. ตรวจสอบ LINE_CHANNEL_SECRET ถูกต้อง
2. ตรวจสอบว่าไม่มีการแก้ไข request body
3. ใช้ raw body ในการคำนวณ signature

## Features

### ปัจจุบัน
- ✅ รับ-ส่งข้อความ text
- ✅ พยากรณ์น้ำขึ้นลงตามสถานที่
- ✅ รองรับภาษาไทยและอังกฤษ
- ✅ แสดงข้อมูลท่าเรือใกล้ที่สุด
- ✅ Health check endpoint

### อนาคต
- 🔄 Scheduled updates (อัปเดตทุก 2 ชั่วโมง)
- 🔄 Rich messages (Flex Message)
- 🔄 Quick Reply buttons
- 🔄 Location sharing
- 🔄 Notification settings

## Support

หากมีปัญหาหรือคำถาม:
1. ตรวจสอบ logs ใน console
2. อ่าน [LINE Messaging API Documentation](https://developers.line.biz/en/docs/messaging-api/)
3. ตรวจสอบ [LINE API Reference](https://developers.line.biz/en/reference/messaging-api/)
