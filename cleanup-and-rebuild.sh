#!/bin/bash
# 🔧 Cleanup & Rebuild Script

echo "🧹 Step 1: ล้าง cache..."
rm -rf .next node_modules/.pnpm-debug.log .pnpm-debug.log

echo "🔨 Step 2: Build ใหม่..."
pnpm build

echo "✅ Step 3: รัน dev server..."
pnpm run dev

echo ""
echo "🌐 เข้าหน้าเว็บที่: http://localhost:3000"
echo ""
echo "💡 หากยังไม่เห็นการเปลี่ยนแปลง ให้:"
echo "   1. ปิด dev server (Ctrl+C)"
echo "   2. ล้าง browser cache (Cmd+Shift+Delete)"
echo "   3. Hard refresh (Cmd+Shift+R)"
echo "   4. รัน script นี้อีกครั้ง"
