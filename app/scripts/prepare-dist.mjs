import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';

const assetsDirectory = path.resolve('dist/assets');
const keepLegacyFiles = new Set(['telegram-avatar.jpg', '2gis-photo-02.jpg']);
const legacyExtensions = new Set(['.jpg', '.jpeg', '.png']);
const redundantWebpFiles = new Set([
  'parallax-car-hero.webp',
  'parallax-car-01.webp',
  'parallax-car-03.webp',
  'parallax-car-04.webp',
  'parallax-car-05.webp',
  'telegram-avatar.webp',
]);

// Убирает тяжелые оригиналы из production-сборки; они остаются в app/public для дальнейшего обслуживания.
for (const fileName of await readdir(assetsDirectory)) {
  const extension = path.extname(fileName).toLowerCase();
  if (legacyExtensions.has(extension) && !keepLegacyFiles.has(fileName)) {
    await rm(path.join(assetsDirectory, fileName));
  }

  if (redundantWebpFiles.has(fileName)) {
    await rm(path.join(assetsDirectory, fileName));
  }
}
