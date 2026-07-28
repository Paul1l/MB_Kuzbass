import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const distDirectory = path.resolve('dist');
const productionOrigin = 'https://mb-kuzbass.ru';
const legacyOrigin = 'https://paul1l.github.io/MB_Kuzbass';
const catalogManifest = JSON.parse(await readFile(path.resolve('catalog-products.json'), 'utf8'));
const requiredFiles = [
  'index.html',
  '404.html',
  '500.html',
  '503.html',
  'offline.html',
  '_headers',
  'analytics-config.js',
  'robots.txt',
  'sitemap.xml',
  'yandex_069c92c8aa409d72.html',
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
if (!indexHtml.includes('name="msvalidate.01" content="192BAF445B30A248D9D63FB12022235D"')) {
  throw new Error('Bing Webmaster verification meta tag is missing or invalid.');
}
if (indexHtml.includes('mc.yandex.ru/watch/')) {
  throw new Error('В HTML найден пиксель Метрики, который может сработать до согласия пользователя.');
}

const analyticsConfig = await readFile(path.join(distDirectory, 'analytics-config.js'), 'utf8');
if (!analyticsConfig.includes('counterId: 111089917')) {
  throw new Error('В production-конфигурации отсутствует счетчик Яндекс.Метрики 111089917.');
}

const builtAssetNames = await readdir(path.join(distDirectory, 'assets'));
const javascriptBundleName = builtAssetNames.find(
  (fileName) => fileName.startsWith('index-') && fileName.endsWith('.js'),
);
if (!javascriptBundleName) throw new Error('Не найден production JavaScript bundle.');

const javascriptBundle = await readFile(
  path.join(distDirectory, 'assets', javascriptBundleName),
  'utf8',
);
for (const requiredMarker of ['tag.js?id=', 'ym-hide-content', 'ym-disable-keys']) {
  if (!javascriptBundle.includes(requiredMarker)) {
    throw new Error(`В production JavaScript отсутствует защита аналитики: ${requiredMarker}`);
  }
}

// Собирает вложенные файлы, чтобы проверка охватывала не только корень assets, но и каталог товаров.
const robotsTxt = await readFile(path.join(distDirectory, 'robots.txt'), 'utf8');
const sitemapXml = await readFile(path.join(distDirectory, 'sitemap.xml'), 'utf8');
const publicSeoFiles = [
  ['index.html', indexHtml],
  ['robots.txt', robotsTxt],
  ['sitemap.xml', sitemapXml],
];

// Keep every public SEO reference on the production domain.
for (const [fileName, contents] of publicSeoFiles) {
  if (!contents.includes(productionOrigin)) {
    throw new Error(`${fileName} does not reference the production domain ${productionOrigin}.`);
  }
  if (contents.includes(legacyOrigin)) {
    throw new Error(`${fileName} still references the legacy GitHub Pages URL.`);
  }
}

if (!indexHtml.includes(`<link rel="canonical" href="${productionOrigin}/"`)) {
  throw new Error('index.html does not contain the expected production canonical URL.');
}

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
