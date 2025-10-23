/**
 * Distance Calculation Utilities
 * Provides functions for calculating distances between locations
 * and finding nearest piers/ports
 */

export interface PierLocation {
  name: string;
  lat: number;
  lon: number;
  region: string;
  type: 'fishing' | 'commercial' | 'ferry' | 'resort';
}

/**
 * Thailand coastal piers/ports database
 * Includes major fishing piers, commercial ports, and ferry terminals
 */
export const THAI_PIERS: PierLocation[] = [
  // ท่าเรือประมาณการ/เพาะปลา
  { name: 'ท่าเรือประมาณการ ปักษ์อุตรดิตถ์', lat: 13.7563, lon: 100.5018, region: 'กรุงเทพมหานคร', type: 'fishing' },
  { name: 'ท่าเรือประมาณการ พัทยา', lat: 12.9236, lon: 100.8783, region: 'ชลบุรี', type: 'fishing' },
  { name: 'ท่าเรือประมาณการ หัวหิน', lat: 11.2567, lon: 99.9534, region: 'ประจวบคีรีขันธ์', type: 'fishing' },

  // ท่าเรือเชิงสมุทร/ท่าท่องเที่ยว
  { name: 'ท่าเรือเชิงสมุทร ภูเก็ต', lat: 7.8804, lon: 98.3923, region: 'ภูเก็ต', type: 'ferry' },
  { name: 'ท่าเรือโก้ะเก๋า เกาะสมุย', lat: 9.1378, lon: 99.3328, region: 'สุราษฎร์ธานี', type: 'ferry' },
  { name: 'ท่าเรือเตอร์มินัล ท่องเที่ยว ภูเก็ต', lat: 7.8867, lon: 98.4045, region: 'ภูเก็ต', type: 'resort' },

  // ท่าเรือการค้า
  { name: 'ท่าเรือกรุงเทพ (ท่า 3)', lat: 13.6333, lon: 100.6167, region: 'กรุงเทพมหานคร', type: 'commercial' },
  { name: 'ท่าเรือแหลมฉบัง', lat: 12.7833, lon: 101.0167, region: 'ชลบุรี', type: 'commercial' },

  // ท่าเรืออื่น ๆ
  { name: 'ท่าเรือเกาะช้าง', lat: 9.9673, lon: 99.0515, region: 'ตราด', type: 'ferry' },
  { name: 'ท่าเรือกระบี่ (อ่าวนาง)', lat: 8.4304, lon: 99.9588, region: 'กระบี่', type: 'ferry' },
  { name: 'ท่าเรือบางแสน', lat: 13.3611, lon: 100.9847, region: 'ชลบุรี', type: 'fishing' },
  { name: 'ท่าเรือหาดใหญ่', lat: 7.2906, lon: 100.2788, region: 'สงขลา', type: 'fishing' },
  { name: 'ท่าเรือตากใจ', lat: 8.4304, lon: 99.9588, region: 'กระบี่', type: 'resort' },
  { name: 'ท่าเรือพังงา', lat: 8.4667, lon: 98.5278, region: 'พังงา', type: 'ferry' },
  { name: 'ท่าเรือสตูล', lat: 6.6167, lon: 100.2667, region: 'สตูล', type: 'fishing' },
  { name: 'ท่าเรือเตรียมพัฒนา พระแสง', lat: 9.5, lon: 99.5, region: 'จันทบุรี', type: 'commercial' },
];

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Find the nearest pier to a given location
 * @param lat - User latitude
 * @param lon - User longitude
 * @param maxDistance - Maximum distance in kilometers (optional)
 * @returns Nearest pier with distance
 */
export interface NearestPier extends PierLocation {
  distance: number;
}

export function findNearestPier(
  lat: number,
  lon: number,
  maxDistance: number = 100,
): NearestPier | null {
  let nearest: NearestPier | null = null;

  for (const pier of THAI_PIERS) {
    const distance = calculateDistance(lat, lon, pier.lat, pier.lon);
    if (distance <= maxDistance) {
      if (!nearest || distance < nearest.distance) {
        nearest = { ...pier, distance };
      }
    }
  }

  return nearest;
}

/**
 * Find multiple nearest piers
 * @param lat - User latitude
 * @param lon - User longitude
 * @param limit - Number of piers to return
 * @returns Array of nearest piers sorted by distance
 */
export function findNearestPiers(
  lat: number,
  lon: number,
  limit: number = 5,
): NearestPier[] {
  const distances = THAI_PIERS.map((pier) => ({
    ...pier,
    distance: calculateDistance(lat, lon, pier.lat, pier.lon),
  }));

  return distances.sort((a, b) => a.distance - b.distance).slice(0, limit);
}

/**
 * Format distance for display
 * @param distanceKm - Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toFixed(0)} เมตร`;
  }
  return `${distanceKm.toFixed(2)} กม.`;
}

/**
 * Get distance category/description
 * @param distanceKm - Distance in kilometers
 * @returns Distance category description
 */
export function getDistanceCategory(
  distanceKm: number,
): 'very-close' | 'close' | 'moderate' | 'far' {
  if (distanceKm < 5) return 'very-close';
  if (distanceKm < 20) return 'close';
  if (distanceKm < 50) return 'moderate';
  return 'far';
}

/**
 * Get Thai text description for distance category
 */
export function getDistanceCategoryText(
  category: ReturnType<typeof getDistanceCategory>,
): string {
  const categoryMap = {
    'very-close': 'ใกล้มาก',
    'close': 'ใกล้',
    'moderate': 'ระยะกลาง',
    'far': 'ไกล',
  };
  return categoryMap[category];
}

/**
 * Get color for distance category
 */
export function getDistanceCategoryColor(
  category: ReturnType<typeof getDistanceCategory>,
): string {
  const colorMap = {
    'very-close': 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    'close': 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    'moderate': 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
    'far': 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
  };
  return colorMap[category];
}

/**
 * Get icon emoji for pier type
 */
export function getPierTypeIcon(type: PierLocation['type']): string {
  const iconMap = {
    'fishing': '🎣',
    'commercial': '🏭',
    'ferry': '⛴️',
    'resort': '🏖️',
  };
  return iconMap[type];
}

/**
 * Get Thai text for pier type
 */
export function getPierTypeText(type: PierLocation['type']): string {
  const typeMap = {
    'fishing': 'ท่าเรือประมาณการ',
    'commercial': 'ท่าเรือการค้า',
    'ferry': 'ท่าท่องเที่ยว/เฟอร์รี่',
    'resort': 'ท่าท่องเที่ยวรีสอร์ต',
  };
  return typeMap[type];
}
