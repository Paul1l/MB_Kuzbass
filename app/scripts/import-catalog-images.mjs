import { mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceRoot = process.argv[2] ? path.resolve(process.argv[2]) : null;
const manifestPath = path.resolve('catalog-products.json');
const outputRoot = path.resolve('public/assets/catalog');

if (!sourceRoot) {
  throw new Error('Укажите папку-источник: npm run import:catalog -- "C:\\путь\\к\\Каталог товаров"');
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const outputWidth = 800;
const outputHeight = 600;

// Каталог — полностью генерируемая папка. Очистка перед импортом не оставляет устаревшие фото
// после переименования или удаления товара из манифеста.
await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

// Добавляет единый аккуратный знак происхождения фото, не закрывая саму запчасть.
function createBrandOverlay() {
  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${outputWidth}" height="${outputHeight}">
      <rect x="1" y="1" width="${outputWidth - 2}" height="${outputHeight - 2}"
        fill="none" stroke="rgba(22,22,22,0.18)" stroke-width="2"/>
      <g transform="translate(610 530)">
        <rect width="170" height="48" rx="4" fill="rgba(255,255,255,0.88)"/>
        <rect width="7" height="48" rx="4" fill="#d3312b"/>
        <text x="20" y="23" font-family="Arial, sans-serif" font-size="15"
          font-weight="700" fill="#171717">MB KUZBASS</text>
        <text x="20" y="39" font-family="Arial, sans-serif" font-size="10"
          font-weight="700" fill="#d3312b">ФОТО ТОВАРА</text>
      </g>
    </svg>
  `);
}

async function processImage(sourcePath, outputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true });

  await sharp(sourcePath)
    .rotate()
    .resize(outputWidth, outputHeight, {
      fit: 'contain',
      background: '#f1f2f0',
    })
    .modulate({ brightness: 1.02, saturation: 0.98 })
    .sharpen(0.45)
    .composite([{ input: createBrandOverlay() }])
    .webp({
      quality: 84,
      effort: 6,
      smartSubsample: true,
    })
    .toFile(outputPath);
}

let processedImages = 0;

for (const category of manifest.categories) {
  for (const product of category.products) {
    if (product.sourceImages.length !== product.images.length) {
      throw new Error(`Количество sourceImages и images не совпадает: ${product.title}`);
    }

    for (let index = 0; index < product.sourceImages.length; index += 1) {
      const sourcePath = path.join(sourceRoot, ...product.sourceImages[index].split('/'));
      const outputPath = path.join(outputRoot, category.slug, product.images[index]);
      await processImage(sourcePath, outputPath);
      processedImages += 1;
    }
  }
}

console.log(`Каталог подготовлен: ${processedImages} изображений в ${outputRoot}`);
