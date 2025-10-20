# Offline Tile Workflow Overview

## Packaging (build-time)
1. Select target location/bounds (tile id, bbox, centroid).
2. Gather constituents array (harmonic amplitudes/phases, optional speed).
3. Call `createTilePackage(...)` → returns `{ tile, payload }`:
   - `tile`: metadata (`TileData`), sizes, checksum.
   - `payload`: compressed Uint8Array (deflate via pako).
4. Collect packages → feed `createTileManifest` (optional HMAC signature).
5. Publish manifest + payloads to CDN.

## Download & Cache (runtime)
1. Fetch manifest JSON → `loadManifest` (signature check + store metadata).
2. Determine tile for user location (spatial lookup).
3. Fetch tile payload (base64 or binary).
4. Decode to Uint8Array (or call `tileStorage.saveBase64Tile(...)`) and persist metadata → `saveTilePackage`.
5. Cache metadata/payload in IndexedDB (`lib/tile-storage.ts`).

## Prediction Usage
1. Offline module requests tile via `loadTilePackage(tileId)`.
2. Decompress payload → `TilePayload`.
3. Feed into JS harmonic fallback or WASM engine.

## Delta Updates (future extension)
1. Compute diff between two packages using `createDeltaPatch`.
2. Ship patch (with compressed payload for safety).
3. Apply via `applyDeltaPatch`, re-run checksum validation.
