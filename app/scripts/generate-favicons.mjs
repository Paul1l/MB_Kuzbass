import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const publicDirectory = path.resolve('public');
const sourceSvg = await readFile(path.join(publicDirectory, 'favicon.svg'));
const rasterIcons = [
  ['favicon-96x96.png', 96],
  ['apple-touch-icon.png', 180],
  ['favicon-192x192.png', 192],
  ['favicon-512x512.png', 512],
];

async function renderPng(size) {
  return sharp(sourceSvg, { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

await Promise.all(
  rasterIcons.map(async ([fileName, size]) => {
    await writeFile(path.join(publicDirectory, fileName), await renderPng(size));
  }),
);

// ICO supports an embedded PNG image. Keeping a conventional /favicon.ico
// gives older browsers and crawlers a reliable fallback.
const icoPng = await renderPng(64);
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
icoHeader.writeUInt8(64, 6);
icoHeader.writeUInt8(64, 7);
icoHeader.writeUInt8(0, 8);
icoHeader.writeUInt8(0, 9);
icoHeader.writeUInt16LE(1, 10);
icoHeader.writeUInt16LE(32, 12);
icoHeader.writeUInt32LE(icoPng.length, 14);
icoHeader.writeUInt32LE(22, 18);

await writeFile(
  path.join(publicDirectory, 'favicon.ico'),
  Buffer.concat([icoHeader, icoPng]),
);

console.log(`Generated ${rasterIcons.length + 1} favicon files.`);
