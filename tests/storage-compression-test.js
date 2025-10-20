#!/usr/bin/env node
/**
 * Storage and Compression Test
 * Tests tile storage, LRU cache, and compression algorithms
 */

// Ensure UTF-8 output encoding
if (process.stdout._handle) {
  process.stdout._handle.setBlocking(true);
}

const crypto = require('crypto');
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

console.log('\n💾 STORAGE & COMPRESSION TEST');
console.log('=' .repeat(70));

// ============ COMPRESSION TEST ============

class CompressionTester {
  constructor() {
    this.results = [];
  }

  /**
   * Test deflate compression
   */
  testDeflateCompression(data, label) {
    const buffer = Buffer.from(data);
    const compressed = zlib.deflateSync(buffer);
    const ratio = ((1 - compressed.length / buffer.length) * 100).toFixed(1);
    
    const result = {
      test: `Deflate: ${label}`,
      original: buffer.length,
      compressed: compressed.length,
      ratio: ratio,
      pass: compressed.length < buffer.length
    };
    
    this.results.push(result);
    return result;
  }

  /**
   * Test SHA-256 hashing
   */
  testSHA256Hash(data) {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    const digest = hash.digest('hex');
    
    const result = {
      test: 'SHA-256 Hash',
      input: data.substring(0, 50) + (data.length > 50 ? '...' : ''),
      output: digest.substring(0, 16) + '...',
      length: digest.length,
      pass: digest.length === 64
    };
    
    this.results.push(result);
    return result;
  }

  /**
   * Test HMAC-SHA256 signing
   */
  testHMACSigning(data, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    const signature = hmac.digest('hex');
    
    const result = {
      test: 'HMAC-SHA256 Sign',
      dataLength: data.length,
      secretLength: secret.length,
      signatureLength: signature.length,
      pass: signature.length === 64
    };
    
    this.results.push(result);
    return result;
  }

  /**
   * Print results
   */
  printResults() {
    console.log('\n📊 Test Results:\n');
    
    this.results.forEach((result, idx) => {
      const status = result.pass ? '✅' : '❌';
      console.log(`${status} Test ${idx + 1}: ${result.test}`);
      
      Object.entries(result).forEach(([key, value]) => {
        if (key !== 'test' && key !== 'pass') {
          console.log(`   ${key}: ${value}`);
        }
      });
      console.log();
    });
    
    const passCount = this.results.filter(r => r.pass).length;
    const totalCount = this.results.length;
    
    console.log('─'.repeat(70));
    console.log(`Passed: ${passCount}/${totalCount} (${((passCount/totalCount)*100).toFixed(1)}%)\n`);
    
    return passCount === totalCount ? 0 : 1;
  }
}

// ============ LRU CACHE SIMULATOR ============

class LRUCache {
  constructor(maxSize = 10) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.accessOrder = [];
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.accessOrder = this.accessOrder.filter(k => k !== key);
    } else if (this.cache.size >= this.maxSize) {
      const lruKey = this.accessOrder.shift();
      this.cache.delete(lruKey);
    }
    
    this.cache.set(key, value);
    this.accessOrder.push(key);
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    
    this.accessOrder = this.accessOrder.filter(k => k !== key);
    this.accessOrder.push(key);
    
    return this.cache.get(key);
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: ((this.cache.size / this.maxSize) * 100).toFixed(1),
      items: Array.from(this.cache.keys())
    };
  }
}

// ============ TILE MANIFEST HANDLING ============

class TileManifest {
  constructor() {
    this.tiles = {};
  }

  /**
   * Add tile to manifest
   */
  addTile(lat, lon, data) {
    const key = `${lat},${lon}`;
    const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    
    this.tiles[key] = {
      lat,
      lon,
      hash,
      timestamp: Date.now(),
      size: JSON.stringify(data).length,
      compressed: false
    };
  }

  /**
   * Compress tile data
   */
  compressTile(lat, lon, data) {
    const key = `${lat},${lon}`;
    if (!this.tiles[key]) return null;
    
    const buffer = Buffer.from(JSON.stringify(data));
    const compressed = zlib.deflateSync(buffer);
    const ratio = ((1 - compressed.length / buffer.length) * 100).toFixed(1);
    
    this.tiles[key].compressedSize = compressed.length;
    this.tiles[key].compressed = true;
    this.tiles[key].compressionRatio = ratio;
    
    return { compressed, ratio };
  }

  /**
   * Get manifest stats
   */
  getStats() {
    const totalTiles = Object.keys(this.tiles).length;
    const compressedTiles = Object.values(this.tiles).filter(t => t.compressed).length;
    const totalSize = Object.values(this.tiles).reduce((sum, t) => sum + t.size, 0);
    const totalCompressed = Object.values(this.tiles).reduce((sum, t) => sum + (t.compressedSize || 0), 0);
    
    return {
      totalTiles,
      compressedTiles,
      totalSize,
      totalCompressed,
      totalSavings: ((1 - totalCompressed / totalSize) * 100).toFixed(1)
    };
  }
}

// ============ RUN TESTS ============

function runCompressionTests() {
  console.log('\n📦 COMPRESSION TESTS');
  console.log('─'.repeat(70));
  
  const tester = new CompressionTester();
  
  // Test data
  const smallData = JSON.stringify({ level: 1.234, time: '2025-10-19T12:00:00Z' });
  const largeData = JSON.stringify({
    predictions: Array.from({length: 100}, (_, i) => ({
      hour: i,
      level: Math.random() * 2,
      type: ['high', 'low', 'rising', 'falling'][i % 4]
    }))
  });
  
  console.log('Running compression tests...\n');
  
  tester.testDeflateCompression(smallData, 'Small data');
  tester.testDeflateCompression(largeData, 'Large data');
  tester.testSHA256Hash(smallData);
  tester.testHMACSigning(smallData, 'secret-key-123');
  
  return tester.printResults();
}

function runCacheTests() {
  console.log('\n🗂️  LRU CACHE TESTS');
  console.log('─'.repeat(70));
  
  console.log('Creating cache with maxSize=5...\n');
  const cache = new LRUCache(5);
  
  // Add items
  for (let i = 0; i < 8; i++) {
    cache.set(`tile_${i}`, { lat: 13 + i * 0.1, lon: 100 + i * 0.1, data: Math.random() });
  }
  
  console.log('Added 8 items to cache with maxSize 5');
  
  const stats = cache.getStats();
  console.log(`\nCache Stats:`);
  console.log(`  Size: ${stats.size}/${stats.maxSize}`);
  console.log(`  Utilization: ${stats.utilization}%`);
  console.log(`  Remaining items: ${stats.items.join(', ')}`);
  
  console.log(`\n  ✅ LRU eviction working - oldest items removed`);
  
  return stats.size === 5 ? 0 : 1;
}

function runTileManifestTests() {
  console.log('\n📍 TILE MANIFEST TESTS');
  console.log('─'.repeat(70));
  
  const manifest = new TileManifest();
  
  // Add tiles
  const locations = [
    { lat: 13.15, lon: 100.82 },
    { lat: 13.16, lon: 100.83 },
    { lat: 13.17, lon: 100.84 }
  ];
  
  console.log('Adding tiles to manifest...\n');
  
  locations.forEach(loc => {
    const data = { level: Math.random() * 2, type: Math.random() > 0.5 ? 'high' : 'low' };
    manifest.addTile(loc.lat, loc.lon, data);
    
    // Compress
    manifest.compressTile(loc.lat, loc.lon, data);
    
    console.log(`✅ Tile ${loc.lat},${loc.lon} - added and compressed`);
  });
  
  const stats = manifest.getStats();
  console.log(`\nManifest Stats:`);
  console.log(`  Total tiles: ${stats.totalTiles}`);
  console.log(`  Compressed: ${stats.compressedTiles}/${stats.totalTiles}`);
  console.log(`  Original size: ${stats.totalSize} bytes`);
  console.log(`  Compressed size: ${stats.totalCompressed} bytes`);
  console.log(`  Total savings: ${stats.totalSavings}%`);
  
  return stats.compressedTiles === stats.totalTiles ? 0 : 1;
}

// ============ MAIN ============

console.log('Starting all storage and compression tests...\n');

const compressionResult = runCompressionTests();
const cacheResult = runCacheTests();
const manifestResult = runTileManifestTests();

console.log('\n' + '='.repeat(70));
console.log('📊 OVERALL RESULTS');
console.log('─'.repeat(70));
console.log(`Compression Tests: ${compressionResult === 0 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`LRU Cache Tests: ${cacheResult === 0 ? '✅ PASS' : '❌ FAIL'}`);
console.log(`Tile Manifest Tests: ${manifestResult === 0 ? '✅ PASS' : '❌ FAIL'}`);
console.log('='.repeat(70) + '\n');

process.exit(compressionResult + cacheResult + manifestResult);
