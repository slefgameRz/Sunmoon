"use client";

import { useState } from "react";
import {
    AlertTriangle,
    AlertCircle,
    Shield,
    ChevronDown,
    ChevronUp,
    Moon,
    Waves,
    Wind,
    Gauge,
    CloudRain,
    Info,
    MapPin,
    CheckCircle,
    XCircle,
    Lightbulb,
    Clock,
    Droplets,
    Bell,
    History,
    TrendingUp,
    Timer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
    type DisasterAnalysis,
    type DisasterInfo,
    type RiskFactor,
    type RiskLevel,
    type RiskTimeSlot,
    type FloodPrediction,
    type AdvanceWarning,
    type HistoricalContext,
    getRiskLevelText,
    getRiskLevelColor,
    getWarningLevelText,
    getWarningLevelColor,
    getFloodTypeText,
} from "@/lib/disaster-analysis";

type DisasterAlertProps = {
    analysis: DisasterAnalysis | null;
    className?: string;
};

// ไอคอนสำหรับแต่ละปัจจัย
function getFactorIcon(iconName: string) {
    const icons: Record<string, React.ReactNode> = {
        Moon: <Moon className="h-5 w-5" />,
        Waves: <Waves className="h-5 w-5" />,
        Wind: <Wind className="h-5 w-5" />,
        Gauge: <Gauge className="h-5 w-5" />,
        CloudRain: <CloudRain className="h-5 w-5" />,
    };
    return icons[iconName] || <Info className="h-5 w-5" />;
}

// ไอคอนสำหรับระดับความเสี่ยง
function getRiskIcon(level: RiskLevel) {
    switch (level) {
        case "critical":
            return <XCircle className="h-8 w-8 text-red-500" />;
        case "high":
            return <AlertTriangle className="h-8 w-8 text-orange-500" />;
        case "medium":
            return <AlertCircle className="h-8 w-8 text-yellow-500" />;
        case "low":
            return <Shield className="h-8 w-8 text-green-500" />;
    }
}

// สีพื้นหลังสำหรับระดับความเสี่ยง
function getRiskBgGradient(level: RiskLevel) {
    switch (level) {
        case "critical":
            return "from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/30 border-red-300 dark:border-red-800";
        case "high":
            return "from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/30 border-orange-300 dark:border-orange-800";
        case "medium":
            return "from-yellow-50 to-amber-100 dark:from-yellow-950/50 dark:to-amber-900/30 border-yellow-300 dark:border-yellow-800";
        case "low":
            return "from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-900/30 border-green-300 dark:border-green-800";
    }
}

// สีสำหรับ timeline slot
function getTimeSlotBg(level: RiskLevel) {
    switch (level) {
        case "critical":
            return "bg-red-500";
        case "high":
            return "bg-orange-500";
        case "medium":
            return "bg-yellow-500";
        case "low":
            return "bg-green-500";
    }
}

// Component แสดงข้อมูลปัจจัยเสี่ยง
function RiskFactorCard({ factor }: { factor: RiskFactor }) {
    return (
        <div
            className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                factor.contributeToRisk
                    ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
                    : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
            )}
        >
            <div
                className={cn(
                    "p-2 rounded-lg flex-shrink-0",
                    factor.contributeToRisk
                        ? "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                )}
            >
                {getFactorIcon(factor.icon)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        {factor.name}
                    </h4>
                    <div className="flex items-center gap-1 text-sm font-mono">
                        <span className="font-bold text-gray-900 dark:text-white">
                            {typeof factor.value === "number"
                                ? factor.value.toFixed(2)
                                : factor.value}
                        </span>
                        {factor.unit && (
                            <span className="text-gray-500 dark:text-gray-400">
                                {factor.unit}
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {factor.description}
                </p>
                {factor.contributeToRisk && (
                    <Badge className="mt-2 bg-red-500 text-white text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        เพิ่มความเสี่ยง +{factor.riskContribution}%
                    </Badge>
                )}
            </div>
        </div>
    );
}

// Component แสดงรายละเอียดภัยพิบัติ
function DisasterCard({ disaster }: { disaster: DisasterInfo }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <div className="border border-red-200 dark:border-red-800 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                <CollapsibleTrigger asChild>
                    <button className="w-full p-4 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-gray-900 dark:text-gray-100">
                                    {disaster.title}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {disaster.description}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge
                                className={cn(
                                    "font-bold",
                                    disaster.probability >= 70
                                        ? "bg-red-500"
                                        : disaster.probability >= 40
                                            ? "bg-orange-500"
                                            : "bg-yellow-500"
                                )}
                            >
                                {disaster.probability}%
                            </Badge>
                            {isOpen ? (
                                <ChevronUp className="h-5 w-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                            )}
                        </div>
                    </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-4 border-t border-red-100 dark:border-red-900/50 pt-4">
                        {/* คำอธิบายละเอียด */}
                        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                            <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                กลไกการเกิด
                            </h5>
                            <p className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-line leading-relaxed">
                                {disaster.detailedExplanation}
                            </p>
                        </div>

                        {/* สาเหตุ */}
                        <div>
                            <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                                สาเหตุที่ทำให้เกิด
                            </h5>
                            <ul className="space-y-2">
                                {disaster.causes.map((cause, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                                    >
                                        <span className="text-orange-500 mt-1">•</span>
                                        {cause}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* พื้นที่ได้รับผลกระทบ */}
                        <div>
                            <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-red-500" />
                                พื้นที่ที่อาจได้รับผลกระทบ
                            </h5>
                            <div className="flex flex-wrap gap-2">
                                {disaster.impactAreas.map((area, idx) => (
                                    <Badge
                                        key={idx}
                                        variant="outline"
                                        className="bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                                    >
                                        {area}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* วิธีป้องกัน */}
                        <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4">
                            <h5 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                วิธีป้องกันและเตรียมพร้อม
                            </h5>
                            <ul className="space-y-2">
                                {disaster.preventionTips.map((tip, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400"
                                    >
                                        <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}

// Component แสดง Risk Timeline
function RiskTimelineSection({ timeline }: { timeline: RiskTimeSlot[] }) {
    if (timeline.length === 0) return null;

    return (
        <div className="bg-white/80 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                ช่วงเวลาที่ต้องระวัง
            </h3>
            <div className="space-y-3">
                {timeline.map((slot, idx) => (
                    <div
                        key={idx}
                        className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                    >
                        <div className="flex-shrink-0 text-center">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {slot.startTime}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">ถึง</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                {slot.endTime}
                            </div>
                        </div>
                        <div className={cn("w-2 h-16 rounded-full", getTimeSlotBg(slot.riskLevel))} />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge
                                    className={cn(
                                        "text-xs",
                                        slot.riskLevel === "critical"
                                            ? "bg-red-500"
                                            : slot.riskLevel === "high"
                                                ? "bg-orange-500"
                                                : slot.riskLevel === "medium"
                                                    ? "bg-yellow-500"
                                                    : "bg-green-500"
                                    )}
                                >
                                    {getRiskLevelText(slot.riskLevel)}
                                </Badge>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {slot.mainRisk}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {slot.description}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-sm text-blue-600 dark:text-blue-400">
                                <Waves className="h-3 w-3" />
                                ระดับน้ำ: {slot.tideLevel.toFixed(2)} ม.
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Component แสดง Flood Prediction
function FloodPredictionSection({ prediction }: { prediction: FloodPrediction | null }) {
    if (!prediction) return null;

    const floodColor = prediction.floodType === "severe" || prediction.floodType === "major"
        ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30"
        : prediction.floodType === "moderate"
            ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30"
            : "border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/30";

    return (
        <div className={cn("rounded-xl p-4 border-2", floodColor)}>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Droplets className="h-5 w-5 text-blue-500" />
                การพยากรณ์น้ำท่วม
                <Badge
                    className={cn(
                        "ml-auto",
                        prediction.floodType === "severe"
                            ? "bg-red-600"
                            : prediction.floodType === "major"
                                ? "bg-red-500"
                                : prediction.floodType === "moderate"
                                    ? "bg-orange-500"
                                    : "bg-yellow-500"
                    )}
                >
                    {getFloodTypeText(prediction.floodType)}
                </Badge>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-white/80 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {prediction.expectedLevel}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ซม. (สูงกว่าปกติ)</div>
                </div>
                <div className="text-center p-3 bg-white/80 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {prediction.peakTime}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">เวลาน้ำสูงสุด</div>
                </div>
                <div className="text-center p-3 bg-white/80 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {prediction.duration}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">นาที (ระยะเวลา)</div>
                </div>
                <div className="text-center p-3 bg-white/80 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {prediction.confidence}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">ความมั่นใจ</div>
                </div>
            </div>

            {/* สาเหตุ */}
            <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    ปัจจัยที่ทำให้เกิด:
                </h4>
                <div className="flex flex-wrap gap-2">
                    {prediction.causedBy.map((cause, idx) => (
                        <Badge key={idx} variant="outline" className="bg-white/50 dark:bg-gray-800/50">
                            {cause}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* พื้นที่ได้รับผลกระทบ */}
            <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    พื้นที่อาจได้รับผลกระทบ:
                </h4>
                <div className="flex flex-wrap gap-2">
                    {prediction.affectedAreas.map((area, idx) => (
                        <Badge key={idx} variant="outline" className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">
                            {area}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Component แสดง Advance Warnings
function AdvanceWarningsSection({ warnings }: { warnings: AdvanceWarning[] }) {
    if (warnings.length === 0) return null;

    return (
        <div className="bg-white/80 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-500" />
                การเตือนล่วงหน้า ({warnings.length})
            </h3>
            <div className="space-y-3">
                {warnings.map((warning, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            "p-4 rounded-lg border-l-4",
                            warning.warningLevel === "emergency"
                                ? "bg-red-50 dark:bg-red-950/30 border-l-red-600"
                                : warning.warningLevel === "warning"
                                    ? "bg-orange-50 dark:bg-orange-950/30 border-l-orange-500"
                                    : warning.warningLevel === "advisory"
                                        ? "bg-yellow-50 dark:bg-yellow-950/30 border-l-yellow-500"
                                        : "bg-blue-50 dark:bg-blue-950/30 border-l-blue-500"
                        )}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Badge className={getWarningLevelColor(warning.warningLevel)}>
                                    {getWarningLevelText(warning.warningLevel)}
                                </Badge>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {warning.title}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                <Timer className="h-4 w-4" />
                                {warning.timeUntil}
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {warning.message}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {warning.actionRequired.map((action, aidx) => (
                                <Badge
                                    key={aidx}
                                    variant="outline"
                                    className="bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                                >
                                    ✓ {action}
                                </Badge>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Component แสดง Historical Context
function HistoricalContextSection({ context }: { context: HistoricalContext | null }) {
    const [isOpen, setIsOpen] = useState(false);

    if (!context) return null;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full justify-between bg-white/80 dark:bg-gray-900/50 border-gray-300 dark:border-gray-600"
                >
                    <span className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        ข้อมูลประวัติศาสตร์และรูปแบบตามฤดูกาล
                    </span>
                    {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800">
                    {/* รูปแบบตามฤดูกาล */}
                    <div className="mb-4">
                        <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                            <CloudRain className="h-4 w-4" />
                            รูปแบบตามฤดูกาล
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-400">
                            {context.seasonalPattern}
                        </p>
                    </div>

                    {/* ความถี่การเกิด */}
                    <div className="mb-4">
                        <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            ความถี่โดยเฉลี่ย
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-400">
                            {context.averageOccurrence}
                        </p>
                    </div>

                    {/* เหตุการณ์ที่คล้ายกันในอดีต */}
                    {context.similarEvents.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                                <History className="h-4 w-4" />
                                เหตุการณ์ที่คล้ายกันในอดีต
                            </h4>
                            <div className="space-y-2">
                                {context.similarEvents.map((event, idx) => (
                                    <div
                                        key={idx}
                                        className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg text-sm"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {event.date}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                                {event.severity}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {event.description}
                                        </p>
                                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                            ระดับน้ำสูงสุด: {event.maxWaterLevel} ม.
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

export default function DisasterAlert({
    analysis,
    className,
}: DisasterAlertProps) {
    const [showFactors, setShowFactors] = useState(false);

    if (!analysis) {
        return null;
    }

    const riskBg = getRiskBgGradient(analysis.riskLevel);
    const hasDisasters = analysis.disasters.length > 0;

    return (
        <Card
            className={cn(
                "shadow-xl border-2 overflow-hidden bg-gradient-to-br",
                riskBg,
                className
            )}
        >
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        {getRiskIcon(analysis.riskLevel)}
                        <div>
                            <CardTitle className="text-xl md:text-2xl flex items-center gap-2 text-gray-900 dark:text-gray-100">
                                การวิเคราะห์ความเสี่ยงภัยพิบัติ
                            </CardTitle>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                📍 {analysis.location} •{" "}
                                {new Date(analysis.timestamp).toLocaleTimeString("th-TH")}
                            </p>
                        </div>
                    </div>

                    {/* Risk Rating */}
                    <div className="text-right">
                        <Badge
                            className={cn(
                                "text-lg px-4 py-2 font-bold",
                                analysis.riskLevel === "critical"
                                    ? "bg-red-600 text-white"
                                    : analysis.riskLevel === "high"
                                        ? "bg-orange-500 text-white"
                                        : analysis.riskLevel === "medium"
                                            ? "bg-yellow-500 text-black"
                                            : "bg-green-500 text-white"
                            )}
                        >
                            ความเสี่ยง{getRiskLevelText(analysis.riskLevel)}
                        </Badge>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                            คะแนนความเสี่ยง:{" "}
                            <span className="font-bold text-gray-900 dark:text-white">
                                {analysis.overallRating}
                            </span>
                            /100
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* การเตือนล่วงหน้า - แสดงก่อนถ้ามี */}
                <AdvanceWarningsSection warnings={analysis.advanceWarnings} />

                {/* คำแนะนำหลัก */}
                <div className="bg-white/80 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        คำแนะนำ
                    </h3>
                    <ul className="space-y-2">
                        {analysis.recommendations.map((rec, idx) => (
                            <li
                                key={idx}
                                className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                            >
                                {rec}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* การพยากรณ์น้ำท่วม */}
                <FloodPredictionSection prediction={analysis.floodPrediction} />

                {/* ช่วงเวลาที่ต้องระวัง */}
                <RiskTimelineSection timeline={analysis.riskTimeline} />

                {/* ภัยพิบัติที่อาจเกิดขึ้น */}
                {hasDisasters && (
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            ภัยพิบัติที่อาจเกิดขึ้น ({analysis.disasters.length})
                        </h3>
                        <div className="space-y-3">
                            {analysis.disasters.map((disaster, idx) => (
                                <DisasterCard key={idx} disaster={disaster} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ปัจจัยเสี่ยง (Collapsible) */}
                <Collapsible open={showFactors} onOpenChange={setShowFactors}>
                    <CollapsibleTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full justify-between bg-white/80 dark:bg-gray-900/50 border-gray-300 dark:border-gray-600"
                        >
                            <span className="flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                ปัจจัยที่นำมาวิเคราะห์ ({analysis.factors.length} ปัจจัย)
                            </span>
                            {showFactors ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
                            )}
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <div className="mt-4 space-y-3">
                            {analysis.factors.map((factor, idx) => (
                                <RiskFactorCard key={idx} factor={factor} />
                            ))}
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                {/* ข้อมูลประวัติศาสตร์ */}
                <HistoricalContextSection context={analysis.historicalContext} />

                {/* คำอธิบายเพิ่มเติมสำหรับความเสี่ยงต่ำ */}
                {analysis.riskLevel === "low" && (
                    <div className="bg-green-100 dark:bg-green-950/30 rounded-xl p-4 border border-green-200 dark:border-green-800">
                        <h3 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            สถานการณ์ปกติ
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-400">
                            ไม่พบปัจจัยเสี่ยงที่น่าเป็นห่วง
                            สามารถทำกิจกรรมทางทะเลได้ตามปกติ
                            แต่ควรติดตามสภาพอากาศอย่างสม่ำเสมอ
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

