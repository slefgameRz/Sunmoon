"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, MapPin, WifiOff } from "lucide-react"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  location?: string
  errorType?: "network" | "api" | "location" | "general"
}

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  title,
  message,
  onRetry,
  location,
  errorType = "general"
}) => {
  const getErrorConfig = (type: string) => {
    switch (type) {
      case "network":
        return {
          icon: <WifiOff className="h-16 w-16 text-red-500" />,
          title: title || "ไม่สามารถเชื่อมต่อได้",
          message: message || "กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
          color: "red"
        }
      case "api":
        return {
          icon: <AlertCircle className="h-16 w-16 text-orange-500" />,
          title: title || "ข้อผิดพลาดจากเซิร์ฟเวอร์",
          message: message || "ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้ในขณะนี้",
          color: "orange"
        }
      case "location":
        return {
          icon: <MapPin className="h-16 w-16 text-blue-500" />,
          title: title || "ไม่พบข้อมูลสำหรับพื้นที่นี้",
          message: message || "กรุณาเลือกพื้นที่อื่น หรือลองใหม่อีกครั้ง",
          color: "blue"
        }
      default:
        return {
          icon: <AlertCircle className="h-16 w-16 text-gray-500" />,
          title: title || "เกิดข้อผิดพลาด",
          message: message || "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
          color: "gray"
        }
    }
  }

  const config = getErrorConfig(errorType)

  return (
    <Card className="w-full shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
      <CardContent className="flex items-center justify-center py-16">
        <div className="text-center space-y-6 max-w-md">
          {/* Error icon */}
          <div className="flex justify-center">
            {config.icon}
          </div>
          
          {/* Error title */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {config.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {config.message}
            </p>
            {location && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                📍 {location}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {onRetry && (
              <Button 
                onClick={onRetry}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                ลองใหม่อีกครั้ง
              </Button>
            )}
            
            <div className="flex flex-col space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <p>💡 เคล็ดลับ:</p>
              <ul className="text-left space-y-1">
                {errorType === "network" && (
                  <>
                    <li>• ตรวจสอบการเชื่อมต่อ WiFi หรือ 4G/5G</li>
                    <li>• รอสักครู่แล้วลองใหม่</li>
                  </>
                )}
                {errorType === "api" && (
                  <>
                    <li>• เซิร์ฟเวอร์อาจมีปัญหาชั่วคราว</li>
                    <li>• ลองใหม่ในอีกสักครู่</li>
                  </>
                )}
                {errorType === "location" && (
                  <>
                    <li>• เลือกจังหวัดชายฝั่งอื่น</li>
                    <li>• ตรวจสอบการสะกดชื่อสถานที่</li>
                  </>
                )}
                <li>• รีเฟรชหน้าเพจ</li>
              </ul>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-400 dark:text-gray-500">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>สถานะ: ไม่พร้อมใช้งาน</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ErrorState