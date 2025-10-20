"use client"

import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { sunmoonSystem } from "@/lib/sunmoon-system"
import type { SystemStatus } from "@/lib/sunmoon-system"

interface CacheStats {
  tiles: number
  size: number
  oldestTile: Date | null
  newestTile: Date | null
}

export function SystemDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSystemStatus()
    const interval = setInterval(loadSystemStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadSystemStatus() {
    try {
      const currentStatus = sunmoonSystem.getStatus()
      setStatus(currentStatus)

      const stats = await sunmoonSystem.getCacheStats()
      setCacheStats(stats)
    } catch (error) {
      console.error("Failed to load system status", error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleClearCache() {
    if (!confirm("Clear cached tiles? You will need to download them again.")) return
    await sunmoonSystem.clearCache()
    await loadSystemStatus()
    alert("Cache cleared")
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading system status...</div>
        </CardContent>
      </Card>
    )
  }

  if (!status) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-destructive">Unable to load system status</div>
        </CardContent>
      </Card>
    )
  }

  const offlineBadge = status.offline ? (
    <Badge variant="destructive">Offline</Badge>
  ) : (
    <Badge>Online</Badge>
  )

  const engineLabel = status.engine.type === "javascript" ? "JavaScript" : status.engine.type
  const cacheSizeMB = (status.indexedDB.size / 1024 / 1024).toFixed(2)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sunmoon Tide System</CardTitle>
          <CardDescription>Health overview for the offline tide forecaster</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatusRow label="Network" value={offlineBadge} />
          <StatusRow label="Prediction Engine">
            <Badge>{status.engine.optimized ? `${engineLabel} (Optimized)` : engineLabel}</Badge>
          </StatusRow>
          <StatusRow label="Service Worker">
            <Badge variant={status.serviceWorker.active ? "default" : "secondary"}>
              {status.serviceWorker.active ? "Active" : "Inactive"}
            </Badge>
          </StatusRow>
          <StatusRow label="IndexedDB Cache">
            <Badge variant={status.indexedDB.available ? "default" : "destructive"}>
              {status.indexedDB.available ? `${cacheSizeMB} MB` : "Unavailable"}
            </Badge>
          </StatusRow>

          <div className="flex flex-col gap-2 pt-4 border-t">
            <Button onClick={loadSystemStatus} variant="outline" size="sm">
              Refresh Status
            </Button>
            {status.indexedDB.available && (
              <Button onClick={handleClearCache} variant="destructive" size="sm">
                Clear Cached Tiles
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {cacheStats && (
        <Card>
          <CardHeader>
            <CardTitle>Cached Tiles</CardTitle>
            <CardDescription>Offline tiles stored in this device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total tiles</span>
              <span className="font-medium">{cacheStats.tiles}</span>
            </div>
            <div className="flex justify-between">
              <span>Total size</span>
              <span className="font-medium">{(cacheStats.size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            {cacheStats.oldestTile && (
              <div className="flex justify-between">
                <span>Oldest tile</span>
                <span>{cacheStats.oldestTile.toLocaleDateString()}</span>
              </div>
            )}
            {cacheStats.newestTile && (
              <div className="flex justify-between">
                <span>Newest tile</span>
                <span>{cacheStats.newestTile.toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatusRow({ label, value, children }: { label: string; value?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span>{value ?? children}</span>
    </div>
  )
}
