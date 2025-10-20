import { tileStorage, type TileData } from "@/lib/tile-storage"
import type { TilePackage } from "@/lib/tile-packaging"
import type { TileMeta } from "./types"

const DB_NAME = "seapalo-offline-meta"
const DB_VERSION = 1
const MANIFEST_STORE = "manifests"

type ManifestRecord = {
  version: string
  issuedAt: string
}

function hasIndexedDB(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window
}

async function openDatabase(): Promise<IDBDatabase | null> {
  if (!hasIndexedDB()) return null

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(MANIFEST_STORE)) {
        db.createObjectStore(MANIFEST_STORE, { keyPath: "version" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withManifestStore<T>(
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore) => Promise<T>,
): Promise<T | null> {
  const db = await openDatabase()
  if (!db) return null

  return new Promise<T | null>((resolve, reject) => {
    const transaction = db.transaction(MANIFEST_STORE, mode)
    const store = transaction.objectStore(MANIFEST_STORE)

    let resultHolder: T | null = null

    handler(store)
      .then((result) => {
        resultHolder = result
      })
      .catch((error) => reject(error))

    transaction.oncomplete = () => resolve(resultHolder)
    transaction.onerror = () => reject(transaction.error)
  })
}

export async function storeTilePackage(pkg: TilePackage): Promise<void> {
  await tileStorage.savePackage(pkg)
}

export async function storeBase64Tile(tile: TileData, payloadBase64: string): Promise<void> {
  await tileStorage.saveBase64Tile(tile, payloadBase64)
}

export async function loadTilePackage(tileId: string): Promise<TilePackage | null> {
  const record = await tileStorage.getTilePackage(tileId)
  if (!record) return null
  return {
    tile: record.metadata,
    payload: record.payload,
  }
}

export async function listCachedTiles(): Promise<TileMeta[]> {
  const tiles = await tileStorage.getAllTiles()
  return tiles.map(convertToTileMeta)
}

export async function removeCachedTile(tileId: string): Promise<void> {
  await tileStorage.deleteTile(tileId)
}

function convertToTileMeta(tile: TileData): TileMeta {
  return {
    tileId: tile.tileId,
    model: tile.model,
    datum: tile.datum,
    bbox: tile.bbox,
    centroid: { lat: tile.centroid[1], lon: tile.centroid[0] },
    tzHint: "UTC",
    updatedAt: new Date(tile.downloadedAt).toISOString(),
    version: tile.version,
    checksum: tile.checksum,
    sizeCompressed: tile.compressedSize,
  }
}

export async function storeManifestMetadata(version: string, issuedAt: string): Promise<void> {
  const record: ManifestRecord = { version, issuedAt }
  await withManifestStore("readwrite", async (store) => {
    return new Promise<void>((resolve, reject) => {
      const request = store.put(record)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  })
}

export async function getLatestManifest(): Promise<ManifestRecord | null> {
  const result = await withManifestStore<ManifestRecord[]>("readonly", async (store) => {
    return new Promise<ManifestRecord[]>((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result as ManifestRecord[])
      request.onerror = () => reject(request.error)
    })
  })

  if (!result || result.length === 0) return null

  return result.sort((a, b) => (a.issuedAt > b.issuedAt ? -1 : 1))[0]
}
