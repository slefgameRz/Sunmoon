/**
 * Field Testing Dashboard
 * 
 * Displays validation results, accuracy metrics, and site statistics
 */

'use client'

import React, { useMemo } from 'react'

export interface FieldTestingDashboardProps {
  totalMeasurements: number
  avgHeightRMSE: number
  avgTimeRMSE: number
  avgAccuracy: number
  siteStats: Array<{
    siteId: string
    siteName: string
    measurementCount: number
    heightRMSE: number
    accuracy: number
  }>
}

/**
 * Field testing dashboard component
 */
export function FieldTestingDashboard({
  totalMeasurements,
  avgHeightRMSE,
  avgTimeRMSE,
  avgAccuracy,
  siteStats,
}: FieldTestingDashboardProps) {
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-green-600 bg-green-50'
    if (accuracy >= 90) return 'text-blue-600 bg-blue-50'
    if (accuracy >= 85) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getAccuracyBorderColor = (accuracy: number) => {
    if (accuracy >= 95) return 'border-green-200'
    if (accuracy >= 90) return 'border-blue-200'
    if (accuracy >= 85) return 'border-yellow-200'
    return 'border-red-200'
  }

  const getMRSEColor = (rmse: number) => {
    if (rmse <= 0.15) return 'text-green-600 bg-green-50'
    if (rmse <= 0.2) return 'text-blue-600 bg-blue-50'
    if (rmse <= 0.3) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Field Testing Dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">Real-world validation across 3 Thai coastal sites</p>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Measurements */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="text-sm font-medium text-gray-600">Total Measurements</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">{totalMeasurements}</div>
          <div className="mt-1 text-xs text-gray-500">60-day field period</div>
        </div>

        {/* Overall Accuracy */}
        <div className={`rounded-lg border-2 p-4 ${getAccuracyBorderColor(avgAccuracy)}`}>
          <div className="text-sm font-medium text-gray-600">Overall Accuracy</div>
          <div className={`mt-2 text-3xl font-bold ${getAccuracyColor(avgAccuracy).split(' ')[0]}`}>
            {avgAccuracy.toFixed(1)}%
          </div>
          <div className="mt-1 text-xs text-gray-500">Within ±0.2m</div>
        </div>

        {/* Height RMSE */}
        <div className={`rounded-lg border-2 p-4 ${getMRSEColor(avgHeightRMSE).split(' ')[1]}`}>
          <div className="text-sm font-medium text-gray-600">Height RMSE</div>
          <div className={`mt-2 text-3xl font-bold ${getMRSEColor(avgHeightRMSE).split(' ')[0]}`}>
            {avgHeightRMSE.toFixed(2)}m
          </div>
          <div className="mt-1 text-xs text-gray-500">Height error</div>
        </div>

        {/* Time RMSE */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="text-sm font-medium text-gray-600">Time RMSE</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">{avgTimeRMSE.toFixed(0)}</div>
          <div className="mt-1 text-xs text-gray-500">minutes error</div>
        </div>
      </div>

      {/* Site breakdown */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Site Results</h3>
        <div className="space-y-3">
          {siteStats.map((site, idx) => (
            <div key={site.siteId} className={`rounded-lg border-l-4 p-4 ${getAccuracyBorderColor(site.accuracy)}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    Site {idx + 1}: {site.siteName}
                  </div>
                  <div className="mt-1 grid grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>Measurements: {site.measurementCount}</div>
                    <div>Height RMSE: {site.heightRMSE.toFixed(2)}m</div>
                    <div className={`font-medium ${getAccuracyColor(site.accuracy).split(' ')[0]}`}>
                      Accuracy: {site.accuracy.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="ml-4 w-24">
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        site.accuracy >= 95
                          ? 'w-11/12 bg-green-600'
                          : site.accuracy >= 90
                            ? 'w-3/4 bg-blue-600'
                            : site.accuracy >= 85
                              ? 'w-2/3 bg-yellow-600'
                              : 'w-1/2 bg-red-600'
                      }`}
                    />
                  </div>
                  <div className="mt-1 text-center text-xs font-semibold text-gray-600">
                    {site.accuracy.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target metrics */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-900">Target Metrics Status</h3>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Height Accuracy (≤0.15m): </span>
            <span
              className={`font-semibold ${avgHeightRMSE <= 0.15 ? 'text-green-600' : 'text-yellow-600'}`}
            >
              {avgHeightRMSE <= 0.15 ? '✓ Met' : '⚠ Not Met'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Time Accuracy (≤15 min): </span>
            <span className={`font-semibold ${avgTimeRMSE <= 15 ? 'text-green-600' : 'text-yellow-600'}`}>
              {avgTimeRMSE <= 15 ? '✓ Met' : '⚠ Not Met'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Overall Accuracy (≥90%): </span>
            <span className={`font-semibold ${avgAccuracy >= 90 ? 'text-green-600' : 'text-yellow-600'}`}>
              {avgAccuracy >= 90 ? '✓ Met' : '⚠ Not Met'}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-lg border border-gray-200 bg-blue-50 p-4 text-sm text-gray-700">
        <strong>Field Testing Period:</strong> November 1 - December 31, 2025
        <br />
        <strong>Sites:</strong> Sichang Island (Gulf Coast), Rayong Port (Eastern Seaboard), Phangan Island (Andaman)
        <br />
        <strong>Validation Method:</strong> Manual tide gauge measurements + GPS timing
      </div>
    </div>
  )
}

export default FieldTestingDashboard
