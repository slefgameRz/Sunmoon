# 🌊 SEAPALO - ระบบวิเคราะห์ระดับน้ำอัจฉริยะ

SEAPALO เป็นแอปพลิเคชันพยากรณ์น้ำขึ้นน้ำลงที่ใช้ข้อมูลจริงและอัลกอริธึมการคำนวณขั้นสูงสำหรับพื้นที่ชายฝั่งในประเทศไทย

## ✨ คุณสมบัติหลัก

### 🌙 การคำนวณระบบจันทรคติไทยที่แม่นยำ
- คำนวณวันขึ้นและแรมตามปฏิทินจันทรคติไทยที่แม่นยำ
- วิเคราะห์อิทธิพลของดวงจันทร์ต่อระดับน้ำขึ้นน้ำลง
- แยกแยะระหว่าง "น้ำเป็น" (Spring Tide) และ "น้ำตาย" (Neap Tide)

### 🌊 ระบบพยากรณ์น้ำขึ้นน้ำลงที่ใช้ข้อมูลจริง
- รองรับ WorldTides API สำหรับข้อมูลที่แม่นยำสูงสุด
- อัลกอริธึม Harmonic Prediction ขั้นสูงสำหรับพื้นที่อ่าวไทยและทะเลอันดามัน
- คำนวณระดับน้ำปัจจุบันแบบ Real-time
- แสดงเวลาและระดับน้ำขึ้น-ลงที่แม่นยำ

### 🗺️ ระบบเลือกตำแหน่งที่ครอบคลุม
- พื้นที่ชายฝั่งยอดนิยม 15 จังหวัด
- ระบบแผนที่แบบ Interactive
- ระบบค้นหาสถานที่ด้วย OpenStreetMap
- GPS Location Detection

### 🌤️ ข้อมูลสภาพอากาศแบบ Real-time
- ใช้ OpenWeatherMap API
- ข้อมูลอุณหภูมิ, ความชื้น, และความเร็วลม
- การแสดงผลภาษาไทย

### 📊 การแสดงผลแบบ Interactive
- กราฟิกแสดงระดับน้ำแบบ Animated
- Tooltip ข้อมูลโดยละเอียด
- Dark/Light Mode
- Responsive Design

### 📡 แจ้งเตือนผ่าน LINE Official Account
- โครงสร้างพร้อมใช้งานสำหรับเชื่อมต่อ LINE Messaging API
- ส่งข้อความอัปเดตสภาพอากาศ/ระดับน้ำทุก 2 ชั่วโมง (รองรับ Cron job)
- Endpoint `/api/line/weather-update` สำหรับ manual trigger หรือ scheduler
- Webhook `/api/line/webhook` สำหรับรับ event จาก LINE (สมัคร/ยกเลิก/ขออัปเดต)

## 🚀 การติดตั้งและใช้งาน

### ข้อกำหนดของระบบ
- Node.js 18.0 หรือสูงกว่า
- pnpm (แนะนำ) หรือ npm

### การติดตั้ง

1. **Clone Repository**
   ```bash
   git clone https://github.com/slefgameRz/Sunmoon.git
   cd Sunmoon
   ```

2. **ติดตั้ง Dependencies**
   ```bash
   pnpm install
   # หรือ
   npm install
   ```

3. **ตั้งค่า Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   
   แก้ไขไฟล์ `.env.local`:
   ```env
   # จำเป็น - สำหรับข้อมูลสภาพอากาศ
   OPENWEATHER_API_KEY=your_openweather_api_key
   
   # เสริม - สำหรับความแม่นยำของข้อมูลน้ำขึ้นน้ำลง
   WORLDTIDES_API_KEY=your_worldtides_api_key

   # LINE Official Account
   LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
   LINE_CHANNEL_SECRET=your_line_channel_secret
   LINE_DISPATCH_TOKEN=optional_bearer_token_for_weather_endpoint
   LINE_DEFAULT_LAT=13.7563
   LINE_DEFAULT_LON=100.5018
   LINE_DEFAULT_LOCATION_NAME=กรุงเทพมหานคร
   LINE_SEEDED_USER_IDS=user1,user2  # รายชื่อ userId ที่ให้ระบบส่ง push ได้ทันที (ไม่บังคับ)
   ```

4. **เริ่มใช้งาน**
   ```bash
   pnpm run dev
   # หรือ
   npm run dev
   ```
   
   เปิดเบราว์เซอร์ที่ [http://localhost:3000](http://localhost:3000)

## 🔧 การได้รับ API Keys

### OpenWeatherMap API (จำเป็น)
1. สมัครสมาชิกที่ [OpenWeatherMap](https://openweathermap.org/api)
2. สมัครแผน Free (5 วัน พยากรณ์ / 3 ชั่วโมง)
3. คัดลอก API Key ใส่ในไฟล์ `.env.local`

### WorldTides API (เสริม)
1. สมัครสมาชิกที่ [WorldTides](https://www.worldtides.info/)
2. แผน Free มี 100 คำขอต่อเดือน
3. เพิ่มความแม่นยำของข้อมูลน้ำขึ้นน้ำลง

## 🏗️ โครงสร้างโปรเจค

```
Sunmoon/
├── app/                     # Next.js App Router
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── actions/                # Server Actions
│   └── get-location-forecast.ts
├── components/             # React Components
│   ├── ui/                 # Shadcn/ui components
│   ├── location-selector.tsx
│   ├── map-selector.tsx
│   ├── tide-animation.tsx
│   └── theme-provider.tsx
├── lib/                    # Utility libraries
│   ├── tide-service.ts     # หัวใจของระบบพยากรณ์
│   └── utils.ts            # Helper functions
└── public/                 # Static assets
```

## 🧠 อัลกอริธึมหลัก

### การคำนวณวันจันทรคติไทย
```typescript
function calculateLunarPhase(date: Date): { isWaxingMoon: boolean; lunarPhaseKham: number }
```
- ใช้ Synodic Month (29.53059 วัน)
- คำนวณจากจุดอ้างอิง New Moon ที่ทราบแน่นอน
- แม่นยำสำหรับการคาดการณ์ระยะยาว

### Harmonic Prediction สำหรับพื้นที่ไทย
```typescript
function generateHarmonicTidePrediction(location: LocationData, date: Date)
```
- แยกระบบ Diurnal (อ่าวไทย) และ Semidiurnal (อันดามัน)
- ปรับค่าด้วยปัจจัย Spring/Neap Tide
- รองรับการคำนวณระดับน้ำปัจจุบันแบบ Real-time

## 🌊 พื้นที่ชายฝั่งที่รองรับ

**อ่าวไทย (Gulf of Thailand)**
- กรุงเทพมหานคร, ชลบุรี, ประจุวบคีรีขันธ์
- เกาะสมุย, เกาะเต่า, เกาะพงัน
- รูปแบบ Diurnal (น้ำขึ้น-ลง 1 ครั้งต่อวัน)

**ทะเลอันดามัน (Andaman Sea)**
- ภูเก็ต, กระบี่, ตรัง, สตูล
- เกาะพีพี, เกาะลันตา
- รูปแบบ Semidiurnal (น้ำขึ้น-ลง 2 ครั้งต่อวัน)

## 📱 การใช้งาน

1. **เลือกตำแหน่ง**: ใช้ dropdown สำหรับพื้นที่ยอดนิยม หรือเลือกจากแผนที่
2. **เลือกวันที่และเวลา**: ระบุช่วงเวลาที่ต้องการทราบข้อมูล
3. **ดูผลการพยากรณ์**: 
   - ข้อมูลระดับน้ำปัจจุบัน
   - เวลาน้ำขึ้น-ลงในวันนั้น
   - สถานะจันทรคติและอิทธิพลต่อกระแสน้ำ
   - สภาพอากาศปัจจุบัน

## � การใช้งาน LINE OA

1. ตั้งค่า Webhook URL ใน LINE Developers เป็น `https://<your-domain>/api/line/webhook`
2. ใส่ค่า `LINE_CHANNEL_ACCESS_TOKEN` และ `LINE_CHANNEL_SECRET` ใน `.env.local`
3. (ตัวเลือก) ตั้งค่า `LINE_DISPATCH_TOKEN` เพื่อป้องกัน endpoint `/api/line/weather-update`
4. เพิ่ม Cron Job (เช่น Vercel Cron, GitHub Actions, Windows Task Scheduler) ให้เรียก `POST /api/line/weather-update` ทุก 2 ชั่วโมง พร้อม `Authorization: Bearer <LINE_DISPATCH_TOKEN>`
5. ผู้ใช้สามารถพิมพ์ "อัปเดต" ใน LINE OA เพื่อรับข้อมูลล่าสุดทันที หรือพิมพ์ "หยุด" เพื่อยกเลิกการรับแจ้งเตือน

## �🔄 การปรับปรุงล่าสุด

### การใช้ข้อมูลจริง (Real Data Implementation)
- ✅ แทนที่ข้อมูล Mock ด้วยอัลกอริธึมคำนวณที่แม่นยำ
- ✅ รองรับ WorldTides API สำหรับข้อมูลระดับโลก
- ✅ ระบบคำนวณจันทรคติไทยที่ถูกต้อง
- ✅ Harmonic Analysis สำหรับแต่ละภูมิภาค

### การลดขนาดข้อมูล (Payload Reduction)
- ✅ แปลงผลลัพธ์ OpenWeather ให้เป็นโครงสร้างแบบย่อ (เฉพาะฟิลด์ที่จำเป็น) ก่อนส่งให้ UI
- ✅ ปัดค่าตัวเลขให้สั้นลง (เช่น `temp`, `wind.speed`) ลดขนาด JSON บนมือถือ
- ✅ ใช้โครงสร้างข้อมูลกราฟ 24 จุดต่อวัน (เพียงพอและเบา)

### การเข้าถึงและใช้งานบนมือถือ (Accessibility & Mobile)
- ✅ เพิ่ม `viewport` meta และลิงก์ “ข้ามไปยังเนื้อหา” เพื่อช่วยผู้อ่านหน้าจอ
- ✅ เชื่อม `Label` กับ `Input` ด้วย `htmlFor` และ `id` อย่างถูกต้อง
- ✅ เพิ่ม `aria-live` ในส่วนที่มีการอัปเดตแบบสด เช่น สถานะน้ำปัจจุบัน/เวลาอัปเดต
- ✅ ซ่อนไอคอนตกแต่งจาก screen reader ด้วย `aria-hidden`

### Center Gateway (Digital ↔ Analog)
- ✅ เพิ่ม API แบบ compact สำหรับศูนย์กลาง: `GET/POST /api/center-gateway`
- ✅ รูปแบบเฟรมแบบย่อ: `{ k: "u"|"s", t: <epoch_ms>, p: { ... } }`
- ✅ โมดูลตัวอย่าง `lib/center-gateway.ts` สำหรับบีบอัด/ขยายข้อมูลน้ำ และ stub การเข้ารหัส/ถอดรหัสไบต์ (เตรียมต่อกับ AFSK/DTMF/PSTN/วิทยุ)
- ⚠️ ฟีเจอร์นี้ยังเป็นต้นแบบเพื่อการสาธิต ไม่ได้เชื่อมต่อระบบฉุกเฉินจริง

การใช้งานเบื้องต้น:
- ส่งข้อมูลเข้า Center ผ่าน `POST /api/center-gateway` ด้วยเฟรมแบบย่อ (เช่น `{ k: "u", t: 169..., p: { wl: 1.25, ws: "ขึ้น" } }`)
- ดึงสถานะล่าสุดผ่าน `GET /api/center-gateway` (ตอบกลับเป็นเฟรมแบบย่อ ขนาดเล็ก เหมาะกับลิงก์แบนด์วิดท์ต่ำ)

### การแก้ไขข้อบกพร่อง (Bug Fixes)
- ✅ แก้ไข TypeScript type errors
- ✅ ปรับปรุงระบบ Error handling
- ✅ เพิ่มประสิทธิภาพการคำนวณ
- ✅ แก้ไข Memory leaks และ Performance issues

## 🚀 การ Deploy

### Vercel (แนะนำ)
```bash
pnpm run build
pnpm start
```

### Environment Variables สำหรับ Production
```env
OPENWEATHER_API_KEY=your_production_key
WORLDTIDES_API_KEY=your_production_key
```

## 🧪 การทดสอบ

### Smoke Test
รันการทดสอบพื้นฐานเพื่อตรวจสอบว่าแอปพลิเคชันทำงานได้ปกติ:

```bash
node smoke-test.js
```

### การทดสอบด้วยตนเอง
1. เปิดแอปพลิเคชันที่ [http://localhost:3000](http://localhost:3000)
2. เลือกตำแหน่งจากรายการหรือใช้แผนที่
3. เปลี่ยนวันที่และเวลาเพื่อดูการอัพเดตแบบ Real-time
4. ตรวจสอบข้อมูลน้ำขึ้นน้ำลงและสภาพอากาศ

## 🔧 การแก้ปัญหา

### ปัญหาที่พบบ่อย

**ไม่สามารถโหลดข้อมูลได้**
- ตรวจสอบว่าได้ตั้งค่า `OPENWEATHER_API_KEY` ใน `.env.local` แล้วหรือไม่
- ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
- ลองรีโหลดหน้าเว็บ

**แผนที่ไม่แสดงผล**
- ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
- ลองใช้เบราว์เซอร์อื่น
- ตรวจสอบ Console ใน Developer Tools

**ข้อมูลน้ำขึ้นน้ำลงไม่แม่นยำ**
- หากไม่ได้ตั้งค่า `WORLDTIDES_API_KEY` ระบบจะใช้การคำนวณแบบ Harmonic Prediction
- เพิ่ม API Key ของ WorldTides เพื่อความแม่นยำสูงสุด

**แอปทำงานช้า**
- ลดจำนวนการเปลี่ยนตำแหน่งหรือเวลาบ่อยๆ
- ตรวจสอบการใช้งาน CPU และ Memory

### Debug Mode
เปิด Developer Tools ในเบราว์เซอร์ (F12) เพื่อดู Console และ Network tabs สำหรับข้อมูลเพิ่มเติม

## 📚 เทคโนโลยีที่ใช้

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui
- **Maps**: Pigeon Maps (OpenStreetMap)
- **API Integration**: OpenWeatherMap, WorldTides
- **Date Handling**: date-fns with Thai locale
- **Deployment**: Vercel

## 📄 License

MIT License - ดูรายละเอียดใน `LICENSE` file

## 💡 การสนับสนุน

หากพบปัญหาหรือต้องการข้อมูลเพิ่มเติม:
- สร้าง Issue ใน GitHub
- ติดต่อผ่าน [GitHub Profile](https://github.com/slefgameRz)

---

**หมายเหตุ**: แอปพลิเคชันนี้ใช้สำหรับการอ้างอิงเท่านั้น ไม่ควรใช้สำหรับการเดินเรือหรือกิจกรรมทางทะเลที่ต้องการความแม่นยำสูง กรุณาตรวจสอบข้อมูลจากแหล่งอย่างเป็นทางการเพิ่มเติม
