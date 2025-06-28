"use client"
import { ArrowUp, ArrowDown, Droplets } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TideEvent } from "@/lib/tide-service"

type TideAnimationProps = {
  currentWaterLevel: number // Current water level in meters
  tideEvents: TideEvent[] // Array of significant tide events for the day
}

const TIDE_VISUAL_MAX = 3.5 // Max level for visual scaling (meters)
const TIDE_VISUAL_MIN = -0.5 // Min level for visual scaling (meters)
const VISUAL_RANGE = TIDE_VISUAL_MAX - TIDE_VISUAL_MIN // Total range for scaling

export default function TideAnimation({ currentWaterLevel, tideEvents }: TideAnimationProps) {
  // Calculate percentage height for current water level
  const currentWaterLevelPct = Math.max(0, Math.min(100, ((currentWaterLevel - TIDE_VISUAL_MIN) / VISUAL_RANGE) * 100))

  return (
    <div className="relative w-full h-72 bg-gradient-to-t from-blue-100 to-blue-50 rounded-lg overflow-hidden border border-blue-200 shadow-inner dark:from-blue-950 dark:to-blue-900 dark:border-blue-800">
      {/* Water level indicator */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-blue-500/70 dark:bg-blue-600/70 transition-all duration-1000 ease-in-out"
        style={{ height: `${currentWaterLevelPct}%` }}
      >
        <div className="absolute inset-x-0 bottom-0 h-4 bg-blue-600/80 dark:bg-blue-700/80 blur-sm" />
      </div>

      {/* Current water level display */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center p-2 text-xl font-bold text-white transition-all duration-1000 ease-in-out"
        style={{ bottom: `calc(${currentWaterLevelPct}% + 8px)` }} // Adjust for text visibility
      >
        <Droplets className="h-5 w-5 mr-2" />
        {currentWaterLevel.toFixed(2)} ม.
      </div>

      {/* Tide event markers */}
      {tideEvents.map((event, index) => {
        const eventLevelPct = Math.max(0, Math.min(100, ((event.level - TIDE_VISUAL_MIN) / VISUAL_RANGE) * 100))
        const eventPosition = `calc(${eventLevelPct}% - 12px)` // Adjust for marker height

        return (
          <div
            key={index}
            className={cn(
              "absolute left-0 right-0 flex items-center px-2 py-1 rounded-md text-sm font-semibold transition-all duration-1000 ease-in-out",
              event.type === "high"
                ? "bg-blue-500 text-white dark:bg-blue-700"
                : "bg-red-500 text-white dark:bg-red-700",
            )}
            style={{ bottom: eventPosition }}
          >
            {event.type === "high" ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
            {event.type === "high" ? "น้ำขึ้น" : "น้ำลง"}: {event.time} ({event.level.toFixed(2)} ม.)
          </div>
        )
      })}

      {/* Scale markers (simplified) */}
      <div className="absolute right-2 top-0 bottom-0 flex flex-col justify-between py-2 text-xs text-gray-700 dark:text-gray-300">
        <span>{TIDE_VISUAL_MAX.toFixed(1)} ม.</span>
        <span>{(TIDE_VISUAL_MAX / 2 + TIDE_VISUAL_MIN / 2).toFixed(1)} ม.</span>
        <span>{TIDE_VISUAL_MIN.toFixed(1)} ม.</span>
      </div>
    </div>
  )
}
