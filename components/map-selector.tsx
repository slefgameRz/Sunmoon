"use client"

import { useState, useCallback, useMemo } from "react"
import { Map as PigeonMap, Marker } from "pigeon-maps"
import { Loader2, MapPin, Search, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { LocationData } from "@/lib/tide-service"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type MapSelectorProps = {
  currentLocation: LocationData
  onSelectLocation: (location: LocationData) => void
  onClose: () => void
  isOpen: boolean
}

export default function MapSelector({ currentLocation, onSelectLocation, onClose, isOpen }: MapSelectorProps) {
  const [markerPosition, setMarkerPosition] = useState<LocationData>(currentLocation)
  const [searchQuery, setSearchQuery] = useState("")
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  const handleMapClick = useCallback(({ latLng }: { latLng: [number, number] }) => {
    const [lat, lon] = latLng
    setMarkerPosition({ lat, lon, name: "ตำแหน่งที่เลือก" })
    setSearchError(null)
  }, [])

  const handleSearch = useCallback(async () => {
    if (!searchQuery) return
    setLoadingSearch(true)
    setSearchError(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery,
        )}&format=json&limit=1&countrycodes=th`,
      )
      const data = await res.json()
      if (data?.length) {
        const place = data[0]
        setMarkerPosition({
          lat: Number(place.lat),
          lon: Number(place.lon),
          name: place.display_name,
        })
      } else {
        setSearchError("ไม่พบตำแหน่งที่ค้นหา")
      }
    } catch (e) {
      console.error(e)
      setSearchError("เกิดข้อผิดพลาดในการค้นหา")
    } finally {
      setLoadingSearch(false)
    }
  }, [searchQuery])

  const mapCenter = useMemo(() => [markerPosition.lat, markerPosition.lon] as [number, number], [markerPosition])

  const confirm = () => {
    onSelectLocation(markerPosition)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] dark:bg-gray-800 dark:text-white">
        <DialogHeader>
          <DialogTitle>เลือกตำแหน่งจากแผนที่</DialogTitle>
          <DialogDescription>ลากหมุดหรือคลิกบนแผนที่เพื่อเลือกตำแหน่ง หรือใช้ช่องค้นหา</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="ค้นหาสถานที่ (เช่น กรุงเทพฯ, ภูเก็ต)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-grow dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            <Button onClick={handleSearch} disabled={loadingSearch} className="dark:bg-blue-600 dark:hover:bg-blue-700">
              {loadingSearch ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {searchError && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" /> {searchError}
            </div>
          )}

          <div className="h-[400px] rounded-md overflow-hidden">
            <PigeonMap
              center={mapCenter}
              zoom={10}
              onClick={handleMapClick}
              attributionPrefix={false}
              dprs={[1, 2]} // hi-dpi tiles
              animate={true}
            >
              <Marker anchor={mapCenter} />
            </PigeonMap>
          </div>

          <p className="text-center text-sm text-gray-700 dark:text-gray-300">
            <MapPin className="inline-block h-4 w-4 mr-1" />
            ตำแหน่งที่เลือก:{" "}
            <span className="font-semibold">
              {markerPosition.name} ({markerPosition.lat.toFixed(4)}, {markerPosition.lon.toFixed(4)})
            </span>
          </p>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose} className="dark:bg-gray-700 dark:text-white">
              ยกเลิก
            </Button>
            <Button onClick={confirm} className="dark:bg-blue-600 dark:hover:bg-blue-700">
              ยืนยันตำแหน่งนี้
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
