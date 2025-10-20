# วิธีทดสอบหลังแก้ไข UI

## ✅ สิ่งที่แก้ไขแล้ว

### 1. Dropdown เวลาแสดงค่าที่เลือก
- เปลี่ยนสีข้อความเป็น `text-white` เพื่อให้เห็นชัดบนพื้นหลังสีฟ้า
- SelectValue จะแสดงเวลาที่เลือกอัตโนมัติ

### 2. แก้ Error "ไม่พบข้อมูล"
- ลบ throw Error ออกแล้ว
- เพิ่ม guard ให้รอจนกว่าจะมี selectedDate
- ใช้ fallback แทนการ throw

### 3. กราฟมี Tooltip
- Hover (desktop): แสดง tooltip พร้อมเวลาและระดับน้ำ
- Touch (mobile): แตะค้างหรือลากนิ้ว tooltip จะตาม

## 🚀 วิธีทดสอบ

### ขั้นที่ 1: เริ่ม Dev Server ใหม่
```powershell
cd D:\Sunmoon
pnpm run dev
```

### ขั้นที่ 2: เปิดเบราว์เซอร์
1. ไปที่ http://localhost:3000
2. กด **Ctrl+Shift+Delete** เลือก:
   - ✅ Cached images and files
   - ✅ Cookies and other site data
   - เลือก "All time"
   - กด Clear data

3. หรือกด **Ctrl+F5** (Hard Refresh)

### ขั้นที่ 3: ทดสอบ Dropdown
1. คลิกเลือก **ชั่วโมง** → เลือกเวลา → ดูว่าตัวเลขแสดงใน dropdown หรือไม่
2. คลิกเลือก **นาที** → เลือก 00/15/30/45 → ดูว่าตัวเลขแสดงหรือไม่

**✅ ถูกต้อง:** dropdown จะแสดงตัวเลขสีขาว เช่น "12" หรือ "00"

### ขั้นที่ 4: ทดสอบกราฟ

#### บนคอมพิวเตอร์:
- เลื่อนเมาส์ไปบนกราฟ
- จะเห็น:
  - เส้นแนวตั้งสีเทา
  - วงกลมขาวที่จุดข้อมูล
  - กล่องดำแสดง "เวลา" และ "น้ำระดับ: X.XX ม."

#### บนมือถือ:
- แตะค้างหรือลากนิ้วบนกราฟ
- tooltip จะตามนิ้ว

### ขั้นที่ 5: ตรวจสอบ Console (F12)
เปิด DevTools Console ดูว่ามี error "ไม่พบข้อมูล" หรือไม่

**✅ ถูกต้อง:** ไม่มี error แดง, มีแต่ console.debug สีฟ้า

## 🔧 ถ้ายังไม่หาย

### ปัญหา: เวลายังไม่แสดงใน Dropdown
**วิธีแก้:**
```powershell
# ลบ cache ทั้งหมด
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.cache

# Rebuild
npm run build

# เริ่มใหม่
pnpm run dev
```

### ปัญหา: ยังเห็น Error "ไม่พบข้อมูล"
1. ตรวจสอบว่า error มาจากบรรทัดไหน (ดูใน Console)
2. Hard refresh เบราว์เซอร์: Ctrl+Shift+R (หรือ Ctrl+F5)
3. Clear Service Worker:
   - F12 → Application tab
   - Service Workers → Unregister

### ปัญหา: Tooltip ไม่แสดง
1. เช็คว่ากราฟมีข้อมูลหรือไม่ (ต้องมีเส้นกราฟ)
2. ลองคลิกกดค้างแทนการเลื่อน
3. บนมือถือ: ลองลากนิ้วแทนการแตะ

## 📸 ตัวอย่างภาพหน้าจอที่ควรเห็น

### Dropdown ที่ถูกต้อง:
```
[Dropdown] ↓  12   :  00
           ↑       ↑
      ตัวเลขสีขาว เห็นชัด
```

### กราฟ tooltip:
```
      |  ← เส้นแนวตั้ง
      ●  ← วงกลมขาว
  ┌────────┐
  │ 12:00  │ ← tooltip สีดำ
  │ น้ำ: 2.5 ม. │
  └────────┘
```

## 🆘 ติดต่อสำหรับความช่วยเหลือ

ถ้ายังมีปัญหา ส่งข้อมูลเหล่านี้มา:
1. Screenshot ของ dropdown
2. Screenshot ของ Console (F12)
3. บอกว่าใช้โหมด Light หรือ Dark
4. ขั้นตอนที่ทำก่อนเจอปัญหา

---

**อัปเดตล่าสุด:** 19 ตุลาคม 2025
**เวอร์ชัน:** แก้ไขสีตัวอักษร dropdown + ลบ error throw + เพิ่ม touch handlers
