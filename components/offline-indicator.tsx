/**
 * Offline Status Indicator Component
 * 
 * Shows network status and data source information
 * Indicates whether using real-time data or offline cache
 */

'use client'

import React, { useEffect, useState } from 'react'

export interface OfflineIndicatorProps {
  isOnline?: boolean
  dataSource?: 'api' | 'tile' | 'harmonic' | 'offline'
  lastSync?: Date
  syncInProgress?: boolean
  showDetails?: boolean
}

/**
 * Offline indicator component
 */
export function OfflineIndicator({
  isOnline,
  dataSource,
  lastSync,
  syncInProgress,
  showDetails = false,
}: OfflineIndicatorProps) {
  const [online, setOnline] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    // Use provided isOnline prop, fallback to navigator.onLine
    if (isOnline !== undefined) {
      setOnline(isOnline)
    } else if (typeof navigator !== 'undefined') {
      setOnline(navigator.onLine)

      const handleOnline = () => setOnline(true)
      const handleOffline = () => setOnline(false)

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [isOnline])

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getStatusColor = () => {
    if (syncInProgress) return 'text-blue-600 bg-blue-50'
    return online ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'
  }

  const getStatusIcon = () => {
    if (syncInProgress) return '⟳'
    return online ? '✓' : '⚠'
  }

  const getStatusText = () => {
    if (syncInProgress) return 'Syncing...'
    return online ? 'Online' : 'Offline'
  }

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'api':
        return '🔵' // API - real-time
      case 'tile':
        return '📦' // Tile - pre-computed
      case 'harmonic':
        return '📈' // Harmonic - calculated
      case 'offline':
        return '💾' // Offline - cached
      default:
        return '❓'
    }
  }

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case 'api':
        return 'Real-time API'
      case 'tile':
        return 'Tile Data'
      case 'harmonic':
        return 'Harmonic Model'
      case 'offline':
        return 'Offline Cache'
      default:
        return 'Unknown'
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Main status indicator */}
      <div className={`rounded-lg border-2 p-2 ${online ? 'border-green-200' : 'border-orange-200'}`}>
        <div className={`flex items-center justify-between rounded px-3 py-2 ${getStatusColor()}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{getStatusIcon()}</span>
            <span className="font-semibold">{getStatusText()}</span>
          </div>
          <span className="text-xs font-mono text-gray-500">{formatTime(time)}</span>
        </div>
      </div>

      {/* Data source indicator */}
      {dataSource && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getSourceIcon(dataSource)}</span>
            <span className="text-sm font-medium">{getSourceLabel(dataSource)}</span>
          </div>
        </div>
      )}

      {/* Details section */}
      {showDetails && (
        <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600">
          <div>Status: {online ? '✓ Connected' : '⚠ No internet connection'}</div>
          {dataSource && <div>Data Source: {getSourceLabel(dataSource)}</div>}
          {lastSync && (
            <div>Last Sync: {lastSync.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          )}
          {syncInProgress && <div>🔄 Synchronizing with server...</div>}
        </div>
      )}

      {/* Sync indicator animation */}
      {syncInProgress && (
        <div className="flex items-center gap-1 text-xs text-blue-600">
          <span className="inline-block h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          Syncing predictions...
        </div>
      )}
    </div>
  )
}

export default OfflineIndicator
