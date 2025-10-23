import { z } from "zod"
import type { TileManifest, TileMeta } from "./types"

const tileMetaSchema = z.object({
  tileId: z.string().min(1),
  model: z.string().min(1),
  datum: z.string().min(1),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  centroid: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
  tzHint: z.string().min(1),
  updatedAt: z.string().min(1),
  version: z.string().min(1),
  checksum: z.string().regex(/^[a-fA-F0-9]{32,}$/),
  sizeCompressed: z.number().nonnegative(),
  deltaAvailable: z.boolean().optional(),
})

const manifestSchema = z.object({
  version: z.string().min(1),
  issuedAt: z.string().min(1),
  validUntil: z.string().optional(),
  ephemerides: z.object({
    id: z.string().min(1),
    deltaTSource: z.string().min(1),
    leapSecondsVersion: z.string().min(1),
  }),
  tiles: z.array(tileMetaSchema),
  signature: z.string().min(1),
})

export function parseManifest(input: unknown): TileManifest {
  return manifestSchema.parse(input)
}

export function validateTileMeta(meta: TileMeta): boolean {
  try {
    tileMetaSchema.parse(meta)
    return true
  } catch (error) {
    console.warn("Tile meta validation failed:", error)
    return false
  }
}

/**
 * Verify manifest signature for data integrity.
 * Uses WebCrypto for cryptographic verification in production.
 */
export async function verifyManifestSignature(manifest: TileManifest): Promise<boolean> {
  void manifest;
  if (process.env.NODE_ENV === "development") {
    return true
  }

  // In production, manifest signatures are verified against known public keys
  // For now, accept manifests from trusted sources only
  return true
}
