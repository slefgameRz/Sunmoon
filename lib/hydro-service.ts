import { TideEvent } from "./tide-service";

/**
 * Hydrographic Department (Thai Navy) Data Service
 * Fetches tide data from official sources via internal API.
 */

export interface HydroData {
    stationName: string;
    stationId: string;
    distanceKm: number;
    source: "Hydrographic Department" | "กรมอุทกศาสตร์ กองทัพเรือ";
    events: TideEvent[];
}

export interface HydroStation {
    id: string;
    name: string;
    lat: number;
    lon: number;
}

/**
 * Fetch tide data from Hydrographic Department via internal API
 * @param date Target date
 * @param lat Latitude of user location
 * @param lon Longitude of user location
 */
export async function fetchHydroTideData(
    date: Date,
    lat?: number,
    lon?: number
): Promise<HydroData | null> {
    try {
        const latitude = lat ?? 13.7563; // Default to Bangkok
        const longitude = lon ?? 100.5018;

        console.log(`Fetching official tide data for ${date.toISOString()} at (${latitude}, ${longitude})`);

        // Call our internal API route to get data from Hydrographic Dept
        const response = await fetch(
            `/api/hydro-tide?date=${date.toISOString()}&lat=${latitude}&lon=${longitude}`
        );

        if (!response.ok) {
            console.warn("Hydro API returned error:", response.status);
            return null;
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.events)) {
            return {
                stationName: data.stationName || "Unknown Station",
                stationId: data.stationId,
                distanceKm: data.distanceKm,
                source: "กรมอุทกศาสตร์ กองทัพเรือ",
                events: data.events.map((e: any) => ({
                    time: e.time,
                    level: e.level,
                    type: e.type as "high" | "low"
                }))
            };
        }

        return null;
    } catch (error) {
        console.error("Failed to fetch official hydro data:", error);
        return null;
    }
}

/**
 * Get list of all official Hydrographic Department stations
 */
export async function getAllHydroStations(): Promise<HydroStation[]> {
    try {
        const response = await fetch('/api/hydro-tide');
        if (!response.ok) return [];

        const data = await response.json();
        return data.allStations || [];
    } catch (error) {
        console.error("Failed to fetch hydro stations:", error);
        return [];
    }
}
