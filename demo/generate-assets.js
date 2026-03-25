/**
 * Script tạo assets cho game Match-3
 * Chạy: node generate-assets.js
 * Tạo ra các file PNG trong public/assets/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, 'public', 'assets');

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

/**
 * Tạo file SVG rồi ghi ra file
 */
function createSVG(filename, svgContent) {
    const filepath = path.join(assetsDir, filename);
    fs.writeFileSync(filepath, svgContent);
    console.log(`Created: ${filename}`);
}

// === FIELD (ô nền) ===
createSVG('field.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70">
  <rect x="2" y="2" width="66" height="66" rx="8" ry="8" fill="#2a2a4a" stroke="#3a3a6a" stroke-width="2"/>
</svg>`);

// === FIELD SELECTED (ô được chọn) ===
createSVG('field-selected.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70">
  <rect x="2" y="2" width="66" height="66" rx="8" ry="8" fill="none" stroke="#ffdd57" stroke-width="3"/>
</svg>`);

// === TILES (viên gạch màu) ===
const tiles = [
    { name: 'blue',   color: '#4fc3f7', dark: '#0288d1', icon: '◆' },
    { name: 'green',  color: '#81c784', dark: '#388e3c', icon: '●' },
    { name: 'orange', color: '#ffb74d', dark: '#f57c00', icon: '▲' },
    { name: 'red',    color: '#e57373', dark: '#d32f2f', icon: '★' },
    { name: 'purple', color: '#ba68c8', dark: '#7b1fa2', icon: '♦' },
    { name: 'yellow', color: '#fff176', dark: '#f9a825', icon: '■' },
];

tiles.forEach(tile => {
    createSVG(`${tile.name}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${tile.color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${tile.dark};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#00000044"/>
    </filter>
  </defs>
  <rect x="5" y="5" width="50" height="50" rx="12" ry="12" fill="url(#g)" filter="url(#shadow)"/>
  <rect x="8" y="8" width="44" height="22" rx="8" ry="8" fill="#ffffff22"/>
</svg>`);
});

console.log('\n✅ All assets generated in public/assets/');
console.log('Note: Using SVG files directly - PixiJS v8 supports SVG!');
