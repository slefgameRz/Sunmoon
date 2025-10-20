/**
 * Field Testing Framework
 * 
 * Collects real-world validation data for tide predictions
 * Enables accuracy measurement and model refinement
 */

export interface ValidationMeasurement {
  timestamp: number
  location: {
    lat: number
    lon: number
    name: string
    site: 'site1' | 'site2' | 'site3'
  }
  predicted: {
    level: number
    time: string
    confidence: number
    dataSource: 'api' | 'tile' | 'harmonic' | 'offline'
  }
  actual: {
    level: number
    time: string
    measurementMethod: string
    instrumentAccuracy: number
  }
  error: {
    heightDiff: number // actual - predicted
    timeDiff: number // minutes
  }
  metadata?: {
    weather?: string
    windSpeed?: number
    notes?: string
  }
}

export interface ValidationStats {
  siteId: string
  measurementCount: number
  heightRMSE: number
  timeRMSE: number
  meanBiasError: number
  maxError: number
  accuracy: number // percentage correct within 0.2m
}

/**
 * Field validation manager
 */
class FieldValidationManager {
  private measurements: ValidationMeasurement[] = []
  private sites: Map<
    string,
    {
      name: string
      lat: number
      lon: number
      startDate: Date
      endDate?: Date
    }
  > = new Map([
    [
      'site1',
      {
        name: 'Sichang Island, Chachoengsao',
        lat: 13.15,
        lon: 100.817,
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-12-31'),
      },
    ],
    [
      'site2',
      {
        name: 'Rayong Fishery Port',
        lat: 12.68,
        lon: 101.28,
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-12-31'),
      },
    ],
    [
      'site3',
      {
        name: 'Phangan Island, Surat Thani',
        lat: 8.87,
        lon: 100.4,
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-12-31'),
      },
    ],
  ])

  /**
   * Record a measurement
   */
  recordMeasurement(measurement: ValidationMeasurement): void {
    this.measurements.push(measurement)
  }

  /**
   * Get measurements for a site
   */
  getMeasurementsBySite(siteId: string): ValidationMeasurement[] {
    return this.measurements.filter(m => m.location.site === siteId)
  }

  /**
   * Calculate validation statistics for a site
   */
  calculateSiteStats(siteId: string): ValidationStats {
    const measurements = this.getMeasurementsBySite(siteId)

    if (measurements.length === 0) {
      return {
        siteId,
        measurementCount: 0,
        heightRMSE: 0,
        timeRMSE: 0,
        meanBiasError: 0,
        maxError: 0,
        accuracy: 0,
      }
    }

    // Calculate RMSE for height
    const heightSquaredErrors = measurements.map(m => Math.pow(m.error.heightDiff, 2))
    const heightRMSE = Math.sqrt(
      heightSquaredErrors.reduce((a, b) => a + b, 0) / measurements.length
    )

    // Calculate RMSE for time
    const timeSquaredErrors = measurements.map(m => Math.pow(m.error.timeDiff, 2))
    const timeRMSE = Math.sqrt(timeSquaredErrors.reduce((a, b) => a + b, 0) / measurements.length)

    // Mean bias error (systematic error)
    const meanBiasError = measurements.reduce((sum, m) => sum + m.error.heightDiff, 0) / measurements.length

    // Maximum error
    const maxError = Math.max(...measurements.map(m => Math.abs(m.error.heightDiff)))

    // Accuracy (percentage within 0.2m)
    const accurateCount = measurements.filter(m => Math.abs(m.error.heightDiff) <= 0.2).length
    const accuracy = (accurateCount / measurements.length) * 100

    return {
      siteId,
      measurementCount: measurements.length,
      heightRMSE: Math.round(heightRMSE * 100) / 100,
      timeRMSE: Math.round(timeRMSE * 100) / 100,
      meanBiasError: Math.round(meanBiasError * 100) / 100,
      maxError: Math.round(maxError * 100) / 100,
      accuracy: Math.round(accuracy * 100) / 100,
    }
  }

  /**
   * Get all sites
   */
  getSites() {
    return Array.from(this.sites.values())
  }

  /**
   * Check if measurement is within active period for a site
   */
  isActiveMeasurementPeriod(siteId: string, date: Date): boolean {
    const site = this.sites.get(siteId)
    if (!site) return false

    return date >= site.startDate && (!site.endDate || date <= site.endDate)
  }

  /**
   * Generate validation report
   */
  generateReport(): {
    period: { start: Date; end: Date }
    sites: { [key: string]: ValidationStats }
    overall: {
      totalMeasurements: number
      avgHeightRMSE: number
      avgTimeRMSE: number
      avgAccuracy: number
    }
  } {
    const sites: { [key: string]: ValidationStats } = {}
    let totalMeasurements = 0
    let avgHeightRMSE = 0
    let avgTimeRMSE = 0
    let avgAccuracy = 0

    const siteIds = ['site1', 'site2', 'site3']
    for (const siteId of siteIds) {
      const stats = this.calculateSiteStats(siteId)
      sites[siteId] = stats
      totalMeasurements += stats.measurementCount
      avgHeightRMSE += stats.heightRMSE
      avgTimeRMSE += stats.timeRMSE
      avgAccuracy += stats.accuracy
    }

    const siteCount = siteIds.length
    return {
      period: {
        start: new Date('2025-11-01'),
        end: new Date('2025-12-31'),
      },
      sites,
      overall: {
        totalMeasurements,
        avgHeightRMSE: avgHeightRMSE / siteCount,
        avgTimeRMSE: avgTimeRMSE / siteCount,
        avgAccuracy: avgAccuracy / siteCount,
      },
    }
  }

  /**
   * Export measurements as CSV
   */
  exportAsCSV(): string {
    const headers =
      'Timestamp,Site,Latitude,Longitude,PredictedLevel,ActualLevel,HeightError,TimeError,Confidence,DataSource,Accuracy'
    const rows = this.measurements.map(m => {
      const accuracy = Math.abs(m.error.heightDiff) <= 0.2 ? 'YES' : 'NO'
      return [
        new Date(m.timestamp).toISOString(),
        m.location.site,
        m.location.lat,
        m.location.lon,
        m.predicted.level.toFixed(2),
        m.actual.level.toFixed(2),
        m.error.heightDiff.toFixed(3),
        m.error.timeDiff,
        m.predicted.confidence,
        m.predicted.dataSource,
        accuracy,
      ].join(',')
    })

    return [headers, ...rows].join('\n')
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements = []
  }

  /**
   * Get measurement count
   */
  getMeasurementCount(): number {
    return this.measurements.length
  }
}

// Singleton instance
export const fieldValidationManager = new FieldValidationManager()

export default fieldValidationManager
