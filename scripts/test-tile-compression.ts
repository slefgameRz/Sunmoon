/**
 * Test tile packaging and compression
 * Verify target: ≤500KB per tile
 */

import { createTilePackage } from '../lib/tile-packaging'
import { getLocationConstituents } from '../lib/harmonic-prediction'

async function testTileCompression() {
  console.log('๐Ÿ"ฆ Testing Tile Packaging & Compression\n')
  console.log('Target: ≤500KB per tile')
  console.log('=' + '='.repeat(60) + '\n')
  
  // Test locations in Thailand
  const locations = [
    { lat: 13.7563, lon: 100.5018, name: 'Bangkok' },
    { lat: 7.8804, lon: 98.3923, name: 'Phuket' },
    { lat: 13.1611, lon: 100.9198, name: 'Ko Sichang' }
  ]
  
  for (const location of locations) {
    console.log(`Testing: ${location.name} (${location.lat}, ${location.lon})`)
    
    // Get constituents
    const constituents = getLocationConstituents(location)
    console.log(`  Constituents: ${constituents.length}`)
    
    // Create tile ID
    const tileId = `tile_${location.lat}_${location.lon}`
    const bbox: [number, number, number, number] = [
      location.lon - 0.25,
      location.lat - 0.25,
      location.lon + 0.25,
      location.lat + 0.25
    ]
    const centroid: [number, number] = [location.lon, location.lat]
    
    // Convert constituents
    const constituentData = constituents.map(c => ({
      name: c.name,
      amplitude: c.amplitude,
      phase: c.phase,
      speedDegHr: c.speed,
    }))
    
    // Create tile package
    const start = performance.now()
    const pkg = await createTilePackage(
      tileId,
      bbox,
      centroid,
      constituentData,
      { model: 'Harmonic37', datum: 'MSL', version: '1.0.0' }
    )
    const duration = performance.now() - start
    
    // Check sizes
    const originalKB = (pkg.tile.originalSize / 1024).toFixed(2)
    const compressedKB = (pkg.tile.compressedSize / 1024).toFixed(2)
    const ratio = ((1 - pkg.tile.compressedSize / pkg.tile.originalSize) * 100).toFixed(1)
    
    console.log(`  Original: ${originalKB} KB`)
    console.log(`  Compressed: ${compressedKB} KB`)
    console.log(`  Compression: ${ratio}%`)
    console.log(`  Time: ${duration.toFixed(2)}ms`)
    console.log(`  Checksum: ${pkg.tile.checksum.substring(0, 16)}...`)
    
    // Check target
    const targetKB = 500
    if (pkg.tile.compressedSize / 1024 <= targetKB) {
      console.log(`  โœ… Within target (≤${targetKB}KB)`)
    } else {
      const excess = (pkg.tile.compressedSize / 1024 - targetKB).toFixed(2)
      console.log(`  โŒ Exceeds target by ${excess}KB`)
    }
    
    console.log('')
  }
  
  // Summary
  console.log('=' + '='.repeat(60))
  console.log('\n๐Ÿ"Š Summary:')
  console.log('- Compression algorithm: deflate (fallback: dictionary encoding)')
  console.log('- Browser support: Chrome 80+, Firefox 80+, Safari 16.4+')
  console.log('- Target met: Check individual results above')
  console.log('\nNext steps:')
  console.log('1. Monitor tile sizes in production')
  console.log('2. Consider additional optimization if needed')
  console.log('3. Implement delta updates for incremental downloads')
}

// Run test
testTileCompression().catch(console.error)
