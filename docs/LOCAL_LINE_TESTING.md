# ทดสอบ LINE Webhook บน Local

## ปัญหา
LINE Webhook ต้องการ HTTPS URL แต่เรารันบน localhost ซึ่งเป็น HTTP

## วิธีแก้: ใช้ ngrok สร้าง HTTPS Tunnel

### 1. ติดตั้ง ngrok

#### Windows (ด้วย Chocolatey)
```powershell
choco install ngrok
```

#### หรือ Download โดยตรง
1. ไปที่ https://ngrok.com/download
2. Download สำหรับ Windows
3. แตกไฟล์และย้ายไปที่ folder ที่ต้องการ
4. เพิ่ม path ใน System Environment Variables

### 2. สมัคร ngrok (ฟรี)
1. ไปที่ https://dashboard.ngrok.com/signup
2. สมัครบัญชี (ฟรี)
3. คัดลอก Authtoken จากหน้า dashboard
4. เชื่อมต่อ authtoken:
```powershell
ngrok config add-authtoken YOUR_AUTHTOKEN
```

### 3. รัน Dev Server
```powershell
cd D:\Sunmoon
pnpm dev
```
Server จะรันที่ http://localhost:3000

### 4. เปิด ngrok Tunnel
เปิด PowerShell ใหม่:
```powershell
ngrok http 3000
```

จะได้ URL แบบนี้:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

### 5. ตั้งค่า LINE Webhook
1. ไปที่ https://developers.line.biz/console/
2. เลือก Channel ของคุณ
3. ไปที่ Messaging API → Webhook settings
4. ใส่ URL: `https://abc123.ngrok-free.app/api/webhook/line`
5. เปิดใช้งาน "Use webhook"
6. กด "Verify" เพื่อทดสอบ

### 6. ทดสอบ
1. Add LINE OA เป็นเพื่อน
2. ส่งข้อความ "ภูเก็ต"
3. จะได้รับข้อมูลน้ำขึ้นลงกลับมา

## หมายเหตุสำคัญ

### ngrok Free Plan
- ✅ ใช้ฟรีตลอดชีพ
- ✅ HTTPS tunnel
- ⚠️ URL จะเปลี่ยนทุกครั้งที่รัน (ถ้าไม่ได้ upgrade)
- ⚠️ ต้องแก้ Webhook URL ใหม่ทุกครั้ง

### ngrok Paid Plan ($8/month)
- ✅ URL คงที่ (custom subdomain)
- ✅ ไม่ต้องแก้ Webhook URL

## วิธีที่ 2: ใช้ localtunnel (ทางเลือก)

### ติดตั้ง
```powershell
npm install -g localtunnel
```

### รัน
```powershell
# Terminal 1: รัน dev server
pnpm dev

# Terminal 2: รัน localtunnel
lt --port 3000 --subdomain seapalo-test
```

จะได้ URL: https://seapalo-test.loca.lt

## วิธีที่ 3: ใช้ VS Code Port Forwarding (ง่ายที่สุด!)

### ถ้าใช้ VS Code:
1. รัน `pnpm dev`
2. กด `Ctrl+Shift+P`
3. พิมพ์ "Forward a Port"
4. เลือก port 3000
5. Right-click port → Change Port Visibility → Public
6. คัดลอก Forwarded Address (จะเป็น HTTPS)
7. ใส่ใน LINE Webhook URL

## Troubleshooting

### ngrok ไม่ทำงาน
```powershell
# ตรวจสอบว่า ngrok ติดตั้งแล้ว
ngrok version

# ตรวจสอบว่า authtoken ตั้งค่าแล้ว
ngrok config check
```

### Webhook Verification Failed
1. ตรวจสอบว่า dev server รันอยู่
2. ตรวจสอบว่า ngrok tunnel เปิดอยู่
3. ลอง GET https://your-ngrok-url.ngrok-free.app/api/webhook/line
4. ควรได้ response:
```json
{
  "status": "ok",
  "service": "LINE Webhook",
  "timestamp": "2025-10-23T..."
}
```

### ไม่ได้รับข้อความตอบกลับ
1. ดู logs ใน terminal ที่รัน `pnpm dev`
2. ตรวจสอบว่ามี LINE_CHANNEL_ACCESS_TOKEN ใน .env.local
3. ตรวจสอบว่า Channel Access Token ถูกต้อง

## Tips

### ใช้งานระยะยาว
- ถ้าใช้บ่อย แนะนำซื้อ ngrok Pro ($8/month)
- จะได้ custom subdomain คงที่
- หรือ deploy ไป Vercel/Railway (ฟรี + มี HTTPS)

### Debug
```powershell
# ดู request ที่เข้ามา
# ngrok จะแสดง Web Interface ที่ http://127.0.0.1:4040
# เปิดเบราว์เซอร์ไปที่ URL นี้เพื่อดู request/response
```

## Quick Start (สรุป)

```powershell
# Terminal 1: รัน dev server
cd D:\Sunmoon
pnpm dev

# Terminal 2: รัน ngrok
ngrok http 3000

# คัดลอก HTTPS URL จาก ngrok
# ไปตั้งค่าใน LINE Console → Webhook URL
# เช่น: https://abc123.ngrok-free.app/api/webhook/line

# ทดสอบส่งข้อความใน LINE OA
```

เท่านี้ก็พร้อมทดสอบแล้ว! 🎉
