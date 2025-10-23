"use client"

import * as React from "react"
import { VictoryAxis, VictoryChart, VictoryLine, VictoryTheme } from "victory"

import { cn } from "@/lib/utils"

type ChartProps = React.HTMLAttributes<HTMLDivElement>

type TideChartProps = {
  data: { time: string; level: number }[]
  className?: string
} & Omit<React.ComponentProps<typeof VictoryChart>, 'children'>

type ChartContextType = {
  chartRef: React.RefObject<HTMLDivElement | null>
} | null

const ChartContext = React.createContext<ChartContextType>(null)

function Chart({ className, children, ...props }: ChartProps) {
  const chartRef = React.useRef<HTMLDivElement>(null)

  return (
    <ChartContext.Provider value={{ chartRef }}>
      <div ref={chartRef} className={cn("w-full h-full", className)} {...props}>
        {children}
      </div>
    </ChartContext.Provider>
  )
}

function ChartContainer({ className = "", children = null, ...props }: ChartProps) {
  const context = React.useContext(ChartContext)

  if (!context || !context.chartRef) {
    throw new Error("ChartContainer must be used within a Chart component.")
  }

  return (
    <div className={cn("w-full h-full", className)} {...props}>
      {children}
    </div>
  )
}

function ChartTooltip({ className = "", children = null, ...props }: ChartProps) {
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

function ChartLegend({ className = "", children = null, ...props }: ChartProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)} {...props}>
      {children}
    </div>
  )
}

function ChartLegendItem({ className = "", children = null, ...props }: ChartProps) {
  return (
    <div className={cn("flex items-center", className)} {...props}>
      {children}
    </div>
  )
}

function TideChart({ data, className, ...props }: TideChartProps) {
  return (
    <div className={cn("w-full h-full", className)}>
      <VictoryChart theme={VictoryTheme.material} domainPadding={20} {...props}>
        <VictoryAxis
          tickFormat={(t) => `${t}h`}
          label="Time"
          style={{ axisLabel: { padding: 30 } }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t) => `${t}m`}
          label="Tide Level"
          style={{ axisLabel: { padding: 40 } }}
        />
        <VictoryLine
          data={data}
          x="time"
          y="level"
          style={{ data: { stroke: "#4a90e2" } }}
        />
      </VictoryChart>
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
  VictoryChart,
  VictoryLine,
  VictoryTheme,
  TideChart,
}
