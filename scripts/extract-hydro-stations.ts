/**
 * Script to extract station data from Hydrographic Department website
 * Run with: npx tsx scripts/extract-hydro-stations.ts
 */

import { JSDOM } from 'jsdom';
import * as fs from 'fs';

interface HydroStation {
    id: string;
    name: string;
    nameTh: string;
    lat: number;
    lon: number;
    source: "Hydrographic Department";
}

async function extractStations(): Promise<HydroStation[]> {
    console.log('Fetching Hydrographic Department page...');

    const response = await fetch('https://hydro.newfolderhosting.com/highest-and-lowest-water-level');
    const html = await response.text();

    // Extract station names from bindPopup calls
    const nameMatches = html.matchAll(/bindPopup\(window\.WPLeafletMapPlugin\.unescape\('([^']+)'\)/g);
    const names: string[] = [];
    for (const match of nameMatches) {
        names.push(match[1]);
    }

    // Extract coordinates from L.marker calls
    const coordMatches = html.matchAll(/L\.marker\(\s*\[([0-9.]+),([0-9.]+)\]/g);
    const coords: Array<{ lat: number, lon: number }> = [];
    for (const match of coordMatches) {
        coords.push({
            lat: parseFloat(match[1]),
            lon: parseFloat(match[2])
        });
    }

    console.log(`Found ${names.length} station names and ${coords.length} coordinates`);

    // Combine into station objects
    const stations: HydroStation[] = [];
    const minLength = Math.min(names.length, coords.length);

    for (let i = 0; i < minLength; i++) {
        stations.push({
            id: `hydro-${i + 1}`,
            name: names[i],
            nameTh: names[i],
            lat: coords[i].lat,
            lon: coords[i].lon,
            source: "Hydrographic Department"
        });
    }

    return stations;
}

async function main() {
    try {
        const stations = await extractStations();

        console.log('\n=== Extracted Stations ===');
        stations.forEach((s, i) => {
            console.log(`${i + 1}. ${s.nameTh} (${s.lat.toFixed(4)}, ${s.lon.toFixed(4)})`);
        });

        // Save to JSON file
        const outputPath = './data/hydro-stations.json';
        fs.writeFileSync(outputPath, JSON.stringify(stations, null, 2), 'utf-8');
        console.log(`\nSaved ${stations.length} stations to ${outputPath}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
