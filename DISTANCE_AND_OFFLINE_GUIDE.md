# Distance and Offline Features Guide

## Overview

This guide documents the new distance calculation and offline functionality added to the Sunmoon tide and weather application.

## Table of Contents

1. [Distance Calculation Features](#distance-calculation-features)
2. [Offline Functionality](#offline-functionality)
3. [API Reference](#api-reference)
4. [Implementation Details](#implementation-details)
5. [Usage Examples](#usage-examples)
6. [Performance Considerations](#performance-considerations)

---

## Distance Calculation Features

### What's New

The application now includes intelligent pier proximity detection and distance calculation to help users find the nearest fishing pier or port.

### Features

- **Automatic Nearest Pier Detection**: Automatically calculates and displays the nearest pier to the selected location
- **Distance Display**: Shows distance in both meters and kilometers
- **Pier Information**: Displays pier type, region, and location details
- **Distance Categories**: Visual categorization of distances (very close, close, moderate, far)
- **Pier Database**: Comprehensive database of 15+ major Thai coastal piers and ports

### Supported Pier Types

1. **Fishing** (🎣) - `ท่าเรือประมาณการ` - For commercial and recreational fishing
2. **Commercial** (🏭) - `ท่าเรือการค้า` - For cargo and commercial vessels
3. **Ferry** (⛴️) - `ท่าท่องเที่ยว/เฟอร์รี่` - For tourist and ferry services
4. **Resort** (🏖️) - `ท่าท่องเที่ยวรีสอร์ต` - For resort and recreation activities

### Distance Categories

| Category | Range | Icon | Thai Text |
|----------|-------|------|-----------|
| Very Close | < 5 km | 🟢 | ใกล้มาก |
| Close | 5-20 km | 🔵 | ใกล้ |
| Moderate | 20-50 km | 🟡 | ระยะกลาง |
| Far | > 50 km | 🔴 | ไกล |

### Pier Database

The application includes 15+ major Thai coastal piers:

```
กรุงเทพมหานคร (Bangkok):
- ท่าเรือประมาณการ ปักษ์อุตรดิตถ์ (13.7563, 100.5018)
- ท่าเรือกรุงเทพ ท่า 3 (13.6333, 100.6167) - Commercial

ภูเก็ต (Phuket):
- ท่าเรือเชิงสมุทร ภูเก็ต (7.8804, 98.3923) - Ferry
- ท่าเรือเตอร์มินัล ท่องเที่ยว (7.8867, 98.4045) - Resort

กระบี่ (Krabi):
- ท่าเรือกระบี่ อ่าวนาง (8.4304, 99.9588) - Ferry
- ท่าเรือตากใจ (8.4304, 99.9588) - Resort

สุราษฎร์ธานี (Surat Thani):
- ท่าเรือโก้ะเก๋า เกาะสมุย (9.1378, 99.3328) - Ferry

และอื่น ๆ...
```

---

## Offline Functionality

### What's New

The application now supports full offline mode with automatic data persistence and fallback mechanisms.

### Features

- **Automatic Caching**: All fetched data is automatically cached locally
- **Offline Mode**: Full functionality when internet is unavailable
- **Fallback Data**: Serves cached data when API requests fail
- **Storage Management**: Automatic cleanup of expired entries
- **Cache Statistics**: Displays cache usage and status
- **Multiple Storage Layers**: Both localStorage and IndexedDB support

### Cache Types

#### 1. In-Memory Cache
- **Duration**: 5 minutes
- **Use**: Fast data retrieval during the same session
- **Location**: JavaScript memory (Map object)

#### 2. localStorage Cache
- **Duration**: Varies by data type
  - Tide Data: 24 hours
  - Weather Data: 3 hours
  - Locations: 7 days
  - Pier Data: 30 days
- **Use**: Persistent storage across sessions
- **Capacity**: ~5 MB limit

#### 3. IndexedDB (Optional)
- **Duration**: Custom per entry
- **Use**: Large dataset storage
- **Capacity**: 50+ MB available
- **Note**: Not actively used but infrastructure available

### Cache Data Types

#### Tide Data
```javascript
{
  apiStatus: 'success',
  tideData: {
    highTideTime: '13:45',
    lowTideTime: '19:30',
    currentWaterLevel: 1.2,
    isFromCache: true,
    // ... other tide properties
  },
  timestamp: 1699564800000,
  expiresAt: 1699651200000 // 24 hours from save
}
```

#### Weather Data
```javascript
{
  main: {
    temp: 28,
    humidity: 75,
    pressure: 1013
  },
  wind: { speed: 3.2, deg: 180 },
  timestamp: 1699564800000,
  expiresAt: 1699574400000 // 3 hours from save
}
```

#### Pier Data
```javascript
{
  name: 'ท่าเรือประมาณการ ปักษ์อุตรดิตถ์',
  lat: 13.7563,
  lon: 100.5018,
  region: 'กรุงเทพมหานคร',
  type: 'fishing',
  distance: 2.5,
  timestamp: 1699564800000,
  expiresAt: 1732272000000 // 30 days from save
}
```

### Network Status Indicators

#### Offline (No Internet)
```
🔴 ไม่มีการเชื่อมต่ออินเทอร์เน็ต - ใช้ข้อมูลที่บันทึกไว้
```

#### Slow Connection
```
🟡 สัญญาณอ่อน (3g) - อาจใช้เวลานานในการโหลด
```

#### From Cache
```
⚡ ข้อมูลจากบันทึก
กดรีเฟรชเพื่อดึงข้อมูลใหม่
```

---

## API Reference

### Distance Utilities (`lib/distance-utils.ts`)

#### `calculateDistance(lat1, lon1, lat2, lon2): number`
Calculates distance between two coordinates using Haversine formula.

```typescript
import { calculateDistance } from '@/lib/distance-utils';

const distance = calculateDistance(13.7563, 100.5018, 7.8804, 98.3923);
console.log(distance); // ~1000 (kilometers)
```

**Parameters:**
- `lat1` (number): First latitude
- `lon1` (number): First longitude
- `lat2` (number): Second latitude
- `lon2` (number): Second longitude

**Returns:** Distance in kilometers (number)

#### `findNearestPier(lat, lon, maxDistance?): NearestPier | null`
Finds the nearest pier to given coordinates.

```typescript
import { findNearestPier } from '@/lib/distance-utils';

const pier = findNearestPier(13.7563, 100.5018, 200);
if (pier) {
  console.log(`Nearest pier: ${pier.name}`);
  console.log(`Distance: ${pier.distance.toFixed(2)} km`);
}
```

**Parameters:**
- `lat` (number): User latitude
- `lon` (number): User longitude
- `maxDistance` (number, optional): Maximum search radius in km (default: 100)

**Returns:** `NearestPier` object or null if not found

#### `findNearestPiers(lat, lon, limit?): NearestPier[]`
Finds multiple nearest piers, sorted by distance.

```typescript
import { findNearestPiers } from '@/lib/distance-utils';

const piers = findNearestPiers(13.7563, 100.5018, 5);
piers.forEach(pier => {
  console.log(`${pier.name}: ${pier.distance.toFixed(2)} km`);
});
```

**Parameters:**
- `lat` (number): User latitude
- `lon` (number): User longitude
- `limit` (number, optional): Number of piers to return (default: 5)

**Returns:** Array of `NearestPier` objects

#### `formatDistance(distanceKm): string`
Formats distance for display.

```typescript
import { formatDistance } from '@/lib/distance-utils';

console.log(formatDistance(0.5));   // "500 เมตร"
console.log(formatDistance(10.5));  // "10.50 กม."
```

#### `getDistanceCategory(distanceKm): 'very-close' | 'close' | 'moderate' | 'far'`
Gets distance category.

```typescript
import { getDistanceCategory, getDistanceCategoryText } from '@/lib/distance-utils';

const category = getDistanceCategory(15);
console.log(getDistanceCategoryText(category)); // "ใกล้"
```

#### `getPierTypeIcon(type): string`
Gets emoji icon for pier type.

```typescript
console.log(getPierTypeIcon('fishing'));    // "🎣"
console.log(getPierTypeIcon('commercial')); // "🏭"
console.log(getPierTypeIcon('ferry'));      // "⛴️"
console.log(getPierTypeIcon('resort'));     // "🏖️"
```

### Offline Storage Utilities (`lib/offline-storage.ts`)

#### `saveToCache(key, data, cacheDurationMs?): boolean`
Saves data to cache.

```typescript
import { saveToCache } from '@/lib/offline-storage';

const success = saveToCache(
  'my-tide-data',
  { highTide: '13:45', lowTide: '19:30' },
  24 * 60 * 60 * 1000 // 24 hours
);
```

#### `loadFromCache(key, maxAgeMs?): T | null`
Loads data from cache.

```typescript
import { loadFromCache } from '@/lib/offline-storage';

const data = loadFromCache('my-tide-data', 24 * 60 * 60 * 1000);
if (data) {
  console.log('Data found:', data);
}
```

#### `clearExpiredCacheEntries(): number`
Clears all expired cache entries.

```typescript
import { clearExpiredCacheEntries } from '@/lib/offline-storage';

const cleared = clearExpiredCacheEntries();
console.log(`Cleared ${cleared} expired entries`);
```

#### `getCacheStats(): CacheStats`
Gets cache usage statistics.

```typescript
import { getCacheStats } from '@/lib/offline-storage';

const stats = getCacheStats();
console.log(`Total entries: ${stats.totalEntries}`);
console.log(`Tide entries: ${stats.tideEntries}`);
console.log(`Size: ${stats.approximateSize} bytes`);
```

#### `clearAllCache(): void`
Clears all cache entries.

```typescript
import { clearAllCache } from '@/lib/offline-storage';

clearAllCache();
console.log('All cache cleared');
```

#### `saveTideDataCache(lat, lon, date, tideData): boolean`
Convenience function to save tide data.

```typescript
import { saveTideDataCache } from '@/lib/offline-storage';

saveTideDataCache(13.7563, 100.5018, new Date(), tideData);
```

#### `loadTideDataCache(lat, lon, date): any`
Convenience function to load tide data.

```typescript
import { loadTideDataCache } from '@/lib/offline-storage';

const tideData = loadTideDataCache(13.7563, 100.5018, new Date());
```

---

## Implementation Details

### How Distance Calculation Works

1. **Haversine Formula**: Uses the spherical law of cosines to calculate great-circle distances
2. **Accuracy**: Accurate to within meters for typical distances
3. **Performance**: O(n) complexity where n is number of piers (15)
4. **No API Required**: All calculations are client-side

### How Offline Mode Works

1. **Data Flow**:
   ```
   User Request
   ↓
   Check In-Memory Cache (5 min) ✓ SERVE
   ↓ (miss)
   Check localStorage Cache (24 hrs for tide) ✓ SERVE + BACKGROUND REFRESH
   ↓ (miss/expired)
   Fetch from API ✓ CACHE + SERVE
   ↓ (offline)
   Return cached data ✓ SERVE
   ↓ (no cache)
   Return error ✗ ERROR
   ```

2. **Automatic Cleanup**:
   - On app initialization: Clear expired entries
   - On cache write failure: Remove oldest entries to free space
   - Weekly background task (optional): Deep cleanup

3. **Storage Priority**:
   - In-memory (fastest)
   - localStorage (persistent, fast)
   - IndexedDB (large capacity, slower)

### Cache Key Structure

```
Format: sunmoon_[type]_[lat]_[lon]_[date]

Examples:
- sunmoon_tide_13.7563_100.5018_2024-11-10
- sunmoon_weather_13.7563_100.5018_current
- sunmoon_pier_13.7563_100.5018_current
- sunmoon_location_13.7563_100.5018_current
```

---

## Usage Examples

### Example 1: Display Nearest Pier

```typescript
import { findNearestPier, formatDistance } from '@/lib/distance-utils';

function ShowNearestPier({ lat, lon }) {
  const pier = findNearestPier(lat, lon);
  
  if (!pier) return <div>No pier found nearby</div>;
  
  return (
    <div>
      <h3>{pier.name}</h3>
      <p>Distance: {formatDistance(pier.distance)}</p>
      <p>Region: {pier.region}</p>
      <p>Type: {pier.type}</p>
    </div>
  );
}
```

### Example 2: Load Data with Offline Fallback

```typescript
import { loadFromCache, saveToCache } from '@/lib/offline-storage';

async function fetchTideDataWithFallback(lat, lon, date) {
  const cacheKey = `tide_${lat}_${lon}_${date}`;
  
  try {
    // Try to fetch fresh data
    const response = await fetch(`/api/tide?lat=${lat}&lon=${lon}&date=${date}`);
    const data = await response.json();
    
    // Save to cache
    saveToCache(cacheKey, data, 24 * 60 * 60 * 1000);
    
    return data;
  } catch (error) {
    // Return cached data if fetch fails
    const cached = loadFromCache(cacheKey);
    if (cached) {
      return { ...cached, isFromCache: true };
    }
    throw error;
  }
}
```

### Example 3: Multiple Nearest Piers

```typescript
import { findNearestPiers, formatDistance, getPierTypeIcon } from '@/lib/distance-utils';

function ShowNearbPiers({ lat, lon }) {
  const piers = findNearestPiers(lat, lon, 5);
  
  return (
    <ul>
      {piers.map((pier) => (
        <li key={pier.name}>
          {getPierTypeIcon(pier.type)} {pier.name}
          <br />
          {formatDistance(pier.distance)} • {pier.region}
        </li>
      ))}
    </ul>
  );
}
```

### Example 4: Monitor Cache Status

```typescript
import { getCacheStats, formatCacheSize } from '@/lib/offline-storage';

function CacheStatus() {
  const stats = getCacheStats();
  const percentage = (stats.approximateSize / (5 * 1024 * 1024)) * 100;
  
  return (
    <div>
      <p>Total cached items: {stats.totalEntries}</p>
      <p>Tide data: {stats.tideEntries}</p>
      <p>Weather data: {stats.weatherEntries}</p>
      <p>Cache size: {formatCacheSize(stats.approximateSize)}</p>
      <p>Usage: {percentage.toFixed(1)}%</p>
    </div>
  );
}
```

---

## Performance Considerations

### Distance Calculation
- **Time Complexity**: O(n) where n = 15 piers
- **Typical Time**: < 1ms
- **Memory**: Minimal, only stores pier database once

### Caching Strategy
- **Memory**: In-memory cache limited to 5 requests
- **Storage**: localStorage limited to ~5MB per domain
- **Network**: Throttled to 1 request per 2 seconds

### Optimization Tips

1. **Reuse Calculations**:
   ```typescript
   // Cache the pier calculation for multiple uses
   const nearestPier = findNearestPier(lat, lon);
   setNearestPierInfo(nearestPier);
   ```

2. **Batch Updates**:
   ```typescript
   // Update multiple pieces at once
   const stats = getCacheStats();
   setCacheStats(stats);
   ```

3. **Cleanup Old Entries**:
   ```typescript
   // Run periodically (e.g., hourly)
   const cleaned = clearExpiredCacheEntries();
   ```

4. **Monitor Cache Size**:
   ```typescript
   // Warn before quota exceeded
   if (stats.approximateSize > 4 * 1024 * 1024) {
     console.warn('Cache approaching quota');
   }
   ```

---

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| localStorage | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Geolocation | ✅ | ✅ | ✅ | ✅ |
| Navigator.onLine | ✅ | ✅ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |

---

## Troubleshooting

### Cache Not Persisting
- Check if localStorage is available: `typeof(Storage) !== "undefined"`
- Check browser privacy settings
- Clear browser cache and restart

### Distance Calculation Incorrect
- Verify coordinates are in correct format (lat, lon)
- Check pier database has correct coordinates
- Use `calculateDistance()` directly to debug

### Offline Mode Not Working
- Ensure online/offline event listeners are attached
- Check browser console for errors
- Verify cache entries exist: `getCacheStats()`

### Cache Quota Exceeded
- Manually clear old entries: `clearExpiredCacheEntries()`
- Clear all cache: `clearAllCache()`
- Reduce cache duration or cleanup frequency

---

## Future Enhancements

1. **Smart Pier Database**:
   - Add real-time pier availability
   - Tide predictions specific to piers
   - Pier facilities information

2. **Advanced Caching**:
   - Predictive data prefetching
   - Service Worker integration
   - Background sync

3. **Distance Features**:
   - Route planning to pier
   - Navigation assistance
   - Real-time location tracking

4. **User Preferences**:
   - Favorite piers list
   - Custom cache duration
   - Distance unit preferences

---

## Related Files

- `/lib/distance-utils.ts` - Distance calculation functions
- `/lib/offline-storage.ts` - Offline storage and caching
- `/lib/tide-service.ts` - Tide data types (updated with new fields)
- `/components/enhanced-location-selector.tsx` - UI integration
- `/hooks/useNetworkStatus.ts` - Network status detection

---

## License

This documentation is part of the Sunmoon tide prediction application.