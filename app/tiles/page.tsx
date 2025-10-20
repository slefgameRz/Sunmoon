import { TileManagementPanel } from '@/components/tile-management-panel'

export default function TilesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 py-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            จัดการไทล์ข้อมูล
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            ดาวน์โหลดข้อมูลเพื่อใช้งานแบบออฟไลน์
          </p>
        </div>

        {/* Management Panel */}
        <TileManagementPanel />

        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
            💡 เกี่ยวกับระบบไทล์
          </h2>
          
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <p>
                <strong>ไทล์ข้อมูล</strong> คือชุดข้อมูลคอนสติทิวเอนต์สำหรับการคำนวณน้ำขึ้น-น้ำลงในแต่ละพื้นที่
              </p>
            </div>
            
            <div className="flex gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <p>
                <strong>37+ คอนสติทิวเอนต์</strong> รวมถึง M2, S2, K1, O1 และคอนสติทิวเอนต์รองอื่นๆ สำหรับความแม่นยำสูง
              </p>
            </div>
            
            <div className="flex gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <p>
                <strong>ระบบบีบอัดข้อมูล</strong> ลดขนาดไฟล์ถึง 70-80% ด้วย compression algorithm
              </p>
            </div>
            
            <div className="flex gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <p>
                <strong>การทำงานแบบออฟไลน์</strong> คำนวณข้อมูลบนเครื่องโดยไม่ต้องใช้อินเทอร์เน็ต
              </p>
            </div>
            
            <div className="flex gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <p>
                <strong>อัปเดตอัตโนมัติ</strong> ตรวจสอบเวอร์ชันใหม่และอัปเดตข้อมูลทุก 30 วัน
              </p>
            </div>
            
            <div className="flex gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
              <p>
                <strong>ระบบ LRU Eviction</strong> จัดการพื้นที่จัดเก็บอัตโนมัติเมื่อเต็ม
              </p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              🌊 อ่าวไทย
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p><strong>โมเดล:</strong> FES2022</p>
              <p><strong>Datum:</strong> MSL (Mean Sea Level)</p>
              <p><strong>คอนสติทิวเอนต์หลัก:</strong> M2, S2, K1, O1, N2, P1, Q1, K2</p>
              <p><strong>ความแม่นยำ:</strong> ±10 นาที, ±0.15 เมตร</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              🏝️ ทะเลอันดามัน
            </h3>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p><strong>โมเดล:</strong> FES2022</p>
              <p><strong>Datum:</strong> MSL (Mean Sea Level)</p>
              <p><strong>คอนสติทิวเอนต์หลัก:</strong> M2, S2, K1, O1, N2, P1, Q1, K2</p>
              <p><strong>ความแม่นยำ:</strong> ±10 นาที, ±0.20 เมตร</p>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
          <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
            ⚠️ คำเตือนสำคัญ
          </h3>
          <p className="text-sm text-amber-800 dark:text-amber-200">
            ข้อมูลการทำนายน้ำขึ้น-น้ำลง <strong>ไม่เหมาะสำหรับการนำร่องทางทะเล</strong> 
            (Not for Navigation) ปัจจัยต่างๆ เช่น ลม ความกดอากาศ และกระแสน้ำอาจทำให้ระดับน้ำจริง
            แตกต่างจากการทำนาย กรุณาใช้ข้อมูลอย่างระมัดระวังและอ้างอิงแหล่งข้อมูลทางการเสมอ
          </p>
        </div>
      </div>
    </div>
  )
}
