# 🚀 Quick Start: Offline & Compression Features

## Enable Offline Support in Your Component

### Option 1: Automatic (Recommended)
Just use the app normally - offline/compression is automatic!

```tsx
import EnhancedLocationSelector from "@/components/enhanced-location-selector"

export default function Page() {
  return <EnhancedLocationSelector />  // Offline support included
}
```

### Option 2: Manual Control

```tsx
'use client'

import { useEffect, useState } from 'react'
import { getOfflineManager } from '@/lib/offline-manager'

export default function MyComponent() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const manager = getOfflineManager()
    
    // Check status
    console.log('Online:', manager.isOnline())
    
    // Save data
    async function saveData() {
      const location = { lat: 13.7563, lon: 100.5018, name: "Bangkok" }
      const tideData = { /* ... */ }
      
      await manager.saveTideData(location, tideData)
      console.log('✅ Data cached and compressed')
    }
    
    // Load data
    async function loadData() {
      const location = { lat: 13.7563, lon: 100.5018, name: "Bangkok" }
      const data = await manager.loadTideData(location)
      console.log('📦 Loaded from cache:', data)
    }
    
    saveData()
    loadData()
  }, [])

  return <div>Check console for offline features</div>
}
```

---

## Test Offline Mode

### Method 1: Chrome DevTools
1. Open DevTools (`F12`)
2. Go to **Application** tab
3. Click **Service Workers** (left panel)
4. Check the **Offline** checkbox
5. Reload page
6. App works without network! ✅

### Method 2: Firefox DevTools
1. Open DevTools (`F12`)
2. Go to **Storage** tab
3. Check **IndexedDB** for cached data
4. Disconnect network (⚙️ Network settings)
5. Reload page
6. App still works! ✅

### Method 3: Browser Network Throttling
1. Open DevTools (`F12`)
2. Go to **Network** tab
3. Set throttling to **Offline**
4. Reload page
5. App loads from cache instantly! ✅

---

## Monitor Offline Features

### Check Storage Usage

```typescript
import { getOfflineManager } from '@/lib/offline-manager'

const manager = getOfflineManager()

// Get storage estimate
const { usage, quota } = await manager.getStorageSizeEstimate()
console.log(`Using: ${(usage/1024).toFixed(2)} KB of ${(quota/1024/1024).toFixed(2)} MB`)

// Example output:
// Using: 45.23 KB of 50.00 MB
```

### Check Sync Status

```typescript
const status = manager.getSyncStatus()
console.log(status)
// {
//   isSyncing: false,
//   lastSync: 1730131400000,
//   pendingUpdates: 0,
//   failedUpdates: 0
// }
```

### Monitor Network Status

```typescript
if (manager.isOnline()) {
  console.log('✅ Online - Using fresh data')
} else {
  console.log('📴 Offline - Using cached data')
}

// React to network changes
window.addEventListener('online', () => {
  console.log('🔄 Back online - Syncing data...')
})

window.addEventListener('offline', () => {
  console.log('📴 Offline - Using cache')
})
```

---

## View Cached Data

### IndexedDB (DevTools)
1. DevTools → Application → Storage
2. Click **IndexedDB** (left panel)
3. Expand database
4. View compressed data entries

### LocalStorage (DevTools)
1. DevTools → Application → Storage
2. Click **Local Storage**
3. Select your domain
4. View key-value pairs

### Network Cache (DevTools)
1. DevTools → Application → Storage
2. Click **Cache Storage**
3. View cached API responses

---

## Request Persistent Storage

Allow app data to survive browser data deletion:

```typescript
import { getOfflineManager } from '@/lib/offline-manager'

const manager = getOfflineManager()

// Request permission
const persistent = await manager.requestPersistentStorage()

if (persistent) {
  console.log('✅ Persistent storage granted')
  console.log('📌 Data will survive browser data clear')
} else {
  console.log('⚠️ Persistent storage not available')
  console.log('💾 Data uses temporary storage (cleared with cache)')
}
```

---

## Compression in Action

### Before & After

**Original tide data**:
```
Size: 5 KB
{
  currentWaterLevel: 1.523,
  highTideTime: "14:30",
  lowTideTime: "20:45",
  tideStatus: "น้ำเป็น",
  graphData: [...],
  tideEvents: [...]
}
```

**Compressed**:
```
Size: 1.2 KB (76% reduction!)
{
  v: 1,
  t: 1730131400,
  l: 152,
  h: 870,
  o: 1245,
  H: 180,
  O: 120,
  p: 8,
  s: 0,
  w: 1,
  e: [...],
  g: [...]
}
```

---

## Troubleshooting

### Issue: Service Worker not registering

**Solution**:
```typescript
// Check if SW is supported
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    console.log('Service Workers:', regs)
  })
}
```

**Requirements**:
- ✅ HTTPS enabled (or localhost)
- ✅ `/sw.js` file exists
- ✅ Browser supports Service Workers

### Issue: Offline data not loading

**Solution**:
1. Check IndexedDB has data: DevTools → Storage → IndexedDB
2. Check browser allows 5+ MB: Settings → Privacy
3. Try clearing and re-caching: `await manager.clearCache()`

### Issue: Compression fails

**Solution**:
```typescript
// Check if decompression works
try {
  const data = await manager.loadTideData(location)
  console.log('✅ Data decompressed:', data)
} catch (error) {
  console.error('❌ Decompression failed:', error)
  // Falls back to uncompressed data automatically
}
```

---

## Performance Metrics

### Load Times
- **First Visit**: 3-4 seconds (full download)
- **Subsequent**: 500ms (from cache)
- **Offline**: ~100ms (instant from storage)

### Data Sizes (After Compression)
- Tide data: 1.2 KB (was 5 KB)
- Weather data: 0.4 KB (was 2 KB)
- Graph data: 0.8 KB (was 3 KB)
- **Total**: 2.4 KB per location (was 10 KB)

### Storage Per Location
- 1 day: ~2.5 KB
- 7 days: ~17.5 KB
- 5 locations × 7 days: ~85 KB

---

## Examples

### Example 1: Save & Load Tide Data

```typescript
import { getOfflineManager } from '@/lib/offline-manager'

async function handleTideData() {
  const manager = getOfflineManager()
  const location = { 
    lat: 13.7563, 
    lon: 100.5018, 
    name: "Bangkok"
  }
  
  const tideData = {
    currentWaterLevel: 1.523,
    highTideTime: "14:30",
    lowTideTime: "20:45",
    tideStatus: "น้ำเป็น",
    lunarPhaseKham: 8,
    isWaxingMoon: true,
    graphData: [],
    tideEvents: [],
    apiStatus: "success",
    lastUpdated: new Date().toISOString(),
    // ... other fields
  }
  
  // Save (compressed automatically)
  await manager.saveTideData(location, tideData)
  console.log('✅ Tide data saved and compressed')
  
  // Load (decompressed automatically)
  const loaded = await manager.loadTideData(location)
  if (loaded) {
    console.log('📊 Water level:', loaded.currentWaterLevel)
    console.log('🌊 High tide:', loaded.highTideTime)
  } else {
    console.log('No cached data')
  }
}
```

### Example 2: Offline-First UI

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getOfflineManager } from '@/lib/offline-manager'

export function TideDisplay() {
  const [tideData, setTideData] = useState(null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const manager = getOfflineManager()
    
    async function loadData() {
      const location = { lat: 13.7563, lon: 100.5018, name: "Bangkok" }
      const data = await manager.loadTideData(location)
      setTideData(data)
      setIsOffline(!manager.isOnline())
    }

    loadData()

    // Listen for network changes
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!tideData) return <div>Loading...</div>

  return (
    <div>
      {isOffline && <div className="badge">📴 Offline</div>}
      <h2>Water Level: {tideData.currentWaterLevel}ม.</h2>
      <p>High: {tideData.highTideTime}</p>
      <p>Low: {tideData.lowTideTime}</p>
    </div>
  )
}
```

---

## 📚 Learn More

Full documentation: `OFFLINE_AND_COMPRESSION_GUIDE.md`

Key topics:
- Architecture details
- Compression algorithms
- Storage management
- Testing procedures
- API reference
- Troubleshooting

---

## ✅ Checklist

- [ ] App works offline
- [ ] Service Worker registered
- [ ] Data cached in IndexedDB
- [ ] Compression is working (76%+ reduction)
- [ ] UI shows offline status
- [ ] Storage quota checked
- [ ] Persistent storage enabled (optional)
- [ ] Tested in DevTools offline mode

---

**Ready to go offline!** 🚀
