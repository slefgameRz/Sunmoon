"use client"

import * as React from "react"
import { VictoryAxis, VictoryBar, VictoryChart, VictoryLine, VictoryPie, VictoryTheme } from "victory"

import { cn } from "@/lib/utils"

const ChartContext = React.createContext(null)

function Chart({ className, children, ...props }) {
  const chartRef = React.useRef(null)

  return (
    <ChartContext.Provider value={{ chartRef }}>
      <div ref={chartRef} className={cn("w-full h-full", className)} {...props}>
        {children}
      </div>
    </ChartContext.Provider>
  )
}

function ChartContainer({ className, children, ...props }) {
  const { chartRef } = React.useContext(ChartContext)

  if (!chartRef) {
    throw new Error("ChartContainer must be used within a Chart component.")
  }

  return (
    <div className={cn("w-full h-full", className)} {...props}>
      {children}
    </div>
  )
}

function ChartTooltip({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "absolute z-50 rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function ChartLegend({ className, children, ...props }) {
  return (
    <div className={cn("flex items-center justify-center gap-4 text-sm font-medium", className)} {...props}>
      {children}
    </div>
  )
}

function ChartLegendItem({ className, children, ...props }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} {...props}>
      <span className="h-3 w-3 rounded-full bg-gray-200" />
      {children}
    </div>
  )
}

export {
  Chart,
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendItem,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLine,
  VictoryPie,
  VictoryTheme,
}
