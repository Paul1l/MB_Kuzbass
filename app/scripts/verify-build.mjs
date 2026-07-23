import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const distDirectory = path.resolve('dist');
const catalogManifest = JSON.parse(await readFile(path.resolve('catalog-products.json'), 'utf8'));
const requiredFiles = [
  'index.html',
  '404.html',
  '500.html',
  '503.html',
  'offline.html',
  '_headers',
  'analytics-config.js',
  'assets/mb-kuzbass-label-background.webp',
  ...catalogManifest.categories.flatMap((category) =>
    category.products.flatMap((product) =>
      product.images.map((image) => `assets/catalog/${category.slug}/${image}`),
    ),
  ),
];

// Останавливает CI, если обязательный файл не попал в production-сборку.
await Promise.all(requiredFiles.map((fileName) => access(path.join(distDirectory, fileName))));

const indexHtml = await readFile(path.join(distDirectory, 'index.html'), 'utf8');
if (indexHtml.includes('/src/main.jsx')) throw new Error('В dist осталась ссылка на исходный JSX.');
if (!indexHtml.includes('analytics-config.js')) throw new Error('Конфигурация аналитики не подключена.');

// Собирает вложенные файлы, чтобы проверка охватывала не только корень assets, но и каталог товаров.
async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? collectFiles(entryPath) : [entryPath];
    }),
  );
  return nestedFiles.flat();
}

// Проверяет, что случайно добавленное тяжелое изображение не пройдет незамеченным.
for (const filePath of await collectFiles(path.join(distDirectory, 'assets'))) {
  const fileInfo = await stat(filePath);
  const relativePath = path.relative(distDirectory, filePath);
  if (fileInfo.size > 650_000) throw new Error(`Слишком тяжелый production-asset: ${relativePath}`);
}

console.log('Production-сборка прошла структурную проверку.');
