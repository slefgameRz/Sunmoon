/**
 * Water Level Comparison Utilities
 * เปรียบเทียบระดับน้ำกับจุดอ้างอิงตามตำแหน่งผู้ใช้อัตโนมัติ
 * และรวม data ความสูงของพื้นดิน (Elevation) เพื่อการแจ้งเตือนน้ำท่วมที่แม่นยำขึ้น
 */

import pierMslData from "@/data/pier-msl.json";
import { calculateDistance } from "./distance-utils";

// Reference point from pier-msl.json
export interface ReferencePoint {
    id: string;
    name: string;
    province: string;
    latitude: number;
    longitude: number;
    mslHeightMeters: number;
    reference: string;
    note?: string;
    floodThresholdMeters?: number;
    warningThresholdMeters?: number;
}

// Comparison result
export interface WaterLevelComparison {
    referencePoint: ReferencePoint | null;
    distanceKm: number;
    currentLevel: number;
    referenceLevel: number;
    difference: number;
    status: "normal" | "warning" | "critical" | "low" | "unknown";
    statusText: string;
    statusColor: string;
    isAboveReference: boolean;
    groundElevation?: number; // ระดับความสูงพื้นที่ (MSL)
    floodDepth?: number; // ความลึกของน้ำท่วมเหนือพื้นดิน (ถ้ามี)
}

// Prediction deviation result
export interface PredictionDeviation {
    actualLevel: number;
    predictedLevel: number;
    deviation: number;
    deviationPercent: number;
    isHigherThanPredicted: boolean;
    warningLevel: "none" | "minor" | "significant" | "critical";
    warningText: string;
}

// Default reference values for areas without specific data
const DEFAULT_MSL_HEIGHT = 0.5; // meters
const DEFAULT_WARNING_THRESHOLD = 0.2; // meters above MSL
const DEFAULT_FLOOD_THRESHOLD = 0.4; // meters above MSL

/**
 * หาจุดอ้างอิงที่ใกล้ที่สุดจากตำแหน่งผู้ใช้
 */
export function findNearestReferencePoint(
    lat: number,
    lon: number,
    maxDistanceKm: number = 50
): { point: ReferencePoint | null; distanceKm: number } {
    let nearest: ReferencePoint | null = null;
    let minDistance = Infinity;

    for (const pier of pierMslData as ReferencePoint[]) {
        const distance = calculateDistance(lat, lon, pier.latitude, pier.longitude);
        if (distance < minDistance && distance <= maxDistanceKm) {
            minDistance = distance;
            nearest = pier;
        }
    }

    return {
        point: nearest,
        distanceKm: nearest ? minDistance : -1,
    };
}

/**
 * คำนวณความแตกต่างระหว่างระดับน้ำปัจจุบันกับระดับอ้างอิง
 */
export function calculateWaterLevelDifference(
    currentLevel: number,
    referenceLevel: number
): number {
    return currentLevel - referenceLevel;
}

/**
 * กำหนดระดับการแจ้งเตือนจากความแตกต่าง
 * difference = currentLevel - referenceLevel
 * > 0 หมายถึงสูงกว่า MSL, < 0 หมายถึงต่ำกว่า MSL
 */
export function getFloodWarningLevel(
    difference: number,
    warningThreshold: number = DEFAULT_WARNING_THRESHOLD,
    floodThreshold: number = DEFAULT_FLOOD_THRESHOLD
): {
    status: "normal" | "warning" | "critical" | "low";
    statusText: string;
    statusColor: string;
} {
    if (difference >= floodThreshold) {
        return {
            status: "critical",
            statusText: `⚠️ วิกฤต! สูงกว่า MSL ${difference.toFixed(2)} ม.`,
            statusColor: "bg-red-500 text-white",
        };
    } else if (difference >= warningThreshold) {
        return {
            status: "warning",
            statusText: `⚡ เตือน: สูงกว่า MSL ${difference.toFixed(2)} ม.`,
            statusColor: "bg-orange-500 text-white",
        };
    } else if (difference > 0.05) {
        // สูงกว่า MSL เล็กน้อย (> 5cm)
        return {
            status: "normal",
            statusText: `ปกติ (สูงกว่า MSL +${difference.toFixed(2)} ม.)`,
            statusColor:
                "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        };
    } else if (difference >= -0.05) {
        // ใกล้เคียง MSL (±5cm)
        return {
            status: "normal",
            statusText: `✓ ปกติ (ใกล้เคียง MSL)`,
            statusColor:
                "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        };
    } else if (difference >= -0.3) {
        // ต่ำกว่า MSL เล็กน้อย
        return {
            status: "normal",
            statusText: `✓ ปกติ (ต่ำกว่า MSL ${Math.abs(difference).toFixed(2)} ม.)`,
            statusColor:
                "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        };
    } else {
        // ต่ำกว่า MSL มาก (น้ำลง)
        return {
            status: "low",
            statusText: `🌊 น้ำลง (ต่ำกว่า MSL ${Math.abs(difference).toFixed(
                2
            )} ม.)`,
            statusColor:
                "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
        };
    }
}

/**
 * เปรียบเทียบระดับน้ำปัจจุบันกับจุดอ้างอิงที่ใกล้ที่สุด และระดับพื้นดิน (ถ้ามี)
 */
export function compareWaterLevel(
    lat: number,
    lon: number,
    currentLevel: number,
    groundElevation?: number
): WaterLevelComparison {
    const { point, distanceKm } = findNearestReferencePoint(lat, lon);

    // กรณีมีข้อมูลความสูงพื้นที่ (Ground Elevation)
    if (groundElevation !== undefined) {
        // คำนวณความลึกของน้ำเหนือพื้นดิน: ระดับน้ำ (MSL) - ความสูงพื้นที่ (MSL)
        const floodDepth = currentLevel - groundElevation;

        // ถ้า floodDepth > 0 แสดงว่าน้ำท่วมสูงกว่าพื้นดิน
        // ถ้า floodDepth <= 0 แสดงว่าน้ำยังไม่ท่วมถึงพื้นดิน

        let status: WaterLevelComparison["status"] = "normal";
        let statusText = "";
        let statusColor = "";

        if (floodDepth >= 0.5) {
            status = "critical";
            statusText = `🚨 น้ำท่วมสูงกว่าพื้นดิน ${floodDepth.toFixed(2)} ม.`;
            statusColor = "bg-red-600 text-white animate-pulse";
        } else if (floodDepth > 0) {
            status = "warning";
            statusText = `⚠️ น้ำท่วมขังสูงกว่าพื้นดิน ${floodDepth.toFixed(2)} ม.`;
            statusColor = "bg-orange-500 text-white";
        } else if (floodDepth >= -0.5) {
            status = "warning";
            statusText = `⚡ เฝ้าระวัง: น้ำต่ำกว่าพื้นดินเพียง ${Math.abs(
                floodDepth
            ).toFixed(2)} ม.`;
            statusColor = "bg-yellow-500 text-white";
        } else {
            status = "normal";
            statusText = `✅ ปลอดภัย (น้ำต่ำกว่าพื้นดิน ${Math.abs(
                floodDepth
            ).toFixed(2)} ม.)`;
            statusColor =
                "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        }

        return {
            referencePoint: point,
            distanceKm,
            currentLevel,
            referenceLevel: point?.mslHeightMeters ?? DEFAULT_MSL_HEIGHT,
            difference: point
                ? calculateWaterLevelDifference(currentLevel, point.mslHeightMeters)
                : 0,
            status,
            statusText,
            statusColor,
            isAboveReference: floodDepth > 0,
            groundElevation,
            floodDepth,
        };
    }

    // กรณีไม่มีข้อมูลความสูงพื้นที่ (ใช้ Logic เดิมเทียบกับ Pier MSL)
    if (!point) {
        // ไม่พบจุดอ้างอิง ใช้ค่าพื้นฐาน
        const difference = currentLevel - DEFAULT_MSL_HEIGHT;
        const warning = getFloodWarningLevel(difference);

        return {
            referencePoint: null,
            distanceKm: -1,
            currentLevel,
            referenceLevel: DEFAULT_MSL_HEIGHT,
            difference,
            status: warning.status,
            statusText: `${warning.statusText} (ใช้ค่าประมาณ)`,
            statusColor: warning.statusColor,
            isAboveReference: difference > 0,
        };
    }

    const warningThreshold =
        point.warningThresholdMeters ?? DEFAULT_WARNING_THRESHOLD;
    const floodThreshold = point.floodThresholdMeters ?? DEFAULT_FLOOD_THRESHOLD;
    const difference = calculateWaterLevelDifference(
        currentLevel,
        point.mslHeightMeters
    );
    const warning = getFloodWarningLevel(
        difference,
        warningThreshold,
        floodThreshold
    );

    return {
        referencePoint: point,
        distanceKm,
        currentLevel,
        referenceLevel: point.mslHeightMeters,
        difference,
        status: warning.status,
        statusText: warning.statusText,
        statusColor: warning.statusColor,
        isAboveReference: difference > 0,
    };
}

/**
 * เปรียบเทียบระดับน้ำจริงกับค่าที่ทำนายไว้
 */
export function compareWithPrediction(
    actualLevel: number,
    predictedLevel: number
): PredictionDeviation {
    const deviation = actualLevel - predictedLevel;
    const deviationPercent =
        predictedLevel !== 0 ? (deviation / predictedLevel) * 100 : 0;
    const isHigherThanPredicted = deviation > 0;

    let warningLevel: PredictionDeviation["warningLevel"] = "none";
    let warningText = "";

    const absDeviation = Math.abs(deviation);

    if (absDeviation <= 0.1) {
        warningLevel = "none";
        warningText = "ตรงกับการทำนาย";
    } else if (absDeviation <= 0.2) {
        warningLevel = "minor";
        warningText = isHigherThanPredicted
            ? `สูงกว่าทำนายเล็กน้อย (+${deviation.toFixed(2)} ม.)`
            : `ต่ำกว่าทำนายเล็กน้อย (${deviation.toFixed(2)} ม.)`;
    } else if (absDeviation <= 0.4) {
        warningLevel = "significant";
        warningText = isHigherThanPredicted
            ? `⚠️ สูงกว่าทำนายมาก (+${deviation.toFixed(2)} ม.)`
            : `ต่ำกว่าทำนายมาก (${deviation.toFixed(2)} ม.)`;
    } else {
        warningLevel = "critical";
        warningText = isHigherThanPredicted
            ? `🚨 วิกฤต! สูงกว่าทำนายมาก (+${deviation.toFixed(2)} ม.)`
            : `ต่ำกว่าทำนายมาก (${deviation.toFixed(2)} ม.)`;
    }

    return {
        actualLevel,
        predictedLevel,
        deviation,
        deviationPercent,
        isHigherThanPredicted,
        warningLevel,
        warningText,
    };
}

/**
 * สีสำหรับแสดงผลตามระดับการเตือน prediction deviation
 */
export function getPredictionDeviationColor(
    warningLevel: PredictionDeviation["warningLevel"]
): string {
    switch (warningLevel) {
        case "none":
            return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
        case "minor":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
        case "significant":
            return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
        case "critical":
            return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
        default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
}

/**
 * สร้างข้อความสรุปสำหรับการเปรียบเทียบระดับน้ำ
 */
export function createComparisonSummary(
    comparison: WaterLevelComparison,
    predictionDeviation?: PredictionDeviation
): string {
    const parts: string[] = [];

    // Ground Elevation Comparison (Primary if available)
    if (comparison.groundElevation !== undefined && comparison.floodDepth !== undefined) {
        parts.push(`🏔 ความสูงพื้นที่: ${comparison.groundElevation.toFixed(2)} ม. (MSL)`);
        parts.push(`💧 ระดับน้ำเทียบพื้นดิน: ${comparison.floodDepth > 0 ? '+' : ''}${comparison.floodDepth.toFixed(2)} ม.`);
        parts.push(`📊 สถานะพื้นที่: ${comparison.statusText}`);
    }

    // Reference comparison (Always show context)
    if (comparison.referencePoint) {
        parts.push(
            `📍 จุดอ้างอิง: ${comparison.referencePoint.name} (${comparison.distanceKm.toFixed(
                1
            )} กม.)`
        );
        parts.push(
            `🌊 ระดับวัดจริง (MSL): ${comparison.currentLevel.toFixed(2)} ม.`
        );
    } else {
        parts.push(
            `⚠️ ไม่พบจุดอ้างอิงใกล้เคียง ใช้ค่าประมาณ MSL: ${comparison.referenceLevel.toFixed(
                2
            )} ม.`
        );
    }

    // Prediction comparison
    if (predictionDeviation) {
        parts.push(`🔮 เทียบกับทำนาย: ${predictionDeviation.warningText}`);
    }

    return parts.join("\n");
}
