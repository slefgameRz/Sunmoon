"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Waves, Sun, Moon, Wind } from "lucide-react"

interface LoadingStateProps {
  message?: string
  location?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "กำลังโหลดข้อมูล...", 
  location 
}) => {
  return (
    <Card className="w-full shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
      <CardContent className="flex items-center justify-center py-16">
        <div className="text-center space-y-6">
          {/* Animated icons */}
          <div className="relative flex items-center justify-center space-x-4">
            <div className="animate-bounce delay-0">
              <Waves className="h-8 w-8 text-blue-500" />
            </div>
            <div className="animate-bounce delay-100">
              <Sun className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="animate-bounce delay-200">
              <Moon className="h-8 w-8 text-gray-500" />
            </div>
            <div className="animate-bounce delay-300">
              <Wind className="h-8 w-8 text-cyan-500" />
            </div>
          </div>
          
          {/* Loading spinner */}
          <div className="flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
          
          {/* Loading text */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {message}
            </h3>
            {location && (
              <p className="text-base text-blue-600 dark:text-blue-400 font-medium">
                📍 {location}
              </p>
            )}
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                กำลังดึงข้อมูลจาก:
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>กรมอุทกศาสตร์</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>OpenWeatherMap</span>
                </span>
                <span className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>WorldTides API</span>
                </span>
              </div>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default LoadingState