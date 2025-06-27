"use client"

import { useState, useCallback, useMemo } from "react"
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api"
import { Loader2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { LocationData } from "@/lib/tide-service" // Assuming LocationData type is available
import { AlertCircle } from "lucide-react" // Import AlertCircle

type MapSelectorProps = {
  currentLocation: LocationData
  onSelectLocation: (location: LocationData) => void
  onClose: () => void // Callback to close the dialog
}

const libraries: ("places" | "drawing" | "geometry" | "localContext" | "visualization")[] = ["places"]

export default function MapSelector({ currentLocation, onSelectLocation, onClose }: MapSelectorProps) {
  const [markerPosition, setMarkerPosition] = useState<LocationData>(currentLocation)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResult, setSearchResult] = useState<LocationData | null>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
    language: "th", // Set map language to Thai
    region: "TH", // Set map region to Thailand
  })

  const mapContainerStyle = useMemo(
    () => ({
      width: "100%",
      height: "400px",
      borderRadius: "0.5rem",
    }),
    [],
  )

  const center = useMemo(
    () => ({
      lat: markerPosition.lat,
      lng: markerPosition.lon,
    }),
    [markerPosition],
  )

  const onMapClick = useCallback((e: any) => {
    // Declare google type
    if (e.latLng) {
      setMarkerPosition({
        lat: e.latLng.lat(),
        lon: e.latLng.lng(),
        name: "ตำแหน่งที่เลือก", // Default name, can be reverse geocoded later
      })
      setSearchResult(null) // Clear search result when map is clicked
    }
  }, [])

  const onMarkerDragEnd = useCallback((e: any) => {
    // Declare google type
    if (e.latLng) {
      setMarkerPosition({
        lat: e.latLng.lat(),
        lon: e.latLng.lng(),
        name: "ตำแหน่งที่เลือก (ลาก)",
      })
      setSearchResult(null)
    }
  }, [])

  const handleSearch = useCallback(async () => {
    if (!searchQuery || !isLoaded) return

    const geocoder = new window.google.maps.Geocoder() // Use window.google
    geocoder.geocode({ address: searchQuery, componentRestrictions: { country: "TH" } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const { lat, lng } = results[0].geometry.location
        const newLocation: LocationData = {
          lat: lat(),
          lon: lng(),
          name: results[0].formatted_address || searchQuery,
        }
        setMarkerPosition(newLocation)
        setSearchResult(newLocation)
      } else {
        console.error("Geocode was not successful for the following reason:", status)
        setSearchResult(null)
        alert("ไม่พบตำแหน่งที่ค้นหา")
      }
    })
  }, [searchQuery, isLoaded])

  const handleConfirmSelection = useCallback(() => {
    onSelectLocation(markerPosition)
    onClose()
  }, [markerPosition, onSelectLocation, onClose])

  if (loadError) {
    return (
      <div className="text-center p-4 text-red-500 dark:text-red-400">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>เกิดข้อผิดพลาดในการโหลดแผนที่: {loadError.message}</p>
        <p className="text-sm mt-2">โปรดตรวจสอบ Google Maps API Key ของคุณ</p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4 dark:text-blue-400" />
        <span className="text-lg text-slate-600 dark:text-gray-300">กำลังโหลดแผนที่...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="ค้นหาสถานที่ (เช่น กรุงเทพฯ, ภูเก็ต)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch()
            }
          }}
          className="flex-grow dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        <Button onClick={handleSearch} className="dark:bg-blue-600 dark:hover:bg-blue-700">
          ค้นหา
        </Button>
      </div>

      {searchResult && (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          พบ: <span className="font-semibold">{searchResult.name}</span> ({searchResult.lat.toFixed(4)},{" "}
          {searchResult.lon.toFixed(4)})
        </div>
      )}

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={10}
        onClick={onMapClick}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        <Marker
          position={{ lat: markerPosition.lat, lng: markerPosition.lon }}
          draggable={true}
          onDragEnd={onMarkerDragEnd}
          icon={{
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png", // Default red marker
            scaledSize: new window.google.maps.Size(32, 32), // Use window.google
          }}
        />
      </GoogleMap>

      <div className="text-center text-sm text-gray-700 dark:text-gray-300">
        <MapPin className="inline-block h-4 w-4 mr-1" />
        ตำแหน่งที่เลือก:{" "}
        <span className="font-semibold">
          {markerPosition.name} ({markerPosition.lat.toFixed(4)}, {markerPosition.lon.toFixed(4)})
        </span>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="secondary"
          onClick={onClose}
          className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
        >
          ยกเลิก
        </Button>
        <Button onClick={handleConfirmSelection} className="dark:bg-blue-600 dark:hover:bg-blue-700">
          ยืนยันตำแหน่งนี้
        </Button>
      </div>
    </div>
  )
}
