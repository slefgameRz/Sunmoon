"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, TrendingUp, TrendingDown } from "lucide-react"
import { TimeRangePrediction } from "@/lib/tide-service"

interface TimeRangePredictionsProps {
  predictions: TimeRangePrediction[]
}

export const TimeRangePredictions: React.FC<TimeRangePredictionsProps> = ({ predictions }) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600"
    if (confidence >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  const getDescriptionIcon = (description: string) => {
    if (description.includes("ขึ้น")) return <TrendingUp className="w-4 h-4 text-blue-600" />
    if (description.includes("ลง")) return <TrendingDown className="w-4 h-4 text-green-600" />
    return <Clock className="w-4 h-4 text-gray-600" />
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>การทำนายเวลาเป็นช่วง</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getDescriptionIcon(prediction.description)}
                  <span className="font-medium">{prediction.description}</span>
                </div>
                <Badge variant="outline" className="text-sm">
                  ช่วง {prediction.range} น.
                </Badge>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                {prediction.startTime} - {prediction.endTime}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">ความแม่นยำ:</span>
                <Progress value={prediction.confidence} className="flex-1 h-2" />
                <span className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                  {prediction.confidence}%
                </span>
              </div>
            </div>
          ))}
          
          {predictions.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>ไม่มีข้อมูลการทำนายช่วงเวลา</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="text-yellow-600 mt-0.5">ℹ️</div>
            <div className="text-sm text-yellow-800">
              <strong>หมายเหตุ:</strong> การทำนายช่วงเวลาเป็นการประมาณการจากข้อมูลดวงจันทร์และรูปแบบน้ำขึ้นน้ำลง 
              ควรใช้เป็นข้อมูลอ้างอิงเท่านั้น
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TimeRangePredictions