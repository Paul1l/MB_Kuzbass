import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const assetsDirectory = path.resolve('public/assets');
const sourceExtensions = new Set(['.jpg', '.jpeg', '.png']);

// Подбирает ограничение размера и качество по назначению файла, не увеличивая исходник.
function getImageOptions(fileName) {
  if (fileName === 'telegram-avatar.jpg') return { width: 320, quality: 84 };
  if (fileName.startsWith('engine-')) return { width: 960, quality: 78 };
  if (fileName === 'mb-kuzbass-label-background.png') return { width: 1920, quality: 82 };
  return { width: 1600, quality: 76 };
}

// Создает WebP рядом с оригиналом. Оригиналы остаются как редактируемый источник и удаляются только из dist.
async function optimizeImage(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  if (!sourceExtensions.has(extension)) return null;

  const inputPath = path.join(assetsDirectory, fileName);
  const outputPath = path.join(assetsDirectory, `${path.basename(fileName, extension)}.webp`);
  const options = getImageOptions(fileName);

  await sharp(inputPath)
    .rotate()
    .resize({ width: options.width, withoutEnlargement: true })
    .webp({ quality: options.quality, effort: 5, smartSubsample: true })
    .toFile(outputPath);

  const [inputInfo, outputInfo] = await Promise.all([stat(inputPath), stat(outputPath)]);
  return { fileName, inputBytes: inputInfo.size, outputBytes: outputInfo.size };
}

await mkdir(assetsDirectory, { recursive: true });
const files = await readdir(assetsDirectory);
const results = (await Promise.all(files.map(optimizeImage))).filter(Boolean);
const before = results.reduce((sum, item) => sum + item.inputBytes, 0);
const after = results.reduce((sum, item) => sum + item.outputBytes, 0);
const savedPercent = before ? Math.round((1 - after / before) * 100) : 0;

console.log(`Оптимизировано изображений: ${results.length}. Экономия: ${savedPercent}%.`);
