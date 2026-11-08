import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { articleLinks, articleRoot } from '../src/articleLinks.js';
import { articles } from '../src/articles.js';
import { legalDocPath, legalDocPathNames } from '../src/legalPaths.js';

const distDirectory = path.resolve('dist');
const productionOrigin = 'https://mb-kuzbass.ru';
const legacyOrigin = 'https://paul1l.github.io/MB_Kuzbass';
const catalogManifest = JSON.parse(await readFile(path.resolve('catalog-products.json'), 'utf8'));
// Компоненты разложены по src/components, src/sections и src/lib, поэтому контрольные тексты ищутся во всех исходниках.
const sourceDirectory = path.resolve('src');
const sourceFiles = (await readdir(sourceDirectory, { recursive: true })).filter((fileName) => /\.jsx?$/.test(fileName));
const appSource = (
  await Promise.all(sourceFiles.map((fileName) => readFile(path.join(sourceDirectory, fileName), 'utf8')))
).join('\n');
const dataSource = await readFile(path.resolve('src/data.js'), 'utf8');
const privacyConsentSource = await readFile(path.resolve('src/privacyConsent.js'), 'utf8');
const requiredFiles = [
  'index.html',
  '404.html',
  '500.html',
  '503.html',
  'offline.html',
  '_headers',
  'analytics-config.js',
  'seo-pages.js',
  'robots.txt',
  'sitemap.xml',
  'sw.js',
  'yandex_069c92c8aa409d72.html',
  'favicon.ico',
  'favicon.svg',
  'favicon-96x96.png',
  'apple-touch-icon.png',
  'favicon-192x192.png',
  'favicon-512x512.png',
  'assets/mb-kuzbass-label-background.webp',
  ...catalogManifest.categories.flatMap((category) =>
    category.products.flatMap((product) =>
      product.images.map((image) => `assets/catalog/${category.slug}/${image}`),
    ),
  ),
];

// Защищает юридически значимые элементы интерфейса от случайного отката при следующих правках.
for (const [sourceName, source, forbiddenText] of [
  ['src', appSource, 'Согласен на обработку персональных данных по'],
  ['data.js', dataSource, 'Yura Shishkin'],
]) {
  if (source.includes(forbiddenText)) {
    throw new Error(`${sourceName} содержит запрещенную устаревшую формулировку: ${forbiddenText}`);
  }
}

for (const [sourceName, source, requiredText] of [
  ['src', appSource, 'Даю отдельное согласие на обработку персональных данных'],
  ['src', appSource, 'Редакция согласия:'],
  ['src', appSource, 'Согласие на публикацию имени, фото или отзыва этой галочкой не предоставляется'],
  ['data.js', dataSource, 'Клиент на Флампе'],
  ['data.js', dataSource, "updatedAt: '29.10.2026'"],
  ['privacyConsent.js', privacyConsentSource, "PRIVACY_CONSENT_VERSION = '2026-08-03'"],
]) {
  if (!source.includes(requiredText)) {
    throw new Error(`${sourceName} не содержит обязательный контрольный текст: ${requiredText}`);
  }
}

// Останавливает CI, если обязательный файл не попал в production-сборку.
await Promise.all(requiredFiles.map((fileName) => access(path.join(distDirectory, fileName))));

const indexHtml = await readFile(path.join(distDirectory, 'index.html'), 'utf8');
if (indexHtml.includes('/src/main.jsx')) throw new Error('В dist осталась ссылка на исходный JSX.');
if (!indexHtml.includes('analytics-config.js')) throw new Error('Конфигурация аналитики не подключена.');
if (!indexHtml.includes('name="msvalidate.01" content="192BAF445B30A248D9D63FB12022235D"')) {
  throw new Error('Bing Webmaster verification meta tag is missing or invalid.');
}
if (!indexHtml.includes('rel="icon" href="./favicon-96x96.png"')) {
  throw new Error('Google Search favicon link is missing or invalid.');
}
// Главная приходит готовым HTML (scripts/prerender-home.mjs): без него поисковики видят пустую страницу.
const rootStart = indexHtml.indexOf('<div id="root">');
const rootHtml = rootStart === -1 ? '' : indexHtml.slice(rootStart, indexHtml.indexOf('<script', rootStart));
if (!/<h1[\s>]/.test(rootHtml)) {
  throw new Error('В dist/index.html нет заголовка H1 внутри #root: готовая разметка главной не собралась.');
}
if (!rootHtml.includes('href="katalog/"')) {
  throw new Error('В готовой разметке главной нет обычной ссылки на каталог katalog/.');
}
// Плашка cookie появляется только в браузере и только у тех, кто ещё не выбирал.
if (rootHtml.includes('cookie-banner')) {
  throw new Error('Плашка cookie попала в готовый HTML главной.');
}
if (indexHtml.includes('mc.yandex.ru/watch/')) {
  throw new Error('В HTML найден пиксель Метрики, который может сработать до согласия пользователя.');
}
// Рейтинг 2ГИС — оценки другой площадки, их нельзя размечать как собственный aggregateRating сайта.
if (indexHtml.includes('aggregateRating')) {
  throw new Error('index.html снова содержит aggregateRating с рейтингом стороннего сервиса.');
}

const analyticsConfig = await readFile(path.join(distDirectory, 'analytics-config.js'), 'utf8');
if (!analyticsConfig.includes('counterId: 111089917')) {
  throw new Error('В production-конфигурации отсутствует счетчик Яндекс.Метрики 111089917.');
}
if (!analyticsConfig.includes('webvisor: true')) {
  throw new Error('Production-конфигурация должна явно фиксировать текущий режим Вебвизора.');
}

const serviceWorker = await readFile(path.join(distDirectory, 'sw.js'), 'utf8');
if (!serviceWorker.includes("CACHE_NAME = 'mb-kuzbass-static-v11'")) {
  throw new Error('Версия service worker не обновлена для новой редакции документов.');
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

// Заявки принимает личный аккаунт; открытая группа не должна снова стать основным каналом.
const leadTelegramUrl = 'https://t.me/MB_Kuzbass';
if (!javascriptBundle.includes(leadTelegramUrl)) {
  throw new Error(`В production JavaScript нет аккаунта для заявок ${leadTelegramUrl}.`);
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
  throw new Error(`${fileName} still references the legacy site URL.`);
  }
}

if (!indexHtml.includes(`<link rel="canonical" href="${productionOrigin}/"`)) {
  throw new Error('index.html does not contain the expected production canonical URL.');
}

// Каждый адрес из sitemap.xml должен быть в сборке: посадочные страницы лежат в public/<адрес>/index.html,
// страницы каталога /katalog/ создает scripts/generate-catalog-pages.mjs. Иначе они тихо пропадут при выкладке.
const landingPaths = [];
const articleSitemapPaths = [];
const catalogPaths = [];
for (const [, location] of sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
  const { pathname } = new URL(location);
  const pageFile = pathname === '/' ? 'index.html' : `${pathname.replace(/^\/+|\/+$/g, '')}/index.html`;
  await access(path.join(distDirectory, pageFile)).catch(() => {
    throw new Error(`sitemap.xml ссылается на страницу, которой нет в сборке: ${pathname}`);
  });
  if (pathname.startsWith('/katalog/')) catalogPaths.push(pathname);
  else if (pathname.startsWith(`/${articleRoot}`)) articleSitemapPaths.push(pathname);
  else if (pathname !== '/') landingPaths.push(pathname);
}

// Посадочные и страницы каталога подключают согласие на cookie и Метрику (public/seo-pages.js) внешними файлами.
// Версия согласия в нём должна совпадать с главной: иначе выбор, сделанный на одной странице, не узнает другая.
const staticPagesScript = await readFile(path.join(distDirectory, 'seo-pages.js'), 'utf8');
const mainConsentVersion = privacyConsentSource.match(/PRIVACY_CONSENT_VERSION = '([^']+)'/)?.[1];
if (!mainConsentVersion || !staticPagesScript.includes(`const CONSENT_VERSION = '${mainConsentVersion}';`)) {
  throw new Error(`Версия согласия в seo-pages.js не совпадает с src/privacyConsent.js (${mainConsentVersion}).`);
}
// Ключевые места скрипта: тот же cookie выбора, загрузка счётчика, цели по кнопкам связи, удаление cookie Метрики.
for (const marker of ["'mb_privacy_preferences'", 'https://mc.yandex.ru/metrika/tag.js?id=', "'reachGoal'", "'destruct'", '; Domain=']) {
  if (!staticPagesScript.includes(marker)) {
    throw new Error(`В seo-pages.js нет обязательной части: ${marker}`);
  }
}
// Документы — отдельные страницы /dokumenty/…/ из тех же текстов legalDocs, что окна на главной (generate-legal-pages.mjs):
// они должны быть для каждого документа, не пустые и с тем же заголовком. В sitemap.xml их нет: они для посетителей.
const legalDocsFromSource = [...dataSource.matchAll(/id: '([\w-]+)',\s*footerLabel: '([^']+)',\s*title: '([^']+)'/g)].map(
  ([, id, footerLabel, title]) => ({ id, footerLabel, title, path: `/${legalDocPath(id)}` }),
);
if (legalDocsFromSource.length !== Object.keys(legalDocPathNames).length) {
  throw new Error(`В data.js ${legalDocsFromSource.length} документов, а адресов в src/legalPaths.js ${Object.keys(legalDocPathNames).length}.`);
}
for (const doc of legalDocsFromSource) {
  const legalHtml = await readFile(path.join(distDirectory, doc.path, 'index.html'), 'utf8').catch(() => '');
  const sectionCount = (legalHtml.match(/<section>/g) || []).length;
  if (!legalHtml.includes(`<h1>${doc.title}</h1>`) || sectionCount < 1 || legalHtml.length < 3000) {
    throw new Error(`${doc.path}: страница документа «${doc.title}» не создана или пустая (разделов: ${sectionCount}).`);
  }
  if (!legalHtml.includes(`<link rel="canonical" href="${productionOrigin}${doc.path}" />`)) {
    throw new Error(`${doc.path}: нет канонического адреса страницы документа.`);
  }
}
if (sitemapXml.includes('/dokumenty/')) {
  throw new Error('Страницы документов попали в sitemap.xml: они закрыты от индекса (noindex) и там не нужны.');
}

// Подвал каждой статичной страницы: реквизиты (ИНН и ОГРНИП из data.js) и ссылки на все документы с теми же подписями,
// что в подвале главной. Ссылки на документы — страницы, а не окна /#privacy: те открываются только с JavaScript.
const ownerInn = dataSource.match(/ inn: '(\d+)'/)?.[1];
const ownerOgrnip = dataSource.match(/ ogrnip: '(\d+)'/)?.[1];
const documentLinks = legalDocsFromSource.map((doc) => `<a href="${doc.path}">${doc.footerLabel}</a>`);
const legalPaths = legalDocsFromSource.map((doc) => doc.path);
for (const staticPath of [...landingPaths, ...catalogPaths, ...legalPaths]) {
  const footer = (await readFile(path.join(distDirectory, staticPath, 'index.html'), 'utf8'))
    .replace(/<!--[\s\S]*?-->/g, '')
    .match(/<footer class="seo-footer">[\s\S]*?<\/footer>/)?.[0] || '';
  if (!footer.includes(`ИНН ${ownerInn}`) || !footer.includes(`ОГРНИП ${ownerOgrnip}`)) {
    throw new Error(`${staticPath}: в подвале нет ИНН и ОГРНИП владельца.`);
  }
  const missingLinks = documentLinks.filter((link) => !footer.includes(link));
  if (missingLinks.length) {
    throw new Error(`${staticPath}: в подвале нет ссылок на документы: ${missingLinks.join(', ')}`);
  }
  if (/href="\/#(privacy|consent|cookies|agreement|requisites|order-terms)"/.test(footer)) {
    throw new Error(`${staticPath}: подвал ссылается на документ окном /#…, которое без JavaScript не откроется.`);
  }
}
const homeFooter = indexHtml.match(/<footer class="footer">[\s\S]*?<\/footer>/)?.[0] || '';
if (!homeFooter.includes(`href="${articleRoot}"`)) {
  throw new Error('В подвале главной нет ссылки на раздел «Статьи».');
}
for (const doc of legalDocsFromSource) {
  if (!homeFooter.includes(`href="${legalDocPath(doc.id)}"`)) {
    throw new Error(`В подвале главной нет ссылки на страницу документа ${legalDocPath(doc.id)}.`);
  }
}

// Раздел «Статьи» (generate-article-pages.mjs). Черновики (draft: true) собираются только с ARTICLES_DRAFTS=1 —
// посмотреть шаблон; в обычную сборку для сайта они попасть не могут.
const draftsAllowed = process.env.ARTICLES_DRAFTS === '1';
const publishedArticles = articles.filter((article) => !article.draft);
const builtArticles = articles.filter((article) => draftsAllowed || !article.draft);
const articleListPath = `/${articleRoot}`;
const articlePaths = builtArticles.map((article) => `${articleListPath}${article.slug}/`);
const builtFiles = (await collectFiles(distDirectory)).map((filePath) => path.relative(distDirectory, filePath).split(path.sep).join('/'));
const builtFileSet = new Set(builtFiles);
if (!draftsAllowed) {
  for (const fileName of builtFiles.filter((name) => name.endsWith('.html'))) {
    if ((await readFile(path.join(distDirectory, fileName), 'utf8')).includes('data-article-draft')) {
      throw new Error(`${fileName}: в сборку попал черновик статьи (draft: true). Уберите его из src/articles.js или снимите draft.`);
    }
  }
  if (!publishedArticles.length) {
    throw new Error('В src/articles.js нет ни одной опубликованной статьи (только черновики-заглушки): раздел «Статьи» был бы пустым.');
  }
}
// Внутренняя ссылка ведёт на файл сборки: /адрес/ → адрес/index.html, /файл.ext → файл.ext, «/» → index.html.
const linkTarget = (href) => {
  const pathname = decodeURIComponent(href.split(/[?#]/)[0]);
  if (pathname === '/' || pathname.endsWith('/')) return `${pathname.replace(/^\/+/, '')}index.html`;
  return pathname.replace(/^\/+/, '');
};
for (const pagePath of [articleListPath, ...articlePaths]) {
  const pageHtml = await readFile(path.join(distDirectory, pagePath, 'index.html'), 'utf8').catch(() => '');
  if (!pageHtml) throw new Error(`${pagePath}: страницы раздела «Статьи» нет в сборке.`);
  if (!/<h1[\s>]/.test(pageHtml) || !pageHtml.includes(`<link rel="canonical" href="${productionOrigin}${pagePath}" />`)) {
    throw new Error(`${pagePath}: нет H1 или канонического адреса.`);
  }
  if (pagePath !== articleListPath && !pageHtml.includes('"@type":"Article"')) {
    throw new Error(`${pagePath}: нет разметки Article (JSON-LD).`);
  }
  if (pageHtml.includes('](/')) {
    throw new Error(`${pagePath}: в тексте осталась необработанная ссылка вида [текст](/адрес/).`);
  }
  for (const [, href] of pageHtml.matchAll(/href="(\/[^"]*)"/g)) {
    if (href.startsWith('//') || builtFileSet.has(linkTarget(href))) continue;
    throw new Error(`${pagePath}: ссылка ${href} ведёт на страницу, которой нет в сборке.`);
  }
}
for (const article of publishedArticles) {
  if (!articleSitemapPaths.includes(`${articleListPath}${article.slug}/`)) {
    throw new Error(`Статьи ${article.slug} нет в sitemap.xml.`);
  }
}
if (publishedArticles.length && !articleSitemapPaths.includes(articleListPath)) {
  throw new Error('Списка статей /stati/ нет в sitemap.xml.');
}
for (const sitemapPath of articleSitemapPaths) {
  if (sitemapPath !== articleListPath && !publishedArticles.some((article) => sitemapPath === `${articleListPath}${article.slug}/`)) {
    throw new Error(`В sitemap.xml адрес ${sitemapPath}, которого нет среди опубликованных статей.`);
  }
}
// Блок «Полезные статьи»: на страницах из карты src/articleLinks.js есть ссылка хотя бы на одну статью из сборки.
for (const [pagePath, slugsForPage] of Object.entries(articleLinks)) {
  if (!slugsForPage.some((slug) => builtArticles.some((article) => article.slug === slug))) continue;
  const pageHtml = await readFile(path.join(distDirectory, pagePath, 'index.html'), 'utf8');
  if (!pageHtml.includes('class="seo-useful"')) throw new Error(`${pagePath}: нет блока «Полезные статьи».`);
}

for (const staticPath of [...landingPaths, ...catalogPaths, ...legalPaths, articleListPath, ...articlePaths]) {
  // Ссылка на раздел «Статьи» — в подвале каждой статичной страницы, рядом с навигацией.
  const staticFooter = (await readFile(path.join(distDirectory, staticPath, 'index.html'), 'utf8')).match(
    /<footer class="seo-footer">[\s\S]*?<\/footer>/,
  )?.[0];
  if (!staticFooter?.includes(`href="${articleListPath}"`)) {
    throw new Error(`${staticPath}: в подвале нет ссылки на раздел «Статьи».`);
  }
}

for (const staticPath of [...landingPaths, ...catalogPaths, ...legalPaths, articleListPath, ...articlePaths]) {
  // Закомментированный тег <!-- <script …> --> браузер не выполнит, поэтому комментарии вырезаются до проверки.
  const staticHtml = (await readFile(path.join(distDirectory, staticPath, 'index.html'), 'utf8')).replace(/<!--[\s\S]*?-->/g, '');
  if (!staticHtml.includes('<script src="/analytics-config.js" defer></script>') || !/<script src="\/seo-pages\.js\?v=[^"]+" data-page="(landing|catalog|product|document|article)" defer><\/script>/.test(staticHtml)) {
    throw new Error(`${staticPath}: не подключена аналитика (analytics-config.js и seo-pages.js) — визиты не будут учтены.`);
  }
  if (staticHtml.includes('mc.yandex.ru')) {
    throw new Error(`${staticPath}: Метрика подключена прямо в HTML и сработает до согласия посетителя.`);
  }
}

// Каталог: общая страница, разделы и детали. На каждой — канонический адрес, хлебные крошки и заявка
// в личный аккаунт; главная ведет на разделы каталога обычными ссылками.
if (catalogPaths.length < 7) {
  throw new Error(`В sitemap.xml мало страниц каталога (${catalogPaths.length}): не запустился generate-catalog-pages.mjs?`);
}
for (const catalogPath of catalogPaths) {
  const catalogHtml = await readFile(path.join(distDirectory, catalogPath, 'index.html'), 'utf8');
  // Одинаковое имя у двух фото на странице ломает плавный переход между страницами (View Transitions).
  const transitionNames = [...catalogHtml.matchAll(/view-transition-name: ([\w-]+);/g)].map((match) => match[1]);
  if (new Set(transitionNames).size !== transitionNames.length) {
    throw new Error(`На ${catalogPath} два фото с одним view-transition-name: переход между страницами не сработает.`);
  }
  if (!catalogHtml.includes(`<link rel="canonical" href="https://mb-kuzbass.ru${catalogPath}" />`)) {
    throw new Error(`${catalogPath}: нет канонического адреса страницы.`);
  }
  if (!catalogHtml.includes(`href="${leadTelegramUrl}`) || !catalogHtml.includes('class="seo-breadcrumbs"')) {
    throw new Error(`${catalogPath}: нет кнопки Telegram в аккаунт для заявок или хлебных крошек.`);
  }
  for (const [, imageSrc] of catalogHtml.matchAll(/<img src="(\/assets\/[^"]+)"/g)) {
    await access(path.join(distDirectory, imageSrc)).catch(() => {
      throw new Error(`${catalogPath}: нет фото ${imageSrc}`);
    });
  }
}
if (!javascriptBundle.includes('katalog/')) {
  throw new Error('Главная не ссылается на страницы каталога /katalog/.');
}

// Посадочные связаны с главной и друг с другом обычными ссылками, а заявки с них идут в личный аккаунт.
for (const landingPath of landingPaths) {
  if (!javascriptBundle.includes(landingPath)) {
    throw new Error(`Главная не ссылается на посадочную страницу ${landingPath}.`);
  }

  const landingHtml = await readFile(path.join(distDirectory, landingPath, 'index.html'), 'utf8');
  const missingLinks = landingPaths.filter(
    (otherPath) => otherPath !== landingPath && !landingHtml.includes(`href="${otherPath}"`),
  );
  if (missingLinks.length) {
    throw new Error(`${landingPath} не ссылается на посадочные: ${missingLinks.join(', ')}`);
  }
  if (!landingHtml.includes(`href="${leadTelegramUrl}`)) {
    throw new Error(`${landingPath}: кнопка Telegram не ведет в аккаунт для заявок ${leadTelegramUrl}.`);
  }

  // Метку блока «Примеры со склада» заменяет generate-catalog-pages.mjs: осталась — блок пустой.
  if (landingHtml.includes('<!-- catalog-examples -->')) {
    throw new Error(`${landingPath}: метка <!-- catalog-examples --> не заменена карточками каталога.`);
  }

  // Внутренние ссылки посадочной (карточки каталога, статьи, документы) ведут на страницы из сборки.
  for (const [, href] of landingHtml.matchAll(/href="(\/[^"#?]*)"/g)) {
    if (/\.\w+$/.test(href)) continue; // файлы: стили, иконки, картинки
    const pageFile = href === '/' ? 'index.html' : `${href.replace(/^\/+|\/+$/g, '')}/index.html`;
    await access(path.join(distDirectory, pageFile)).catch(() => {
      throw new Error(`${landingPath}: ссылка на страницу, которой нет в сборке: ${href}`);
    });
  }

  // FAQ: разметка FAQPage совпадает с вопросами и ответами на странице, иначе поисковик сочтет ее недостоверной.
  const plainText = (html) =>
    html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim();
  const visibleFaq = [
    ...landingHtml.matchAll(/<div class="seo-faq__item">\s*<h3>([\s\S]*?)<\/h3>\s*<p>([\s\S]*?)<\/p>\s*<\/div>/g),
  ].map(([, question, answer]) => [plainText(question), plainText(answer)]);
  const landingGraph = JSON.parse(landingHtml.match(/<script type="application\/ld\+json">(.+?)<\/script>/s)?.[1] || '{}')['@graph'] || [];
  const faqPage = landingGraph.find((node) => node['@type'] === 'FAQPage');
  const markedFaq = faqPage?.mainEntity?.map((question) => [question.name, question.acceptedAnswer?.text]) || [];
  if (JSON.stringify(markedFaq) !== JSON.stringify(visibleFaq)) {
    throw new Error(`${landingPath}: разметка FAQPage не совпадает с вопросами и ответами на странице.`);
  }
}

// Тексты посадочных называют детали каталога («в каталоге сейчас…», модели, кузова и моторы). Каждое название
// должно быть в catalog-products.json: удалили деталь — поправьте текст посадочной (и FAQ) и этот список.
const landingCatalogMentions = {
  '/zapchasti-mercedes-barnaul/': ['W203', 'W204', 'W211', 'W212', 'W207', 'W221', 'W163', 'M111', 'M271', 'M272', 'M112'],
  '/dvigateli-akpp-mercedes-bmw-barnaul/': [
    'Двигатель Mercedes-Benz C203 M111',
    'Двигатель Mercedes-Benz C203 M271',
    'Двигатель Mercedes-Benz E211 M272',
    'Двигатель Mercedes-Benz W163 M112',
    'Двигатель BMW E39 M54',
    'Двигатель BMW X3 N52',
    'Двигатель BMW E60 N62',
    'АКПП Mercedes-Benz E-Class 2009',
    'АКПП BMW 525i',
    'АКПП ZF 6HP26 BMW 550i',
  ],
  '/kuzovnye-detali-optika-mercedes-bmw-barnaul/': [
    'Комплект передних фар Mercedes-Benz W212',
    'Комплект ксеноновых фар Mercedes-Benz C-Class 2013',
    'Ксеноновая фара Mercedes-Benz E-Class 2007',
    'Комплект передних фар BMW 550i 2006',
    'Комплект задних фонарей Mercedes-Benz W207',
    'Комплект задних фонарей Mercedes-Benz W211',
    'Комплект задних фонарей BMW E60 550i',
    'Кузов Mercedes-Benz C-Class W204',
    'Передние пороги кузова Mercedes-Benz W203',
    'Пороги кузова в ассортименте',
    'Комплект сидений BMW 550i',
  ],
};
const catalogTitles = catalogManifest.categories.flatMap((category) => category.products.map((product) => product.title));
// Все страницы сразу: одна удаленная деталь может упоминаться на нескольких посадочных.
const staleMentions = Object.entries(landingCatalogMentions)
  .map(([landingPath, mentions]) => [landingPath, mentions.filter((mention) => !catalogTitles.some((title) => title.includes(mention)))])
  .filter(([, missing]) => missing.length)
  .map(([landingPath, missing]) => `${landingPath} — ${missing.join(', ')}`);
if (staleMentions.length) {
  throw new Error(
    `Тексты посадочных называют детали, которых больше нет в каталоге: ${staleMentions.join('; ')}. Поправьте тексты и landingCatalogMentions.`,
  );
}

// Фото блока «Уже заказали в Японии» лежат в public/assets/japan. Ссылка на отсутствующий файл дала бы
// пустую карточку на главной и на посадочной об авто из Японии.
const japanLandingHtml = await readFile(path.join(distDirectory, 'avtomobili-iz-yaponii-barnaul', 'index.html'), 'utf8');
const japanPhotos = new Set(
  [
    ...dataSource.matchAll(/asset\('(japan\/[\w-]+\.webp)'\)/g),
    ...japanLandingHtml.matchAll(/\/assets\/(japan\/[\w-]+\.webp)/g),
  ].map((match) => match[1]),
);
for (const photo of japanPhotos) {
  await access(path.join(distDirectory, 'assets', photo)).catch(() => {
    throw new Error(`Нет фото для блока «Уже заказали в Японии»: assets/${photo}`);
  });
}

// Все картинки главной из data.js должны быть в сборке. Генерируемые файлы (WebP, уменьшенные копии для телефона)
// в git не хранятся: если их перестанет создавать optimize-images.mjs, на сайте будет пустое место (02.11.2026).
for (const [, fileName] of dataSource.matchAll(/asset\('([\w./-]+)'\)/g)) {
  const builtName = fileName === 'telegram-avatar.jpg' ? fileName : fileName.replace(/\.(?:jpe?g|png)$/i, '.webp');
  await access(path.join(distDirectory, 'assets', builtName)).catch(() => {
    throw new Error(`В сборке нет картинки из data.js: assets/${builtName}`);
  });
}

// Редирект на https://mb-kuzbass.ru должен приходить из исходников, а не из ручной правки корня репозитория.
const htaccess = await readFile(path.join(distDirectory, '.htaccess'), 'utf8');
// На хостинге HTTPS принимает nginx, Apache видит http: проверка %{HTTPS} зацикливает каждую страницу (02.11.2026).
if (/RewriteCond\s+%\{HTTPS\}/.test(htaccess)) {
  throw new Error('.htaccess проверяет %{HTTPS}: на Спринтхосте это бесконечный редирект. Используйте %{HTTP:X-Forwarded-Proto}.');
}
if (!htaccess.includes('RewriteRule ^ https://mb-kuzbass.ru%{REQUEST_URI} [R=301,L,NE]')) {
  throw new Error('.htaccess в сборке не содержит редирект на https://mb-kuzbass.ru.');
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
