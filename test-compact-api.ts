/**
 * Manual Test: Compact Protocol API
 * 
 * Run this from the terminal:
 * npx ts-node test-compact-api.ts
 */

import { compressForecast, decompressForecast } from './lib/compression/compact-protocol';

// Import types
import type { LocationData, WeatherData, TideData } from "@/lib/tide-service"

// Test data
const location: LocationData = {
  lat: 8.62701,
  lon: 98.39851,
  name: "Phuket"
};

const tideData: TideData = {
  currentHeight: 1.456,
  trend: 'rising'
};

const weatherData: WeatherData = {
  temperature: 28.5,
  windSpeed: 4.2
};

console.log("🧪 TEST: Compact Protocol Compression\n");
console.log("=" .repeat(60));

// Test 1: Compression
console.log("\n📦 Test 1: Compression");
console.log("-".repeat(60));

const originalJson = JSON.stringify({
  location,
  tideData,
  weatherData,
  timestamp: new Date().toISOString()
});
console.log(`Original JSON size: ${originalJson.length} bytes`);
console.log(`Original JSON:\n${originalJson}\n`);

const compressed = compressForecast(location, tideData, weatherData);
console.log(`Compressed size: ${compressed.byteLength} bytes`);
console.log(`Compression ratio: ${((1 - compressed.byteLength / originalJson.length) * 100).toFixed(2)}%`);
console.log(`Binary data (hex): ${Array.from(compressed).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);

// Test 2: Decompression
console.log("\n📦 Test 2: Decompression");
console.log("-".repeat(60));

const decompressed = decompressForecast(compressed);
console.log(`Decompressed successfully!`);
console.log(`Decompressed data:`, JSON.stringify(decompressed, null, 2));

// Test 3: Data Loss Analysis
console.log("\n📊 Test 3: Data Loss Analysis");
console.log("-".repeat(60));

console.log(`Original temperature: ${weatherData.temperature}°C`);
console.log(`Decompressed temperature: ${decompressed.weatherData?.temperature}°C`);
const tempDiff = decompressed.weatherData ? Math.abs(weatherData.temperature - decompressed.weatherData.temperature) : 'N/A';
console.log(`Temperature difference: ${tempDiff}°C`);

console.log(`\nOriginal tide height: ${tideData.currentHeight}m`);
console.log(`Decompressed tide height: ${decompressed.tideData?.currentHeight}m`);
const tideDiff = decompressed.tideData ? Math.abs(tideData.currentHeight - decompressed.tideData.currentHeight) : 'N/A';
console.log(`Tide height difference: ${tideDiff}m`);

console.log(`\nOriginal latitude: ${location.lat}°N`);
console.log(`Decompressed latitude: ${decompressed.location?.lat}°N`);
console.log(`Latitude precision: ±${(0.5 / 256).toFixed(6)}°`);

// Test 4: Performance
console.log("\n⚡ Test 4: Performance");
console.log("-".repeat(60));

const iterations = 10000;

console.time("Compression x10000");
for (let i = 0; i < iterations; i++) {
  compressForecast(mockForecast);
}
console.timeEnd("Compression x10000");

console.time("Decompression x10000");
for (let i = 0; i < iterations; i++) {
  decompressForecast(compressed);
}
console.timeEnd("Decompression x10000");

// Test 5: Multiple Locations (Batch)
console.log("\n📦 Test 5: Batch Compression (3 locations)");
console.log("-".repeat(60));

const locations = [
  { lat: 8.62701, lon: 98.39851, name: "Phuket" },
  { lat: 6.8495, lon: 101.9674, name: "Rayong" },
  { lat: 12.57611, lon: 99.9869, name: "Hua Hin" }
];

let totalOriginal = 0;
let totalCompressed = 0;

locations.forEach((loc, i) => {
  const forecast = { ...mockForecast, location: loc };
  const original = JSON.stringify(forecast);
  const compressed = compressForecast(forecast);
  
  totalOriginal += original.length;
  totalCompressed += compressed.byteLength;
  
  console.log(`${i + 1}. ${loc.name}: ${original.length}B → ${compressed.byteLength}B (${((1 - compressed.byteLength / original.length) * 100).toFixed(1)}%)`);
});

console.log(`\nTotal: ${totalOriginal}B → ${totalCompressed}B (${((1 - totalCompressed / totalOriginal) * 100).toFixed(1)}% compression)`);
console.log(`Data saved: ${totalOriginal - totalCompressed}B`);

// Test 6: Network Simulation
console.log("\n🌐 Test 6: Network Transfer Simulation");
console.log("-".repeat(60));

const networkSpeeds = {
  "4G LTE (1 Mbps)": 1_000_000,
  "4G LTE (500 kbps)": 500_000,
  "4G LTE weak (100 kbps)": 100_000
};

console.log(`Original JSON size: ${originalJson.length} bytes`);
console.log(`Compressed size: ${compressed.byteLength} bytes\n`);

Object.entries(networkSpeeds).forEach(([speed, bps]) => {
  const originalTime = (originalJson.length * 8) / bps * 1000; // ms
  const compressedTime = (compressed.byteLength * 8) / bps * 1000; // ms
  const speedup = originalTime / compressedTime;
  
  console.log(`${speed}:`);
  console.log(`  Original: ${originalTime.toFixed(2)}ms`);
  console.log(`  Compact: ${compressedTime.toFixed(2)}ms`);
  console.log(`  Speedup: ${speedup.toFixed(1)}x faster`);
});

console.log("\n" + "=" .repeat(60));
console.log("✅ All tests completed!");
