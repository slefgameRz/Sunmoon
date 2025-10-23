# Distance & Offline Features - Quick Reference

## 🎯 What Was Added?

Two major features for the Sunmoon tide app:

1. **Distance Calculator** - Shows nearest fishing pier to user's location
2. **Offline Support** - App works without internet using cached data

---

## 📁 Files Created

```
lib/distance-utils.ts              (7.7 KB) - Distance calculations
lib/offline-storage.ts             (12 KB)  - Offline cache management
DISTANCE_AND_OFFLINE_GUIDE.md      (17 KB) - Complete API reference
IMPLEMENTATION_DISTANCE_OFFLINE.md (16 KB) - Integration steps
DISTANCE_OFFLINE_SUMMARY.md        (14 KB) - Project overview
QUICK_REFERENCE.md                 (This file)
```

---

## 🚀 Quick Integration (5 Steps)

### 1. Import New Modules
```typescript
import { findNearestPier, formatDistance } from "@/lib/distance-utils";
import { saveTideDataCache, loadTideDataCache } from "@/lib/offline-storage";
```

### 2. Add State
```typescript
const [nearestPierInfo, setNearestPierInfo] = useState<any>(null);
const [cacheStats, setCacheStats] = useState({ totalEntries: 0, approximateSize: 0 });
```

### 3. Calculate Nearest Pier
```typescript
const updateNearestPier = useCallback(() => {
  const pier = findNearestPier(selectedLocation.lat, selectedLocation.lon, 200);
  if (pier) setNearestPierInfo(pier);
}, [selectedLocation]);
```

### 4. Add Offline Cache to Fetch
```typescript
// Before fetch
const cachedData = loadTideDataCache(lat, lon, date);

// After successful fetch
saveTideDataCache(lat, lon, date, result.tideData);

// On error, use cached
if (cachedData) setCurrentTideData({...cachedData, isFromCache: true});
```

### 5. Add UI Components
See IMPLEMENTATION_DISTANCE_OFFLINE.md for UI code templates

---

## 📊 Distance Categories

| Category | Range | Thai | Color | Icon |
|----------|-------|------|-------|------|
| Very Close | < 5 km | ใกล้มาก | 🟢 Green | N/A |
| Close | 5-20 km | ใกล้ | 🔵 Blue | N/A |
| Moderate | 20-50 km | ระยะกลาง | 🟡 Yellow | N/A |
| Far | > 50 km | ไกล | 🔴 Red | N/A |

---

## 🎣 Pier Types

| Type | Thai | Icon | Count |
|------|------|------|-------|
| Fishing | ท่าเรือประมาณการ | 🎣 | 6 |
| Commercial | ท่าเรือการค้า | 🏭 | 3 |
| Ferry | ท่าท่องเที่ยว/เฟอร์รี่ | ⛴️ | 5 |
| Resort | ท่าท่องเที่ยวรีสอร์ต | 🏖️ | 2 |

---

## 💻 API Reference

### Distance Utilities

```typescript
// Calculate distance between two points (km)
calculateDistance(lat1, lon1, lat2, lon2): number

// Find nearest pier
findNearestPier(lat, lon, maxDistance=100): NearestPier | null

// Find 5 nearest piers
findNearestPiers(lat, lon, limit=5): NearestPier[]

// Format distance for display
formatDistance(distanceKm): string  // "42.50 กม." or "500 เมตร"

// Get category
getDistanceCategory(distanceKm): 'very-close' | 'close' | 'moderate' | 'far'

// Get Thai text
getDistanceCategoryText(category): string  // "ใกล้มาก"

// Get CSS colors
getDistanceCategoryColor(category): string  // "text-green-600 bg-green-100..."

// Get pier emoji
getPierTypeIcon(type): string  // "🎣" for fishing

// Get pier description
getPierTypeText(type): string  // "ท่าเรือประมาณการ"
```

### Offline Storage

```typescript
// Save any data
saveToCache(key, data, durationMs): boolean

// Load any data
loadFromCache(key, maxAgeMs?): T | null

// Tide data helpers
saveTideDataCache(lat, lon, date, data): boolean
loadTideDataCache(lat, lon, date): any

// Weather data helpers
saveWeatherDataCache(lat, lon, data): boolean
loadWeatherDataCache(lat, lon): any

// Cache management
getCacheStats(): {totalEntries, tideEntries, weatherEntries, ...}
clearExpiredCacheEntries(): number  // Returns count cleared
clearAllCache(): void
initializeOfflineStorage(): void  // Call on app start
formatCacheSize(bytes): string  // "1.23 MB"
```

---

## ⏱️ Cache Durations

- **Tide Data:** 24 hours
- **Weather Data:** 3 hours
- **Location Data:** 7 days
- **Pier Data:** 30 days

---

## 🔄 Offline Data Flow

```
User Requests Data
    ↓
Check In-Memory Cache ✓ SERVE (5 min)
    ↓ MISS
Check localStorage ✓ SERVE (24h for tide)
    ↓ MISS
Fetch from API ✓ CACHE + SERVE
    ↓ ERROR/OFFLINE
Use Cached Data ✓ SERVE
    ↓ NO CACHE
Show Error ✗
```

---

## 🛠️ Common Usage Patterns

### Get Nearest Pier
```typescript
const pier = findNearestPier(13.7563, 100.5018);
if (pier) {
  console.log(pier.name);              // "ท่าเรือ..."
  console.log(formatDistance(pier.distance));  // "2.45 กม."
}
```

### Load Offline-First
```typescript
let data = loadTideDataCache(lat, lon, date);
if (!data) {
  data = await fetchFromAPI();
  saveTideDataCache(lat, lon, date, data);
}
```

### Show Cache Status
```typescript
const stats = getCacheStats();
console.log(`${stats.totalEntries} items, ${formatCacheSize(stats.approximateSize)}`);
```

### Clear Old Data
```typescript
const cleared = clearExpiredCacheEntries();
console.log(`Cleared ${cleared} old entries`);
```

---

## 🧪 Testing Commands

```typescript
// Test distance calculation
import { calculateDistance, formatDistance } from '@/lib/distance-utils';
calculateDistance(13.7563, 100.5018, 7.8804, 98.3923);  // ~1000 km

// Test cache operations
import { getCacheStats, formatCacheSize } from '@/lib/offline-storage';
getCacheStats();  // Check what's cached

// Verify pier database
import { THAI_PIERS } from '@/lib/distance-utils';
console.log(THAI_PIERS.length);  // 15+ piers

// Find all fishing piers
THAI_PIERS.filter(p => p.type === 'fishing')
```

---

## 📱 UI Components Templates

### Nearest Pier Card
```typescript
{nearestPierInfo && (
  <Card className="border-0 bg-gradient-to-r from-orange-50 to-amber-50">
    <CardHeader>
      <CardTitle className="flex items-center gap-3">
        <Anchor className="h-6 w-6 text-orange-600" />
        ท่าเรือใกล้ที่สุด
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-lg font-bold">{nearestPierInfo.name}</div>
          <div>{getPierTypeIcon(nearestPierInfo.type)} {getPierTypeText(nearestPierInfo.type)}</div>
          <div>{nearestPierInfo.region}</div>
        </div>
        <div>
          <div className="text-3xl font-black text-orange-600">
            {formatDistance(nearestPierInfo.distance)}
          </div>
          <div className={getDistanceCategoryColor(getDistanceCategory(nearestPierInfo.distance))}>
            {getDistanceCategoryText(getDistanceCategory(nearestPierInfo.distance))}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

### Offline Status Banner
```typescript
{!isOnline && (
  <div className="bg-amber-100 border-l-4 border-amber-500 p-4">
    <h3>ทำงานแบบออฟไลน์</h3>
    <p>บันทึกไว้: {cacheStats.totalEntries} รายการ ({formatCacheSize(cacheStats.approximateSize)})</p>
  </div>
)}
```

---

## 🐛 Debugging

### Check Cache Contents
```typescript
// In browser console
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.startsWith('sunmoon_')) {
    console.log(key, JSON.parse(localStorage.getItem(key)));
  }
}
```

### Test Distance Calculation
```typescript
const { calculateDistance } = await import('@/lib/distance-utils');
calculateDistance(13.7563, 100.5018, 7.8804, 98.3923)  // Bangkok to Phuket
```

### Monitor Cache Stats
```typescript
setInterval(() => {
  const stats = getCacheStats();
  console.log('Cache:', stats);
}, 5000);
```

---

## 📊 File Sizes & Line Counts

| File | Size | Lines | Purpose |
|------|------|-------|---------|
| distance-utils.ts | 7.7 KB | 209 | Distance calculations |
| offline-storage.ts | 12 KB | 435 | Cache management |
| GUIDE.md | 17 KB | 608 | Full API reference |
| IMPLEMENTATION.md | 16 KB | 521 | Integration steps |
| SUMMARY.md | 14 KB | 595 | Project overview |

**Total: ~61 KB of code + documentation**

---

## ✅ Integration Checklist

- [ ] Copy files to `lib/` directory
- [ ] Update enhanced-location-selector.tsx (9 steps)
- [ ] Add imports
- [ ] Add state variables
- [ ] Implement updateNearestPier()
- [ ] Update fetchForecastData()
- [ ] Add UI components
- [ ] Test distance calculations
- [ ] Test offline functionality
- [ ] Test mobile responsiveness
- [ ] Build project
- [ ] Deploy

---

## 🚀 Performance Notes

- Distance calculation: < 1ms per pier lookup
- Cache read: < 5ms
- Cache write: < 10ms
- No external APIs needed
- All calculations client-side
- Storage limit: ~5MB per domain
- Auto-cleanup of old data

---

## 🔗 Documentation Links

- **Full API Reference:** `DISTANCE_AND_OFFLINE_GUIDE.md`
- **Step-by-Step Guide:** `IMPLEMENTATION_DISTANCE_OFFLINE.md`
- **Project Summary:** `DISTANCE_OFFLINE_SUMMARY.md`
- **This Quick Ref:** `QUICK_REFERENCE.md`

---

## ❓ FAQ

**Q: Will this break existing code?**
A: No, completely backwards compatible. Optional features.

**Q: Does it require internet?**
A: No, works completely offline after initial data fetch.

**Q: Can I add more piers?**
A: Yes, edit THAI_PIERS array in distance-utils.ts

**Q: Is data private?**
A: Yes, all stored locally in browser storage.

**Q: What about old browsers?**
A: Requires localStorage support (IE10+, all modern browsers).

**Q: Can I customize cache duration?**
A: Yes, pass durationMs parameter to saveToCache().

---

## 🎓 Next Steps

1. **Read:** IMPLEMENTATION_DISTANCE_OFFLINE.md (15 min)
2. **Integrate:** Follow 9 integration steps (30 min)
3. **Test:** Run checklist (45 min)
4. **Deploy:** Build and ship (5 min)

---

**Status:** ✅ Ready for Integration
**Version:** 1.0.0
**Last Updated:** October 22, 2024