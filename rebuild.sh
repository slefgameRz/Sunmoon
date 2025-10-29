#!/bin/bash
# ✅ COMPLETE CLEANUP AND REBUILD SCRIPT

echo "=================================================="
echo "🧹 SUNMOON PROJECT - COMPLETE CLEANUP & REBUILD"
echo "=================================================="

# Step 1: Kill existing dev server
echo ""
echo "📍 Step 1: ปิด dev server เก่า..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Step 2: Clean all caches
echo "📍 Step 2: ล้าง cache ทั้งหมด..."
rm -rf .next .swc node_modules/.cache dist build 2>/dev/null || true
echo "   ✓ .next cleared"
echo "   ✓ .swc cleared"
echo "   ✓ node_modules/.cache cleared"

# Step 3: Build fresh
echo ""
echo "📍 Step 3: Build project ใหม่..."
pnpm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed! Please check errors above."
  exit 1
fi
echo "   ✓ Build successful!"

# Step 4: Start dev server
echo ""
echo "📍 Step 4: เริ่ม dev server..."
echo "   ⏳ Waiting for server to start..."
pnpm run dev > /tmp/sunmoon-dev.log 2>&1 &
DEV_PID=$!
sleep 10

if ps -p $DEV_PID > /dev/null; then
  echo "   ✓ Server started (PID: $DEV_PID)"
else
  echo "   ❌ Server failed to start!"
  cat /tmp/sunmoon-dev.log
  exit 1
fi

# Step 5: Verify server is running
echo ""
echo "📍 Step 5: ตรวจสอบ server..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "   ✓ Server responding on http://localhost:3000"
else
  echo "   ⚠️  Server might still be starting..."
fi

# Step 6: Instructions
echo ""
echo "=================================================="
echo "✅ READY!"
echo "=================================================="
echo ""
echo "🌐 เข้าหน้าเว็บที่: http://localhost:3000"
echo ""
echo "💡 ถ้ายังไม่เห็นการเปลี่ยนแปลง:"
echo "   1. ล้าง Browser Cache (Cmd+Shift+Delete)"
echo "   2. Hard Refresh (Cmd+Shift+R)"
echo "   3. ปิด DevTools ถ้าเปิดอยู่"
echo ""
echo "📊 สิ่งที่ควรเห็น:"
echo "   • 💧 สถานะระดับน้ำปัจจุบัน (Dropdown - OPEN)"
echo "   • 📊 ตารางระดับน้ำทุกชั่วโมง (Dropdown - CLOSED)"
echo "   • 📍 เปรียบเทียบความสูง (Dropdown - CLOSED)"
echo "   • 🌊 ข้อมูลน้ำทะเล (Dropdown - CLOSED)"
echo ""
echo "🛑 ปิด server: Ctrl+C"
echo ""
