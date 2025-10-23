"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Map as PigeonMap, Marker } from "pigeon-maps"
import { Loader2, Search, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { LocationData } from "@/lib/tide-service"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

type MapSelectorProps = {
  currentLocation: LocationData
  onSelectLocationAction: (location: LocationData) => void
  onCloseAction: () => void
  isOpen: boolean
}

export default function MapSelectorClean({ currentLocation, onSelectLocationAction, onCloseAction, isOpen }: MapSelectorProps) {
  const [markerPosition, setMarkerPosition] = useState<LocationData>(currentLocation)
  useEffect(() => setMarkerPosition(currentLocation), [currentLocation])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = useCallback(({ latLng }: { latLng: [number, number] }) => {
    const [lat, lon] = latLng
    setMarkerPosition({ lat, lon, name: "ตำแหน่งที่เลือก" })
  }, [])

  const handleSearch = useCallback(async () => {
    if (!query) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=th`)
      const data = await res.json()
      if (data?.length) {
        const p = data[0]
        setMarkerPosition({ lat: Number(p.lat), lon: Number(p.lon), name: p.display_name })
      } else setError("ไม่พบสถานที่")
    } catch (error) {
      console.error("Map search failed", error)
      setError("เกิดข้อผิดพลาด")
    } finally {
      setLoading(false)
    }
  }, [query])

  const center = useMemo(() => [markerPosition.lat, markerPosition.lon] as [number, number], [markerPosition])

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="max-w-3xl p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-2/3 p-3">
            <DialogHeader>
              <DialogTitle>เลือกตำแหน่งจากแผนที่</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">คลิกที่แผนที่เพื่อวางหมุด แล้วกดยืนยัน</DialogDescription>
            </DialogHeader>
            <div className="h-72 rounded-md overflow-hidden border">
              <PigeonMap center={center} zoom={9} onClick={handleClick} attributionPrefix={false} dprs={[1,2]} boxClassname="w-full h-full">
                <Marker anchor={center} />
              </PigeonMap>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">{markerPosition.name}</div>
                <div className="text-xs text-muted-foreground">{markerPosition.lat.toFixed(4)}, {markerPosition.lon.toFixed(4)}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={onCloseAction}>ยกเลิก</Button>
                <Button onClick={() => { onSelectLocationAction(markerPosition); onCloseAction() }}>ยืนยันตำแหน่ง</Button>
              </div>
            </div>
          </div>
          <aside className="sm:w-1/3 p-3 bg-gray-50">
            <Input placeholder="ค้นหาสถานที่" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            <div className="mt-2 flex gap-2">
              <Button onClick={handleSearch} className="flex-1">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
              <Button variant="outline" onClick={() => { setMarkerPosition(currentLocation); setQuery('') }}>Reset</Button>
            </div>
            {error && <div className="text-sm text-red-500 mt-2"><AlertCircle className="inline-block mr-2" />{error}</div>}
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}
