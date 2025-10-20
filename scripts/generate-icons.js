// Fallback: Create simple colored squares as PWA icons
// This script generates placeholder icons for development
// Replace with proper icons later

const fs = require('fs');
const { createCanvas } = require('canvas');

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, '#0EA5E9');
  gradient.addColorStop(1, '#0284C7');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  
  // Text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.3}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌊', size / 2, size / 2);
  
  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Generated ${filename}`);
}

// Generate icons
try {
  generateIcon(192, './public/icon-192.png');
  generateIcon(512, './public/icon-512.png');
} catch (error) {
  console.error('Error generating icons:', error.message);
  console.log('Using fallback method...');
}
