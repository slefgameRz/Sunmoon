# Usage Examples & Troubleshooting Guide

## Offline Storage & Pier Distance Features

---

## Table of Contents
1. [Basic Usage Examples](#basic-usage-examples)
2. [Advanced Scenarios](#advanced-scenarios)
3. [Troubleshooting Guide](#troubleshooting-guide)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Development Tips](#development-tips)
6. [Browser DevTools Guide](#browser-devtools-guide)

---

## Basic Usage Examples

### Example 1: Automatic Offline Fallback

When user loses connection, the app automatically falls back to cached data:

```typescript
// User has poor/no connection
// Component automatically:
// 1. Checks localStorage for cached tide data
// 2. Displays cache with "ข้อมูลจากแคช (เครือข่ายอื่น)" status
// 3. User sees last known data seamlessly

Result: App continues to function, user sees: "ข้อมูลจากแคช (เครือข่ายอื่น)"
```

**User Experience:**
- User selects Bangkok location
- Network unavailable
- App loads cached data from last session
- User sees tide information immediately
- Status shows "ข้อมูลจากแคช (เครือข่ายอื่น)" (Cache - Network Issue)

---

### Example 2: Finding Nearest Pier

When user selects a location, nearest pier is automatically detected:

```typescript
// User selects location: Bangkok (13.7563°N, 100.5018°E)
// Component automatically:
// 1. Calls findNearestPier(13.7563, 100.5018)
// 2. Finds "ท่าเรือประมาณการ ปักษ์อุตรดิตถ์" at 3.2 km
// 3. Displays pier card with all details

Result:
- Pier Name: ท่าเรือประมาณการ ปักษ์อุตรดิตถ์
- Type: 🎣 ท่าเรือประมาณการ (Fishing)
- Distance: 3.2 กม.
- Category: ใกล้มาก (Very Close) - Green badge
- Region: กรุงเทพมหานคร
```

---

### Example 3: Viewing Tide Events

Full-day tide table displays all hourly events:

```
เวลา      ประเภท    ระดับน้ำ (ม.)    สถานะ
06:00     ↑ ขึ้น        1.23         ทำนาย
07:00     ↑ ขึ้น        1.45         ทำนาย
12:00     ↓ ลง         0.89         ทั่วไป
18:00     ↑ ขึ้น        1.78         ทำนาย
...
```

User can scroll horizontally on mobile to see all columns.

---

### Example 4: Checking Cache Status

Check how much data is cached:

```typescript
// In browser console:
const cacheStats = getCacheStats();
console.log(cacheStats);

Output:
{
  totalEntries: 24,
  tideEntries: 8,
  weatherEntries: 6,
  locationEntries: 4,
  pierEntries: 6,
  approximateSize: 245600  // ~240 KB
}
```

---

## Advanced Scenarios

### Scenario 1: Multi-Location Caching

User views multiple locations throughout the day:

```
09:00 - User views Bangkok
        → Tide data cached for Bangkok
        → Weather data cached for Bangkok

12:00 - User switches to Phuket
        → Tide data cached for Phuket
        → Weather data cached for Phuket
        → Bangkok cache still available

15:00 - User returns to Bangkok
        → Instant load from cache (no API call)
        → Fresh data if cache still valid (< 24h)
```

**Cache Strategy:**
- Tide data: 24-hour TTL → Bangkok data valid until 09:00 tomorrow
- Weather data: 3-hour TTL → Phuket data expires at 15:00

---

### Scenario 2: Traveling User (GPS Location Updates)

User's location changes while viewing the app:

```
Step 1: User at Bangkok (13.7563, 100.5018)
        → Nearest pier: ท่าเรือประมาณการ ปักษ์อุตรดิตถ์ (3.2 km)

Step 2: User drives to Chonburi (13.3611, 100.9847)
        → useEffect detects location change
        → updateNearestPier() called
        → Nearest pier updated: บางแสน (0.5 km)
        → New cache fetched if not available

Step 3: User at sea (13.5, 100.7)
        → Nearest pier: Several options within 30-50 km
        → All are fetched, closest shown
```

---

### Scenario 3: Storage Quota Management

What happens when browser storage is full:

```
Scenario: localStorage at 4.9 MB, app tries to save new tide data

Step 1: saveToCache() checks size → exceeds 5MB limit
Step 2: clearOldestCacheEntries(10) called → removes 10 oldest entries
Step 3: ~50-100 KB freed
Step 4: New data successfully saved

User Experience: Seamless - no lag or interruption
```

---

### Scenario 4: Switching Between Online/Offline Multiple Times

User with unreliable connection:

```
Time    Status          App Behavior
09:00   Online          Fetches fresh data → Caches it
09:15   Offline         Uses cache from 09:00
09:20   Online          Checks fresh data → Updates cache
09:45   Offline         Uses cache from 09:20
10:00   Online          Fresh data updated
```

**UI Indicators:**
- Online: "ข้อมูลจากปกติ" (Fresh data)
- Offline: "ข้อมูลจากแคช (เครือข่ายอื่น)" (Cache - Network issue)
- Stale: "ข้อมูลจากแคช (API ล้มเหลว)" (Cache - API failed)

---

## Troubleshooting Guide

### Issue 1: Nearest Pier Card Not Showing

**Symptoms:**
- Location selected but pier card empty
- No "ท่าเรือที่ใกล้ที่สุด" section visible

**Diagnostics:**
```typescript
// Check if pier was found
console.log('nearestPierInfo:', nearestPierInfo);

// Check if location is valid
console.log('selectedLocation:', selectedLocation);

// Check if pier database loaded
console.log('THAI_PIERS:', THAI_PIERS);
```

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Location has no pier within 100km | Increase maxDistance in findNearestPier() |
| Wrong coordinates | Verify lat/lon format (13.7563, 100.5018) |
| Pier database empty | Check THAI_PIERS array populated |
| updateNearestPier() not called | Verify useEffect dependency array |

---

### Issue 2: Cached Data Too Old

**Symptoms:**
- "ข้อมูลจากแคช" showing but data from yesterday
- User wants fresh data

**Solution 1: Manual Refresh**
- Click "อัปเดตข้อมูล" button
- Forces fresh API call
- Updates cache with new timestamp

**Solution 2: Clear Cache**
```typescript
// In browser console:
import { clearAllCache } from '@/lib/offline-storage';
clearAllCache();

// Then refresh page
location.reload();
```

**Solution 3: Check Cache Expiration**
```typescript
const tideData = loadTideDataCache(lat, lon, date);
// If null → cache expired
// If data → cache still valid
```

---

### Issue 3: Cache Quota Exceeded

**Symptoms:**
- App slows down with many locations viewed
- "Storage quota exceeded" errors in console

**Solution 1: Manual Cleanup**
```typescript
// In browser console:
import { clearExpiredCacheEntries } from '@/lib/offline-storage';
const cleared = clearExpiredCacheEntries();
console.log(`Cleared ${cleared} expired entries`);
```

**Solution 2: Clear Specific Type**
```typescript
// Clear all tide data
const keys = Object.keys(localStorage);
keys.forEach(key => {
  if (key.includes('_tide_')) {
    localStorage.removeItem(key);
  }
});
```

**Solution 3: Check Storage**
```typescript
// In browser DevTools > Application > Local Storage
// Look for "sunmoon_*" keys
// Each shows size in bytes
```

---

### Issue 4: Distance Calculation Seems Wrong

**Symptoms:**
- Pier distance shows 500km when should be 50km
- Wrong pier found as nearest

**Diagnostic Steps:**

1. **Check coordinates are correct:**
```typescript
console.log('User lat:', selectedLocation.lat);  // Should be 0-90
console.log('User lon:', selectedLocation.lon);  // Should be 0-180
console.log('Pier lat:', nearestPierInfo.lat);
console.log('Pier lon:', nearestPierInfo.lon);
```

2. **Calculate manually:**
```typescript
import { calculateDistance } from '@/lib/distance-utils';
const dist = calculateDistance(13.7563, 100.5018, 13.7563, 100.5018);
console.log('Distance:', dist); // Should be ~0 (same location)
```

3. **Common Issues:**
- Longitude negative for western hemisphere (should not happen in Thailand)
- Latitude/Longitude swapped (lat should be -90 to 90, lon should be -180 to 180)

---

### Issue 5: Tide Table Not Showing

**Symptoms:**
- Forecast tab open but no tide table visible
- Only water level and stats shown

**Causes:**

| Cause | Check |
|-------|-------|
| tideEvents array empty | `console.log(currentTideData.tideEvents)` |
| API failed to get events | Check `currentTideData.apiStatus` |
| Data not cached either | Check if fetch failed and cache empty |

**Solution:**
```typescript
// Force refresh to get new tide events
fetchForecastData();

// Check result
setTimeout(() => {
  console.log('Tide events:', currentTideData.tideEvents);
}, 2000);
```

---

## Common Issues & Solutions

### Issue: "ไม่พบข้อมูล" (No Data Found)

**This appears when:**
- API call fails
- No cache available
- Network timeout

**Solution:**
1. Check network connection
2. Click refresh button
3. If persists, try different location
4. Check browser console for API errors

---

### Issue: "ข้อมูลจากแคช" Shows All the Time

**This appears when:**
- Network always offline
- API key invalid
- Server unreachable

**Quick Fixes:**
1. Verify network connection: Open new tab, visit example.com
2. Check API key in server logs
3. Verify OPENWEATHER_API_KEY env var set
4. Check browser network tab for API failures

---

### Issue: Mobile Pier Card Text Overflows

**Symptoms:**
- Pier name or distance cut off on mobile
- Table scrolls but card doesn't

**Solution:**
- Card is responsive (stacks vertically on small screens)
- If still overflowing, check zoom level
- Zoom to 100% in browser (Ctrl+0 or Cmd+0)

---

### Issue: Dark Mode Colors Look Wrong

**Symptoms:**
- Text invisible or very hard to read
- Colors don't match design

**Solution:**
1. Check dark mode is actually enabled
2. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Clear cache: DevTools > Storage > Clear all
4. Reload page

---

## Development Tips

### Tip 1: Testing Offline Mode

**Method 1: Network Tab**
```
DevTools > Network > Add custom offline profile
→ Select "Offline" from dropdown
→ All network requests fail
→ App uses cache automatically
```

**Method 2: Disable WiFi/Mobile Data**
- Actual offline testing
- Mimics real user experience

---

### Tip 2: Monitoring Cache Performance

**Setup cache monitoring:**
```typescript
// Add to component for debugging
useEffect(() => {
  const interval = setInterval(() => {
    const stats = getCacheStats();
    console.log('Cache stats:', {
      entries: stats.totalEntries,
      size: `${(stats.approximateSize / 1024).toFixed(2)} KB`,
      tideCount: stats.tideEntries,
      weatherCount: stats.weatherEntries,
    });
  }, 10000); // Log every 10 seconds

  return () => clearInterval(interval);
}, []);
```

---

### Tip 3: Testing Distance Calculations

**Quick test script:**
```typescript
import { 
  calculateDistance, 
  findNearestPier, 
  formatDistance 
} from '@/lib/distance-utils';

// Test Bangkok to Phuket
const dist = calculateDistance(
  13.7563, 100.5018,  // Bangkok
  7.8804, 98.3923     // Phuket
);
console.log('Distance:', formatDistance(dist)); // ~857 km

// Find nearest pier to Phuket
const pier = findNearestPier(7.8804, 98.3923);
console.log('Nearest pier:', pier?.name, formatDistance(pier?.distance || 0));
```

---

### Tip 4: Simulating Cache Expiration

**Force cache expiration for testing:**
```typescript
// In browser console
localStorage.setItem('sunmoon_tide_13.7563_100.5018_2024-01-01', 
  JSON.stringify({
    data: { /* tide data */ },
    timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
    version: '1.0.0',
    expiresAt: Date.now() - 1000 // Already expired
  })
);

// Reload page
location.reload();

// Cache should be ignored, fresh data fetched
```

---

### Tip 5: Debugging Cache Keys

**List all cached items:**
```typescript
import { getStorageKey } from '@/lib/offline-storage';

// Generate what the key should be
const expectedKey = getStorageKey(
  'tide',
  13.7563,
  100.5018,
  new Date('2024-01-15')
);
console.log('Expected key:', expectedKey);
// Output: sunmoon_tide_13.7563_100.5018_2024-01-15

// Check if it exists
console.log('Exists:', localStorage.getItem(expectedKey) !== null);
```

---

## Browser DevTools Guide

### Viewing Cache in Chrome/Edge

1. **Open DevTools**: F12
2. Go to: **Application** tab
3. Left sidebar: **Local Storage** > **Your domain**
4. Search for: `sunmoon_`
5. See all cached data

Each entry shows:
- Key: `sunmoon_type_lat_lon_date`
- Value: JSON with data, timestamp, expiry

### Clearing Cache in DevTools

1. **Application** tab
2. **Local Storage** > **Your domain**
3. Right-click entry > **Delete**
4. Or click entry and press **Delete** key

### Monitoring Network Requests

1. **Network** tab
2. Filter by: `XHR` (XMLHttpRequest)
3. Look for:
   - `/api/predict-tide` - Tide data
   - `openweathermap.org` - Weather data
4. Check:
   - Status 200 = Success
   - Status 0 or timeout = Offline/Failed

### Checking Storage Quota

1. **Application** tab
2. **Storage** in left sidebar
3. Shows:
   - Used: ~240 KB (example)
   - Available: Depends on browser
   - Quota: ~50 MB for most browsers

---

## Performance Optimization Tips

### Reduce Cache Size
```typescript
// Load only last 7 days of data
const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
const recentEntries = Object.keys(localStorage)
  .filter(key => {
    const entry = JSON.parse(localStorage.getItem(key) || '{}');
    return entry.timestamp > sevenDaysAgo;
  });
```

### Speed Up Nearest Pier Search
```typescript
// For very large pier database, pre-index by region
const piersByRegion = {};
THAI_PIERS.forEach(pier => {
  if (!piersByRegion[pier.region]) {
    piersByRegion[pier.region] = [];
  }
  piersByRegion[pier.region].push(pier);
});

// Then search only nearby regions first
```

---

## Testing Checklist

Before deploying changes:

- [ ] Test online mode (all features work)
- [ ] Test offline mode (uses cache)
- [ ] Test switching online/offline rapidly
- [ ] Test cache clearing
- [ ] Test multiple locations
- [ ] Test pier card renders for all locations
- [ ] Test tide table shows correct number of events
- [ ] Test dark mode colors correct
- [ ] Test mobile responsiveness
- [ ] Check DevTools for console errors
- [ ] Check DevTools for warnings
- [ ] Verify build completes without errors

---

## Getting Help

### Where to Check
1. **Browser Console**: DevTools > Console
2. **Network Tab**: DevTools > Network
3. **Storage**: DevTools > Application > Local Storage
4. **Code**: Check `enhanced-location-selector.tsx` for logic

### Useful Commands for Debugging

```typescript
// Check if pier found
console.log('Pier:', nearestPierInfo);

// Check cache stats
console.log('Cache:', getCacheStats());

// Manually trigger pier update
import { findNearestPier } from '@/lib/distance-utils';
const pier = findNearestPier(13.7563, 100.5018);
console.log('Manual pier search:', pier);

// Check tide events
console.log('Tide events:', currentTideData.tideEvents);

// Force cache clear
import { clearAllCache } from '@/lib/offline-storage';
clearAllCache();
console.log('Cache cleared');
```

---

## References

- Distance Utils: `lib/distance-utils.ts`
- Offline Storage: `lib/offline-storage.ts`
- Component: `components/enhanced-location-selector.tsx`
- Full Guide: `INTEGRATION_COMPLETE_OFFLINE_PIER.md`

---

**Last Updated**: 2024
**Version**: 1.0.0