"use client";

import { cn } from "@/lib/utils";

// Generic skeleton component
function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return (
        <div
            className={cn(
                "animate-pulse bg-gray-200 dark:bg-gray-700 rounded",
                className
            )}
            style={style}
        />
    );
}

// Hero card skeleton (main water level display)
export function HeroCardSkeleton() {
    return (
        <div className="relative overflow-hidden shadow-2xl bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 rounded-2xl animate-pulse">
            <div className="py-10 md:py-12 px-6 md:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {/* Left side */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Skeleton className="w-16 h-16 rounded-2xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <Skeleton className="h-20 w-48" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="grid grid-cols-2 gap-4">
                        <Skeleton className="h-20 rounded-xl col-span-2" />
                        <Skeleton className="h-24 rounded-xl" />
                        <Skeleton className="h-24 rounded-xl" />
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-8 pt-6 border-t border-white/20 grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="text-center space-y-2">
                            <Skeleton className="h-4 w-16 mx-auto" />
                            <Skeleton className="h-6 w-20 mx-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Metric card skeleton
export function MetricCardSkeleton() {
    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg animate-pulse">
            <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                </div>
            </div>
        </div>
    );
}

// Graph skeleton
export function GraphSkeleton() {
    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg animate-pulse">
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-8 w-24" />
            </div>
            <div className="h-[300px] flex items-end gap-2">
                {[40, 60, 45, 80, 55, 70, 50, 75, 65, 85, 60, 70].map((height, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1 rounded-t"
                        style={{ height: `${height}%` }}
                    />
                ))}
            </div>
            <div className="flex justify-between mt-4">
                {["00:00", "06:00", "12:00", "18:00", "24:00"].map((time) => (
                    <Skeleton key={time} className="h-4 w-12" />
                ))}
            </div>
        </div>
    );
}

// Disaster alert skeleton
export function DisasterAlertSkeleton() {
    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg animate-pulse">
            <div className="flex items-center gap-3 mb-6">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>

            <div className="space-y-4">
                <Skeleton className="h-24 rounded-lg" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-16 rounded-lg" />
                    <Skeleton className="h-16 rounded-lg" />
                </div>
                <Skeleton className="h-32 rounded-lg" />
            </div>
        </div>
    );
}

// Calendar/Forecast skeleton
export function ForecastCalendarSkeleton() {
    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg animate-pulse">
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-6 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                </div>
            </div>

            {/* Calendar days */}
            <div className="flex gap-2 overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div
                        key={i}
                        className="min-w-[100px] p-3 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                        <div className="text-center space-y-2">
                            <Skeleton className="h-4 w-12 mx-auto" />
                            <Skeleton className="h-8 w-8 mx-auto rounded-full" />
                            <Skeleton className="h-4 w-10 mx-auto" />
                            <Skeleton className="h-6 w-16 mx-auto rounded-full" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Detail section */}
            <div className="mt-6 pt-6 border-t space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                </div>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Map skeleton
export function MapSkeleton() {
    return (
        <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-xl shadow-lg animate-pulse">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <Skeleton className="h-6 w-48" />
            </div>
            <div className="h-[400px] bg-gray-200 dark:bg-gray-700 relative">
                {/* Fake map elements */}
                <Skeleton className="absolute top-4 left-4 h-24 w-24 rounded-lg" />
                <div className="absolute top-1/4 left-1/3">
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="absolute top-1/2 right-1/4">
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="absolute bottom-1/3 left-1/4">
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="absolute bottom-1/4 right-1/3">
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                {/* Center marker */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>
        </div>
    );
}

// Historical events skeleton
export function HistoricalEventsSkeleton() {
    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg animate-pulse">
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            {/* Stats summary */}
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-xl mb-4">
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="text-center space-y-2">
                            <Skeleton className="h-8 w-12 mx-auto" />
                            <Skeleton className="h-4 w-16 mx-auto" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-4">
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-24 rounded-md" />
            </div>

            {/* Event cards */}
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="p-4 border-l-4 border-gray-300 rounded-xl bg-gray-50 dark:bg-gray-700"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-10 h-10 rounded-lg" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <Skeleton className="h-4 w-48" />
                                </div>
                            </div>
                            <Skeleton className="h-8 w-8 rounded" />
                        </div>
                        <Skeleton className="h-4 w-full mt-3" />
                        <Skeleton className="h-4 w-3/4 mt-2" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Full page loading skeleton
export function FullPageSkeleton() {
    return (
        <div className="space-y-6 p-4 md:p-6 lg:p-8">
            {/* Top controls */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg animate-pulse">
                    <Skeleton className="h-6 w-48 mb-4" />
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div>
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-12 rounded-md" />
                        <Skeleton className="h-12 rounded-md" />
                    </div>
                </div>

                <div className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg animate-pulse">
                    <Skeleton className="h-6 w-48 mb-4" />
                    <Skeleton className="h-10 w-full mb-4" />
                    <Skeleton className="h-20 rounded-lg mb-4" />
                    <Skeleton className="h-14 w-48 mx-auto rounded-md" />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <Skeleton className="h-10 flex-1 rounded-md" />
                <Skeleton className="h-10 flex-1 rounded-md" />
            </div>

            {/* Main content */}
            <HeroCardSkeleton />

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <MetricCardSkeleton key={i} />
                ))}
            </div>

            {/* Graph */}
            <GraphSkeleton />
        </div>
    );
}
