import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Вставляет готовую разметку главной в #root собранного dist/index.html. Без неё главная — пустая страница,
// пока не выполнится JavaScript: поисковики видели только title и описание, без заголовка, текстов и ссылок.
// Разметку рисует тот же <App />, что и в браузере (src/entry-server.jsx, собран `vite build --ssr` в dist-ssr),
// поэтому тексты одинаковые, а React в браузере подхватывает её без перерисовки (hydrateRoot в main.jsx).

// Боевая сборка React: без лишних проверок и предупреждений разработчика.
process.env.NODE_ENV = 'production';

const distDirectory = path.resolve('dist');
const ssrDirectory = path.resolve('dist-ssr');
const indexPath = path.join(distDirectory, 'index.html');
const emptyRoot = '<div id="root"></div>';

const { render } = await import(pathToFileURL(path.join(ssrDirectory, 'entry-server.js')).href);
const appHtml = render();
if (!appHtml.includes('<h1')) throw new Error('Готовая разметка главной без заголовка H1: проверьте src/entry-server.jsx.');

const indexHtml = await readFile(indexPath, 'utf8');
if (!indexHtml.includes(emptyRoot)) {
  throw new Error(`В dist/index.html нет пустого ${emptyRoot}: главная уже обработана или изменился шаблон app/index.html.`);
}
await writeFile(indexPath, indexHtml.replace(emptyRoot, `<div id="root">${appHtml}</div>`));
// dist-ssr дальше нужна generate-legal-pages.mjs (тексты документов); удаляет её он.

console.log(`Главная: готовая разметка ${Math.round(appHtml.length / 1024)} КБ вставлена в dist/index.html.`);
