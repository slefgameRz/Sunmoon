"use client"
import { ArrowUp, ArrowDown, Droplets } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TideEvent } from "@/lib/tide-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type TideAnimationProps = {
  currentWaterLevel: number // Current water level in meters
  tideEvents: TideEvent[] // Array of significant tide events for the day
  waterLevelStatus: string // e.g., "น้ำขึ้น", "น้ำลง", "น้ำนิ่ง"
}

const TIDE_VISUAL_MAX = 3.5 // Max level for visual scaling (meters)
const TIDE_VISUAL_MIN = -0.5 // Min level for visual scaling (meters)
const VISUAL_RANGE = TIDE_VISUAL_MAX - TIDE_VISUAL_MIN // Total range for scaling

export default function TideAnimation({ currentWaterLevel, tideEvents, waterLevelStatus }: TideAnimationProps) {
  // Calculate percentage height for current water level
  const currentWaterLevelPct = Math.max(0, Math.min(100, ((currentWaterLevel - TIDE_VISUAL_MIN) / VISUAL_RANGE) * 100))

  // Generate scale markers
  const scaleMarkers = Array.from({ length: Math.floor(VISUAL_RANGE) + 1 }, (_, i) => {
    const level = TIDE_VISUAL_MIN + i
    const pct = Math.max(0, Math.min(100, ((level - TIDE_VISUAL_MIN) / VISUAL_RANGE) * 100))
    return { level, pct }
  }).filter((marker) => marker.level >= TIDE_VISUAL_MIN && marker.level <= TIDE_VISUAL_MAX)

  return (
    <TooltipProvider>
      <div className="relative w-full h-72 bg-gradient-to-t from-blue-100 to-blue-50 rounded-lg overflow-hidden border border-blue-200 shadow-inner dark:from-blue-950 dark:to-blue-900 dark:border-blue-800">
        {/* Water level indicator */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-blue-400 dark:from-blue-700 dark:to-blue-600 transition-all duration-1000 ease-in-out"
          style={{ height: `${currentWaterLevelPct}%` }}
        >
          {/* Subtle wave effect */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-blue-500/50 dark:bg-blue-700/50 blur-sm animate-pulse" />
        </div>

        {/* Current water level line and value */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="absolute left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400 z-10 transition-all duration-1000 ease-in-out"
              style={{ bottom: `${currentWaterLevelPct}%` }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 bg-purple-600 dark:bg-purple-400 text-white rounded-md text-sm font-bold whitespace-nowrap">
                <Droplets className="h-4 w-4" />
                {currentWaterLevel.toFixed(2)} ม.
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="dark:bg-gray-700 dark:text-white">
            <p>ระดับน้ำปัจจุบัน: {currentWaterLevel.toFixed(2)} ม.</p>
            <p>สถานะ: {waterLevelStatus}</p>
          </TooltipContent>
        </Tooltip>

        {/* Tide event markers */}
        {tideEvents.map((event, index) => {
          const eventLevelPct = Math.max(0, Math.min(100, ((event.level - TIDE_VISUAL_MIN) / VISUAL_RANGE) * 100))
          const eventPosition = `calc(${eventLevelPct}% - 12px)` // Adjust for marker height

          return (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "absolute left-0 right-0 flex items-center px-2 py-1 rounded-md text-sm font-semibold transition-all duration-1000 ease-in-out cursor-pointer",
                    event.type === "high"
                      ? "bg-blue-500 text-white dark:bg-blue-700"
                      : "bg-red-500 text-white dark:bg-red-700",
                  )}
                  style={{ bottom: eventPosition }}
                >
                  {event.type === "high" ? (
                    <ArrowUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 mr-1" />
                  )}
                  {event.type === "high" ? "น้ำขึ้น" : "น้ำลง"}: {event.time}
                </div>
              </TooltipTrigger>
              <TooltipContent className="dark:bg-gray-700 dark:text-white">
                <p>{event.type === "high" ? "น้ำขึ้นสูงสุด" : "น้ำลงต่ำสุด"}</p>
                <p>เวลา: {event.time}</p>
                <p>ระดับ: {event.level.toFixed(2)} ม.</p>
              </TooltipContent>
            </Tooltip>
          )
        })}

        {/* Scale markers on the side */}
        <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-between py-2 text-xs text-gray-700 dark:text-gray-300">
          {scaleMarkers.map((marker, index) => (
            <div key={index} className="relative h-0 flex-grow" style={{ flexBasis: `${marker.pct}%` }}>
              <span className="absolute right-0 -translate-y-1/2">{marker.level.toFixed(1)} ม.</span>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}
