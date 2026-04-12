#!/usr/bin/env node
/**
 * PWA Icon Generator — pure Node.js, zero dependencies
 * Brand: FlashCard App — purple theme (#6366f1)
 * Generates RGBA PNGs at all required PWA sizes using built-in zlib.
 *
 * Run: node scripts/generate-icons.js
 */

'use strict';

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// ─── CRC-32 ──────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([tb, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([lenBuf, tb, data, crcBuf]);
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────

/** Point-in-polygon — ray casting algorithm. vertices: [[x,y], ...] */
function pointInPolygon(px, py, vertices) {
  let inside = false;
  const n = vertices.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = vertices[i];
    const [xj, yj] = vertices[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Lightning-bolt polygon, normalized to [0,1]×[0,1].
 * Matches the brand favicon aesthetic (top-right → bottom-left zig-zag).
 */
const BOLT_VERTS = [
  [0.62, 0.06],  // top-right
  [0.25, 0.50],  // mid-left (top half)
  [0.50, 0.50],  // inner notch (top)
  [0.38, 0.94],  // bottom-left
  [0.75, 0.50],  // mid-right (bottom half)
  [0.50, 0.50],  // inner notch (bottom) — same point, makes convex break
];

// The bolt is two triangles sharing an inner edge; we handle it as one polygon
// with a "figure-8" by using separate upper/lower polygons.
const BOLT_UPPER = [
  [0.62, 0.06],
  [0.22, 0.52],
  [0.52, 0.52],
];
const BOLT_LOWER = [
  [0.48, 0.48],
  [0.78, 0.48],
  [0.38, 0.94],
];

function isInBolt(nx, ny) {
  return pointInPolygon(nx, ny, BOLT_UPPER) || pointInPolygon(nx, ny, BOLT_LOWER);
}

/** Is pixel (px, py) inside a rounded rectangle of size w×h with corner radius r? */
function inRoundedRect(px, py, w, h, r) {
  if (px < 0 || py < 0 || px >= w || py >= h) return false;
  // Corner zones
  if (px < r && py < r)           return Math.hypot(px - r, py - r) <= r;
  if (px > w - r && py < r)       return Math.hypot(px - (w - r), py - r) <= r;
  if (px < r && py > h - r)       return Math.hypot(px - r, py - (h - r)) <= r;
  if (px > w - r && py > h - r)   return Math.hypot(px - (w - r), py - (h - r)) <= r;
  return true;
}

// ─── PNG builder ─────────────────────────────────────────────────────────────

/**
 * Create a square RGBA PNG of `size`×`size` pixels with:
 *   • Transparent outside the rounded-rect
 *   • Purple (#6366f1) fill inside
 *   • White lightning bolt inside the purple area
 *
 * @param {number} size  Icon dimension in pixels
 * @returns {Buffer}     Raw PNG bytes
 */
function buildIconPNG(size) {
  // Brand colours
  const BG  = [0x63, 0x66, 0xf1, 0xff]; // #6366f1
  const FG  = [0xff, 0xff, 0xff, 0xff]; // white bolt
  const TR  = [0x00, 0x00, 0x00, 0x00]; // transparent

  const PADDING   = Math.max(1, Math.round(size * 0.12));
  const innerSize = size - PADDING * 2;
  const cornerR   = Math.round(innerSize * 0.18);

  // Bolt padding (slight inner margin so bolt doesn't touch the border)
  const BOLT_PAD = Math.max(1, Math.round(innerSize * 0.08));

  const rawRows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4, 0); // filter byte + RGBA
    row[0] = 0; // None filter
    for (let x = 0; x < size; x++) {
      const lx = x - PADDING; // local coords within rounded rect
      const ly = y - PADDING;
      const offset = 1 + x * 4;

      if (!inRoundedRect(lx, ly, innerSize, innerSize, cornerR)) {
        // transparent outside shape
        TR.forEach((v, i) => { row[offset + i] = v; });
        continue;
      }

      // Normalise to [0,1] within inner area (with bolt padding)
      const bx = lx - BOLT_PAD;
      const by = ly - BOLT_PAD;
      const bSize = innerSize - BOLT_PAD * 2;
      const nx = bx / bSize;
      const ny = by / bSize;

      const colour = (bx >= 0 && by >= 0 && bx < bSize && by < bSize && isInBolt(nx, ny))
        ? FG
        : BG;
      colour.forEach((v, i) => { row[offset + i] = v; });
    }
    rawRows.push(row);
  }

  const raw        = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(raw, { level: 9 });

  // IHDR: 13 bytes
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 6; // colour type: RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(OUT_DIR, { recursive: true });

const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];

for (const size of SIZES) {
  const outPath = path.join(OUT_DIR, `icon-${size}x${size}.png`);
  const buf     = buildIconPNG(size);
  fs.writeFileSync(outPath, buf);
  console.log(`✓  icon-${size}x${size}.png  (${buf.length} bytes)`);
}

// Also write apple-touch-icon at 180 (same as 180 above, just a copy)
fs.copyFileSync(
  path.join(OUT_DIR, 'icon-180x180.png'),
  path.join(__dirname, '..', 'public', 'apple-touch-icon.png')
);
console.log('✓  apple-touch-icon.png (public/)');

// Maskable icon (same design, browsers can apply their own mask)
fs.copyFileSync(
  path.join(OUT_DIR, 'icon-512x512.png'),
  path.join(OUT_DIR, 'maskable-icon-512x512.png')
);
console.log('✓  maskable-icon-512x512.png');

console.log('\n🎉  All icons generated in public/icons/');
