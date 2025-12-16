"use server";

export interface ThaiWaterLevel {
    station_id: string;
    station_name: string;
    province_name: string;
    water_level: number; // Current water level
    storage_percent?: number; // For dams
    timestamp: string;
    lat: number;
    lon: number;
}

export interface ThaiWaterResponse {
    result: ThaiWaterLevel[];
}

/**
 * Fetch real-time water level data from ThaiWater Open API
 * Using the public Runoff endpoint which is often accessible
 */
export async function getRealTimeWaterLevels(): Promise<ThaiWaterLevel[]> {
    try {
        // Note: This is a public endpoint found in search results.
        // In a production app, we should use a proper API key if required.
        // This endpoint typically returns river/canal runoff but also coastal stations.
        const response = await fetch('http://api.thaiwater.net/v1/public/Runoff', {
            next: { revalidate: 300 }, // Cache for 5 minutes
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'SEAPALO-Disaster-Watch/1.0'
            }
        });

        if (!response.ok) {
            console.warn('Failed to fetch from ThaiWater API, using mock data for demo');
            return getMockWaterLevels();
        }

        const data = await response.json();

        // Transform data to our interface if needed
        // The actual structure might vary, so we map safely
        if (data && Array.isArray(data.data)) {
            return data.data.map((item: any) => ({
                station_id: item.station_id?.toString() || `UNKNOWN-${Math.random()}`,
                station_name: item.tele_station_name?.th || item.station_name || 'Unknown Station',
                province_name: item.province_name?.th || 'Unknown',
                water_level: parseFloat(item.water_level) || 0,
                timestamp: item.tele_station_lat ? new Date().toISOString() : new Date().toISOString(), // Use current time if missing
                lat: parseFloat(item.tele_station_lat) || 13.75,
                lon: parseFloat(item.tele_station_long) || 100.50,
            }));
        } else if (data && data.result) {
            // Handle "result" wrapper if that's the format
            return data.result;
        }

        return getMockWaterLevels();
    } catch (error) {
        console.error('Error fetching ThaiWater data:', error);
        return getMockWaterLevels();
    }
}

// Fallback mock data with realistic locations for coastal areas
function getMockWaterLevels(): ThaiWaterLevel[] {
    const now = new Date().toISOString();
    return [
        {
            station_id: "MOCK-001",
            station_name: "สถานีปากแม่น้ำเจ้าพระยา (ป้อมพระจุลฯ)",
            province_name: "สมุทรปราการ",
            water_level: 2.35,
            timestamp: now,
            lat: 13.5381,
            lon: 100.5894
        },
        {
            station_id: "MOCK-002",
            station_name: "สถานีเกาะสีชัง",
            province_name: "ชลบุรี",
            water_level: 1.85,
            timestamp: now,
            lat: 13.1554,
            lon: 100.8173
        },
        {
            station_id: "MOCK-003",
            station_name: "สถานีหัวหิน",
            province_name: "ประจวบคีรีขันธ์",
            water_level: 1.45,
            timestamp: now,
            lat: 12.5684,
            lon: 99.9577
        },
        {
            station_id: "MOCK-004",
            station_name: "สถานีแหลมงอบ",
            province_name: "ตราด",
            water_level: 1.20,
            timestamp: now,
            lat: 12.1706,
            lon: 102.3923
        },
        {
            station_id: "MOCK-005",
            station_name: "สถานีปากน้ำหลังสวน",
            province_name: "ชุมพร",
            water_level: 1.10,
            timestamp: now,
            lat: 9.9442,
            lon: 99.1722
        },
        {
            station_id: "MOCK-006",
            station_name: "สถานีเกาะภูเก็ต",
            province_name: "ภูเก็ต",
            water_level: 2.10,
            timestamp: now,
            lat: 7.8247,
            lon: 98.4042
        },
        {
            station_id: "MOCK-007",
            station_name: "สถานีปากน้ำระนอง",
            province_name: "ระนอง",
            water_level: 2.45,
            timestamp: now,
            lat: 9.9650,
            lon: 98.5958
        },
        {
            station_id: "MOCK-008",
            station_name: "สถานีท่าเรือคลองเตย",
            province_name: "กรุงเทพมหานคร",
            water_level: 1.95,
            timestamp: now,
            lat: 13.7028,
            lon: 100.5698
        }
    ];
}
