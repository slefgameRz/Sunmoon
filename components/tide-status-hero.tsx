"use client"

import React from "react"
import { ArrowUp, ArrowDown, Minus, Droplets, Clock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface TideStatusHeroProps {
    status: string; // "น้ำขึ้น", "น้ำลง", "น้ำนิ่ง"
    currentLevel: number;
    nextEvent?: {
        type: "high" | "low";
        time: string;
        level: number;
    };
    dataSource?: string;
    className?: string;
}

export function TideStatusHero({ status, currentLevel, nextEvent, className, dataSource }: TideStatusHeroProps) {
    const isRising = status === "น้ำขึ้น";
    const isFalling = status === "น้ำลง";
    const isStand = status === "น้ำนิ่ง";

    // Dynamic styles based on status
    const containerClass = cn(
        "relative overflow-hidden p-6 rounded-2xl shadow-xl transition-all duration-500",
        isRising && "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white",
        isFalling && "bg-gradient-to-br from-cyan-500 via-cyan-600 to-teal-700 text-white",
        isStand && "bg-gradient-to-br from-gray-500 via-gray-600 to-slate-700 text-white",
        className
    );

    const ArrowIcon = isRising ? ArrowUp : isFalling ? ArrowDown : Minus;
    const statusLabel = isRising ? "น้ำกำลังขึ้น" : isFalling ? "น้ำกำลังลง" : "น้ำนิ่ง";

    return (
        <Card className={cn("border-none", containerClass)}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-black/10 rounded-full blur-3xl pointer-events-none" />

            {/* Data Source Badge */}
            {dataSource && (
                <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-white/60 tracking-wider">Source</span>
                    <span className="text-xs font-semibold text-white/90">{dataSource}</span>
                </div>
            )}

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">

                {/* Main Status Indicator */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left gap-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                            "p-3 rounded-full backdrop-blur-md bg-white/20 border border-white/30 shadow-inner",
                            isRising && "animate-bounce-slow"
                        )}>
                            <ArrowIcon className="w-8 h-8 md:w-10 md:h-10 text-white stroke-[3]" />
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-md">
                            {statusLabel}
                        </h2>
                    </div>
                    <p className="text-white/80 text-sm md:text-base font-medium max-w-[200px]">
                        {isRising ? "ระดับน้ำกำลังเพิ่มสูงขึ้น" : isFalling ? "ระดับน้ำกำลังลดต่ำลง" : "ระดับน้ำทรงตัว"}
                    </p>
                </div>

                {/* Current Level Display */}
                <div className="flex flex-col items-center justify-center p-4 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <div className="flex items-baseline gap-1">
                        <span className="text-5xl md:text-6xl font-black tracking-tighter">
                            {currentLevel.toFixed(2)}
                        </span>
                        <span className="text-lg font-medium text-white/80">ม.</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs md:text-sm font-medium text-white/70 bg-black/20 px-3 py-1 rounded-full">
                        <Droplets className="w-3 h-3" />
                        ระดับน้ำทะเลปานกลาง (MSL)
                    </div>
                </div>

                {/* Next Event Info */}
                {nextEvent && (
                    <div className="flex flex-col items-center md:items-end gap-1 min-w-[140px]">
                        <span className="text-xs uppercase tracking-wider text-white/60 font-bold">
                            เหตุการณ์ถัดไป
                        </span>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-white/80" />
                            <span className="text-2xl font-bold">
                                {nextEvent.time}
                            </span>
                        </div>
                        <span className="text-sm font-medium text-white/90">
                            {nextEvent.type === "high" ? "น้ำขึ้นสูงสุด" : "น้ำลงต่ำสุด"} ({nextEvent.level.toFixed(2)} ม.)
                        </span>
                    </div>
                )}

            </div>
        </Card>
    )
}
