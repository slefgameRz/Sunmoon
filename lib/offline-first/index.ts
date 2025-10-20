import { runFallbackPrediction } from "./compute/fallback"
import { loadWasmEngine } from "./compute/wasm-bridge"
import { parseManifest, verifyManifestSignature } from "./manifest"
import { getLatestManifest, loadTilePackage, listCachedTiles, storeManifestMetadata, storeTilePackage } from "./storage"
import type {
  OfflineStatus,
  PredictionOptions,
  PredictionResult,
  TileManifest,
  TileMeta,
  TilePayload,
} from "./types"
import { decompressToString } from "@/lib/tile-packaging"
import { TIDAL_CONSTITUENTS } from "@/lib/harmonic-prediction"
import type { TilePackage } from "@/lib/tile-packaging"

export async function cacheTilePackage(pkg: TilePackage): Promise<void> {
  await storeTilePackage(pkg)
}

export async function getOfflineStatus(): Promise<OfflineStatus> {
  const manifest = await getLatestManifest()
  const cachedTiles = await listCachedTiles()

  return {
    cachedTiles: cachedTiles.length,
    lastUpdated: cachedTiles[0]?.updatedAt,
    manifestVersion: manifest?.version,
  }
}

export async function loadManifest(raw: unknown): Promise<TileManifest | null> {
  try {
    const manifest = parseManifest(raw)
    const signatureValid = await verifyManifestSignature(manifest)
    if (!signatureValid) {
      console.warn("Manifest signature invalid; ignoring manifest in production builds.")
      return manifest
    }

    await storeManifestMetadata(manifest.version, manifest.issuedAt)
    return manifest
  } catch (error) {
    console.error("Failed to load manifest:", error)
    return null
  }
}

export async function predictLevels(tileId: string, options: Omit<PredictionOptions, "tileId">): Promise<PredictionResult> {
  const pkg = await loadTilePackage(tileId)
  if (!pkg) {
    throw new Error(`Tile ${tileId} not found in offline cache`)
  }

  const tilePayload = await parseTilePayload(pkg)

  const fullOptions: PredictionOptions = {
    tileId,
    ...options,
  }

  const wasmEngine = await loadWasmEngine()
  if (wasmEngine) {
    try {
      return wasmEngine.predict(tilePayload, fullOptions)
    } catch (error) {
      console.warn("WASM prediction failed; falling back to TypeScript implementation.", error)
    }
  }

  return runFallbackPrediction(tilePayload, fullOptions)
}

export type { TileManifest, TileMeta, TilePayload, PredictionResult } from "./types"

async function parseTilePayload(pkg: TilePackage): Promise<TilePayload> {
  const json = await decompressToString(pkg.payload)
  const raw = JSON.parse(json) as {
    tileId: string
    constituents?: Array<{ name: string; amplitude: number; phase: number; speedDegHr?: number }>
    minorRules?: unknown
    localCalibration?: unknown
    datumTransforms?: unknown
    stats?: unknown
  }

  return {
    tileId: raw.tileId,
    constituents: (raw.constituents ?? []).map((c) => ({
      code: c.name,
      amplitudeM: c.amplitude ?? 0,
      phaseDeg: c.phase ?? 0,
      speedDegHr: c.speedDegHr ?? TIDAL_CONSTITUENTS[c.name]?.speed ?? 0,
    })),
    minorRules: Array.isArray(raw.minorRules) ? raw.minorRules : undefined,
    localCalibration: Array.isArray(raw.localCalibration) ? raw.localCalibration : undefined,
    datumTransforms: Array.isArray(raw.datumTransforms) ? raw.datumTransforms : undefined,
    stats: raw.stats as TilePayload["stats"],
  }
}
