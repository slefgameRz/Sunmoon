# Phase 5: Field Testing & Validation (Weeks 13-16)

## Overview

Phase 5 implements the field testing and validation framework. Real-world measurements across 3 Thai coastal sites over 60 days (Nov 1 - Dec 31, 2025) validate model accuracy and build confidence metrics.

## Testing Sites

### Site 1: Sichang Island, Chachoengsao
- **Coordinates**: 13.15°N, 100.817°E
- **Region**: Gulf of Thailand (Upper Gulf)
- **Type**: Semi-enclosed bay
- **Characteristics**: 
  - Higher tidal range (0.5-1.5m)
  - Mixed semi-diurnal/diurnal tides
  - Moderate wave action
  - Reference: Stormglass Ko Sichang station

### Site 2: Rayong Fishery Port
- **Coordinates**: 12.68°N, 101.28°E
- **Region**: Eastern Seaboard
- **Type**: Open coast port
- **Characteristics**:
  - Semi-diurnal dominance
  - Larger tidal range (1.0-2.0m)
  - Higher energy environment
  - Commercial port with consistent measurements

### Site 3: Phangan Island, Surat Thani
- **Coordinates**: 8.87°N, 100.4°E
- **Region**: Andaman Coast
- **Type**: Semi-enclosed bay
- **Characteristics**:
  - Diurnal/semi-diurnal mixed
  - Smaller tidal range (0.2-0.8m)
  - Monsoon influence (Nov-Dec transition)
  - Challenging validation site

## Measurement Protocol

### Data Collection
```
Frequency: Every 30 minutes during daylight (6 AM - 6 PM)
Instrument: Digital tide gauge ±0.01m accuracy
Timing: GPS-synchronized ±1 second
Documentation: Manual logbook + photos
Weather: Wind speed, direction, condition
```

### Validation Procedure
```
1. Measure actual water level
2. Record GPS time and position
3. Compare with predicted level/time
4. Calculate error metrics
5. Document anomalies/notes
```

### Error Metrics
```
Height Error = |Actual - Predicted| (meters)
Time Error = |Actual - Predicted| (minutes)
Accuracy = % of measurements within ±0.2m
RMSE = Root Mean Square Error
Bias = Mean(Actual - Predicted)
```

## Components Created

### ✅ Field Validation Manager (`lib/field-validation.ts`)
- Measurement recording and storage
- Site management (3 sites, 60-day periods)
- Statistics calculation per site
- CSV export for analysis
- Report generation

### ✅ Field Testing Dashboard (`components/field-testing-dashboard.tsx`)
- Overall statistics display
- Per-site accuracy breakdown
- Progress visualization
- Target metrics status
- Interactive component

## Performance Targets

| Metric | Target | Expected |
|--------|--------|----------|
| Height RMSE | ≤0.15m | 0.10-0.12m (based on Phase 1) |
| Time RMSE | ≤15 min | 8-10 min (peak timing) |
| Accuracy | ≥90% | 92-95% (within ±0.2m) |
| Data Coverage | ≥95% | Target: 95% over 60 days |
| Sites Validated | 3 | Gulf, Eastern, Andaman coasts |

## Validation Process Timeline

### Phase 5A: Setup (Weeks 13-14)
- [ ] Install measurement equipment at 3 sites
- [ ] Train measurement staff
- [ ] Establish baseline measurements
- [ ] Validate instrument calibration
- [ ] Setup data logging infrastructure

### Phase 5B: Collection (Weeks 15-20, Continuing)
- [ ] Daily measurements (6 AM - 6 PM)
- [ ] Real-time data upload
- [ ] Quality checks
- [ ] Anomaly documentation
- [ ] Weather correlation

### Phase 5C: Analysis (Weeks 17-20)
- [ ] Weekly accuracy reports
- [ ] Model refinement if needed
- [ ] Confidence metric validation
- [ ] Site-specific calibration
- [ ] Data visualization

### Phase 5D: Report (Week 21+)
- [ ] Final accuracy report
- [ ] Recommendations for production
- [ ] Model improvements
- [ ] Confidence score validation

## Data Collection & Management

### CSV Format Export
```csv
Timestamp,Site,Latitude,Longitude,PredictedLevel,ActualLevel,
HeightError,TimeError,Confidence,DataSource,Accuracy
2025-11-01T06:00:00Z,site1,13.15,100.817,1.23,1.25,0.02,2,95,api,YES
2025-11-01T06:30:00Z,site1,13.15,100.817,1.45,1.42,-0.03,3,92,tile,YES
...
```

### Storage
- Backend: Database with hourly sync
- Cloud: AWS S3 for backup
- Local: Browser IndexedDB cache
- Validation: Checksum verification

## Usage Example

### Record Measurement
```typescript
import { fieldValidationManager } from '@/lib/field-validation'

const measurement: ValidationMeasurement = {
  timestamp: Date.now(),
  location: {
    lat: 13.15,
    lon: 100.817,
    name: 'Sichang Island',
    site: 'site1',
  },
  predicted: {
    level: 1.23,
    time: '06:15',
    confidence: 95,
    dataSource: 'api',
  },
  actual: {
    level: 1.25,
    time: '06:17',
    measurementMethod: 'digital_gauge',
    instrumentAccuracy: 0.01,
  },
  error: {
    heightDiff: 0.02,
    timeDiff: 2,
  },
}

fieldValidationManager.recordMeasurement(measurement)
```

### Generate Report
```typescript
const report = fieldValidationManager.generateReport()
console.log(report)
// {
//   period: { start: 2025-11-01, end: 2025-12-31 },
//   sites: {
//     site1: { measurementCount: 1800, heightRMSE: 0.12, ... },
//     site2: { measurementCount: 1795, heightRMSE: 0.14, ... },
//     site3: { measurementCount: 1760, heightRMSE: 0.18, ... },
//   },
//   overall: { avgAccuracy: 93.2, ... }
// }
```

### Display Dashboard
```typescript
import { FieldTestingDashboard } from '@/components/field-testing-dashboard'

export function ValidationPage() {
  return (
    <FieldTestingDashboard
      totalMeasurements={5355}
      avgHeightRMSE={0.1467}
      avgTimeRMSE={9.2}
      avgAccuracy={93.2}
      siteStats={[
        { siteId: 'site1', siteName: 'Sichang Island', measurementCount: 1800, heightRMSE: 0.12, accuracy: 94.5 },
        { siteId: 'site2', siteName: 'Rayong Port', measurementCount: 1795, heightRMSE: 0.14, accuracy: 93.8 },
        { siteId: 'site3', siteName: 'Phangan Island', measurementCount: 1760, heightRMSE: 0.18, accuracy: 91.2 },
      ]}
    />
  )
}
```

## Success Criteria

✅ Field testing infrastructure ready  
⏳ Measurements collected daily across 3 sites  
⏳ Accuracy targets met (>90% within ±0.2m)  
⏳ Height RMSE <0.15m validated  
⏳ Confidence scoring validated  
⏳ Model improvements identified  

## Known Challenges

1. **Monsoon Effect**: Nov-Dec transition period may cause anomalies
2. **Coastal Processes**: Weather/swell can affect local tides
3. **Instrument Drift**: Gauge calibration needs periodic checks
4. **Data Gaps**: Network issues may cause missing measurements
5. **Staff Availability**: Consistent daily measurements challenging

## Risk Mitigation

- Backup instruments at each site
- Redundant internet connections
- Automated backup measurement systems
- Weather margin adjustments
- Regular calibration checks

## Files Created (Phase 5)

```
✅ lib/field-validation.ts               (200 lines)
✅ components/field-testing-dashboard.tsx (180 lines)
────────────────────────────────────────────────
   TOTAL: 380 lines
```

## Next Steps (Phase 6)

- Security & compliance review
- User authentication system
- Signed manifest for PWA
- Data privacy compliance (PDPA)
- Rate limiting & API security

---

**Status**: Phase 5 field testing framework complete. Ready for deployment.

**Deployment Timeline**: November 1, 2025 (60-day measurement period)

**Expected Output**: Production-ready model with validated accuracy metrics.
