/**
 * svg_to_icons.js
 * Converts icon.svg -> assets/icon.png (512px) + icon-256.png + icon.ico
 * Uses @resvg/resvg-js for pixel-perfect SVG rendering (real Rust SVG engine).
 * NO approximation - the actual SVG file is rendered exactly as a browser would.
 */

const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

// ─── paths ────────────────────────────────────────────────────────────────────
const SVG_FILE   = path.join(__dirname, '../icon.svg');
const ASSETS_DIR = path.join(__dirname, '../assets');

if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

// ─── read the REAL svg ────────────────────────────────────────────────────────
const svgData = fs.readFileSync(SVG_FILE, 'utf8');
console.log(`Using SVG: ${SVG_FILE}`);

// ─── render at 512 × 512 (resvg renders it natively) ────────────────────────
function renderSVG(size) {
  const resvg = new Resvg(svgData, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(0,0,0,0)',  // keep transparency
  });
  const png = resvg.render();
  return png.asPng();             // returns a Buffer
}

// 512 × 512
const png512 = renderSVG(512);
const out512 = path.join(ASSETS_DIR, 'icon.png');
fs.writeFileSync(out512, png512);
console.log('OK  assets/icon.png (512x512)');

// 256 × 256
const png256 = renderSVG(256);
const out256 = path.join(ASSETS_DIR, 'icon-256.png');
fs.writeFileSync(out256, png256);
console.log('OK  assets/icon-256.png (256x256)');

// ─── build .ico manually (RIFF container with multiple BMP/PNG entries) ───────
// Modern Windows ICO with embedded PNGs (Vista+). Format:
//   ICONDIR header + N ICONDIRENTRY + N image data blobs
const ICO_SIZES = [256, 128, 64, 48, 32, 24, 16];

const images = ICO_SIZES.map(sz => {
  const buf = renderSVG(sz);
  return { size: sz, data: buf };
});

// ICONDIR: 6 bytes
const iconDir = Buffer.alloc(6);
iconDir.writeUInt16LE(0,       0); // Reserved
iconDir.writeUInt16LE(1,       2); // Type = 1 (ICO)
iconDir.writeUInt16LE(images.length, 4);

// ICONDIRENTRY: 16 bytes each
const dirEntries = [];
let dataOffset = 6 + images.length * 16;

for (const img of images) {
  const entry = Buffer.alloc(16);
  const sz = img.size >= 256 ? 0 : img.size; // 0 = 256 in ICO spec
  entry.writeUInt8(sz,              0); // width
  entry.writeUInt8(sz,              1); // height
  entry.writeUInt8(0,               2); // color count (0 for PNG)
  entry.writeUInt8(0,               3); // reserved
  entry.writeUInt16LE(1,            4); // planes
  entry.writeUInt16LE(32,           6); // bit count
  entry.writeUInt32LE(img.data.length, 8);  // size of image data
  entry.writeUInt32LE(dataOffset,   12); // offset
  dirEntries.push(entry);
  dataOffset += img.data.length;
}

const icoBuffer = Buffer.concat([
  iconDir,
  ...dirEntries,
  ...images.map(i => i.data)
]);

const outIco = path.join(ASSETS_DIR, 'icon.ico');
fs.writeFileSync(outIco, icoBuffer);
console.log(`OK  assets/icon.ico (${ICO_SIZES.join(', ')}px — from real SVG)`);
console.log('Done. Your exact icon.svg was used, no recreation.');
