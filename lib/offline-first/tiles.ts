import type { TileManifest, TileMeta } from "./types"

export interface Coordinates {
  lat: number
  lon: number
}

export function selectTileForLocation(manifest: TileManifest, { lat, lon }: Coordinates): TileMeta | null {
  if (!manifest.tiles.length) return null

  let bestTile: TileMeta | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (const tile of manifest.tiles) {
    const [minLon, minLat, maxLon, maxLat] = tile.bbox
    const inBounds = lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon

    if (inBounds) {
      return tile
    }

    const distance = haversineDistance(lat, lon, tile.centroid.lat, tile.centroid.lon)
    if (distance < bestDistance) {
      bestDistance = distance
      bestTile = tile
    }
  }

  return bestTile
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const R = 6371 // km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
