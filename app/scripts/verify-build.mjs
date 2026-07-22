import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const distDirectory = path.resolve('dist');
const requiredFiles = [
  'index.html',
  '404.html',
  '500.html',
  '503.html',
  'offline.html',
  '_headers',
  'analytics-config.js',
  'assets/mb-kuzbass-label-background.webp',
];

// Останавливает CI, если обязательный файл не попал в production-сборку.
await Promise.all(requiredFiles.map((fileName) => access(path.join(distDirectory, fileName))));

const indexHtml = await readFile(path.join(distDirectory, 'index.html'), 'utf8');
if (indexHtml.includes('/src/main.jsx')) throw new Error('В dist осталась ссылка на исходный JSX.');
if (!indexHtml.includes('analytics-config.js')) throw new Error('Конфигурация аналитики не подключена.');

// Проверяет, что случайно добавленное тяжелое изображение не пройдет незамеченным.
for (const fileName of await readdir(path.join(distDirectory, 'assets'))) {
  const fileInfo = await stat(path.join(distDirectory, 'assets', fileName));
  if (fileInfo.size > 650_000) throw new Error(`Слишком тяжелый production-asset: ${fileName}`);
}

console.log('Production-сборка прошла структурную проверку.');
