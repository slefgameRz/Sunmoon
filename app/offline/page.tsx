"use client"

import { WifiOff, Home, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            คุณอยู่ในโหมดออฟไลน์
          </CardTitle>
          <CardDescription className="text-base mt-2">
            ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้ในขณะนี้
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              ✨ คุณยังสามารถ:
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                <span>ดูข้อมูลน้ำขึ้น-น้ำลงที่บันทึกไว้</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                <span>ใช้งานฟีเจอร์ที่ดาวน์โหลดไว้แล้ว</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                <span>ตรวจสอบการทำนายล่าสุด</span>
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <strong>หมายเหตุ:</strong> ข้อมูลใหม่จะอัปเดตเมื่อมีการเชื่อมต่ออินเทอร์เน็ตอีกครั้ง
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link href="/" className="flex-1">
              <Button variant="default" className="w-full" size="lg">
                <Home className="h-4 w-4 mr-2" />
                กลับหน้าหลัก
              </Button>
            </Link>
            <Button
              variant="outline"
              className="flex-1"
              size="lg"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              ลองอีกครั้ง
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
