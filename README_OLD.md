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
-   Responsive design
-   Dark mode toggle

## Getting Started

1.  **Clone the repository:**
    \`\`\`bash
    git clone <repository-url>
    cd thai-weather-app
    \`\`\`

2.  **Install dependencies:**
    \`\`\`bash
    npm install
    # or
    yarn install
    \`\`\`

3.  **Set up Environment Variables:**
    This project uses the OpenWeatherMap API. You'll need to get an API key from [OpenWeatherMap](https://openweathermap.org/api).

    Create a `.env.local` file in the root of your project and add your API key:
    \`\`\`
    OPENWEATHER_API_KEY=your_openweathermap_api_key_here
    \`\`\`

4.  **Run the development server:**
    \`\`\`bash
    npm run dev
    # or
    yarn dev
    \`\`\`

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

-   `app/`: Next.js App Router pages and layout.
-   `actions/`: Server Actions for data fetching (e.g., `get-location-forecast.ts`).
-   `components/`: Reusable React components, including Shadcn UI components.
-   `lib/`: Utility functions (e.g., `utils.ts` for `cn` function).
-   `public/`: Static assets.
-   `styles/`: Global CSS.

## API Limitations

Please note that the free tier of OpenWeatherMap API only provides current weather data. Therefore, the "Significant Advance Forecast" section for weather will always display current conditions. For historical or future weather forecasts with specific times, a paid plan or a different API would be required.

## Contributing

Feel free to contribute by opening issues or pull requests.
