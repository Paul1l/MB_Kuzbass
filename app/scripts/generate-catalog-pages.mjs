import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  catalogRoot,
  categoryPath,
  categoryTransitionName,
  productPath,
  productTransitionName,
} from '../src/catalogPaths.js';
import { contactButtons, escapeHtml, mobileBar } from './static-contact.mjs';

// Создает в dist статические страницы каталога, которые видят поисковики: /katalog/, шесть разделов
// и страницу на каждую деталь из catalog-products.json, и дописывает их в dist/sitemap.xml. Еще вставляет
// карточки деталей в блок «Примеры со склада» на четырех посадочных (landingExamples ниже).
// На главной каталог открывается внутри SPA и поисковикам не виден — эти страницы закрывают пробел.
// Оформление — общее с посадочными (public/seo-pages.css), согласие на cookie и Яндекс Метрика — тоже
// (public/seo-pages.js). Данные компании, шапка, подвал с реквизитами и ссылками на документы и версии стилей и
// скрипта берутся из посадочной страницы, чтобы не держать их в двух местах. Контакты — scripts/static-contact.mjs.

const distDirectory = path.resolve('dist');
const siteUrl = 'https://mb-kuzbass.ru/';
// Дата изменения страниц каталога для sitemap.xml. Обновлять при изменении catalog-products.json.
const catalogUpdatedAt = '2026-11-02';

// Заголовки разделов под поисковые запросы; описание раздела — из catalog-products.json.
const categoryHeadings = {
  engines: 'Контрактные двигатели Mercedes-Benz и BMW',
  transmission: 'Контрактные АКПП Mercedes-Benz и BMW',
  chassis: 'Диски, подвеска и тормоза Mercedes-Benz и BMW',
  body: 'Кузова и кузовные детали Mercedes-Benz и BMW',
  optics: 'Фары и фонари Mercedes-Benz и BMW',
  interior: 'Сиденья и салон Mercedes-Benz и BMW',
};

// Те же шаги, что в блоке «Как купить деталь» на главной (src/data.js, purchaseSteps).
const purchaseSteps = [
  ['Пришлите VIN или фото', 'VIN, модель и год или фото старой детали — в Telegram, WhatsApp или по телефону.'],
  ['Проверим совместимость', 'Сверяем по VIN и маркировкам, чтобы деталь подошла без лишних переделок.'],
  ['Покажем товар', 'Фото и видео конкретной детали: состояние, маркировки, крепления, заметные дефекты.'],
  ['Отправим или выдадим', 'Транспортной компанией по России или самовывоз со склада в Барнауле.'],
];

const landingLinks = [
  ['/kontraktnye-zapchasti-barnaul/', 'Что такое контрактные запчасти и как их проверить'],
  ['/zapchasti-mercedes-barnaul/', 'Запчасти Mercedes-Benz'],
  ['/zapchasti-bmw-barnaul/', 'Запчасти BMW'],
  ['/dvigateli-akpp-mercedes-bmw-barnaul/', 'Двигатели и АКПП'],
  ['/kuzovnye-detali-optika-mercedes-bmw-barnaul/', 'Кузовные детали и оптика'],
  ['/avtomobili-iz-yaponii-barnaul/', 'Автомобили из Японии под заказ'],
  ['/postavki-dlya-avtorazborov-barnaul/', 'Поставки для авторазборов'],
];

const plural = (count, one, few, many) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

// Данные компании для JSON-LD и версия стилей — из посадочной страницы.
const referenceLanding = await readFile(path.join(distDirectory, 'zapchasti-mercedes-barnaul', 'index.html'), 'utf8');
const stylesheetHref = referenceLanding.match(/href="(\/seo-pages\.css\?v=[^"]+)"/)?.[1];
const pageScriptSrc = referenceLanding.match(/src="(\/seo-pages\.js\?v=[^"]+)"/)?.[1];
const referenceJsonLd = referenceLanding.match(/<script type="application\/ld\+json">(.+?)<\/script>/s)?.[1];
const footerHtml = referenceLanding.replace(/\r\n/g, '\n').match(/<footer class="seo-footer">[\s\S]*?<\/footer>/)?.[0];
const headerHtml = referenceLanding.replace(/\r\n/g, '\n').match(/<header class="seo-header">[\s\S]*?<\/header>/)?.[0];
const business = JSON.parse(referenceJsonLd || '{}')['@graph']?.find((node) => node['@type'] === 'AutoPartsStore');
if (!stylesheetHref || !pageScriptSrc || !business || !footerHtml || !headerHtml) {
  throw new Error('Не удалось взять версию seo-pages.css, seo-pages.js, подвал или данные компании из посадочной zapchasti-mercedes-barnaul.');
}

const catalogData = JSON.parse(await readFile(path.resolve('catalog-products.json'), 'utf8'));

// Размеры фото нужны в разметке, чтобы страница не прыгала при загрузке.
async function imageInfo(categorySlug, fileName) {
  const filePath = path.join(distDirectory, 'assets', 'catalog', categorySlug, fileName);
  try {
    await access(filePath);
  } catch {
    throw new Error(`Нет фото каталога в сборке: assets/catalog/${categorySlug}/${fileName}`);
  }
  const { width, height } = await sharp(filePath).metadata();
  return { src: `/assets/catalog/${categorySlug}/${fileName}`, width, height };
}

const categories = [];
for (const category of catalogData.categories) {
  const products = [];
  for (const product of category.products) {
    products.push({
      ...product,
      path: `/${productPath(category.slug, product.title)}`,
      transitionName: productTransitionName(category.slug, product.title),
      images: await Promise.all(product.images.map((fileName) => imageInfo(category.slug, fileName))),
    });
  }
  categories.push({
    ...category,
    heading: categoryHeadings[category.slug] || category.label,
    path: `/${categoryPath(category.slug)}`,
    transitionName: categoryTransitionName(category.slug),
    products,
  });
}

const productPaths = categories.flatMap((category) => category.products.map((product) => product.path));
if (new Set(productPaths).size !== productPaths.length) {
  throw new Error('У двух деталей каталога совпал адрес страницы: переименуйте одну из них в catalog-products.json.');
}

const image = (info, alt, attributes = '') =>
  `<img src="${info.src}" alt="${escapeHtml(alt)}" width="${info.width}" height="${info.height}"${attributes} />`;

// Атрибут для плавного перехода: то же имя стоит у фото на главной и на карточках (src/catalogPaths.js).
const transition = (name) => ` style="view-transition-name: ${name}; view-transition-class: photo"`;

function breadcrumbs(items) {
  const links = items
    .map(([href, label], index) =>
      index === items.length - 1
        ? `<li aria-current="page">${escapeHtml(label)}</li>`
        : `<li><a href="${href}">${escapeHtml(label)}</a></li>`,
    )
    .join('');
  return `<nav class="seo-breadcrumbs" aria-label="Навигация по разделам"><ol>${links}</ol></nav>`;
}

function productCard(product, categoryLabel) {
  const [cover] = product.images;
  return `<a class="seo-card" href="${product.path}">
            ${image(cover, `${product.title} — фото товара MB Kuzbass`, ` loading="lazy" decoding="async"${transition(product.transitionName)}`)}
            <span class="seo-card__body"><small>${escapeHtml(product.meta || categoryLabel)}</small><strong>${escapeHtml(product.title)}</strong><span>Цена по запросу →</span></span>
          </a>`;
}

const stepsSection = `<section class="seo-section">
          <h2>Как купить деталь</h2>
          <ol class="seo-steps">${purchaseSteps
            .map(([title, text]) => `<li><strong>${title}</strong><span>${text}</span></li>`)
            .join('')}</ol>
        </section>`;

function relatedNav(currentPath) {
  const categoryLinks = categories
    .filter((category) => category.path !== currentPath)
    .map((category) => `<a href="${category.path}">${escapeHtml(category.heading)}</a>`)
    .join('\n          ');
  const otherLinks = landingLinks.map(([href, label]) => `<a href="${href}">${label}</a>`).join('\n          ');
  return `<nav class="seo-related" aria-label="Другие разделы">
          <h2>Другие разделы</h2>
          ${currentPath === `/${catalogRoot}` ? '' : `<a href="/${catalogRoot}">Весь каталог запчастей</a>\n          `}${categoryLinks}
          ${otherLinks}
          <a href="/">Вернуться на главную MB Kuzbass</a>
        </nav>`;
}

// analyticsPage — начало идентификатора цели в Метрике по кнопкам связи: product_telegram, catalog_phone и т. п.
function page({ pagePath, title, description, breadcrumbItems, ogImage, schemaType, analyticsPage, extraGraph = [], body }) {
  const url = new URL(pagePath, siteUrl).href;
  const graph = [
    business,
    {
      '@type': schemaType,
      '@id': `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: 'ru-RU',
      isPartOf: { '@id': business['@id'] },
      about: { '@id': business['@id'] },
      dateModified: catalogUpdatedAt,
      breadcrumb: { '@id': `${url}#breadcrumb` },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: breadcrumbItems.map(([href, label], index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: label,
        item: new URL(href, siteUrl).href,
      })),
    },
    ...extraGraph,
  ];
  const generalTopic = 'Нужна запчасть.';

  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="geo.region" content="RU-ALT" />
    <meta name="geo.placename" content="Барнаул" />
    <link rel="canonical" href="${url}" />
    <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
    <link rel="stylesheet" href="${stylesheetHref}" />
    <script src="/analytics-config.js" defer></script>
    <script src="${pageScriptSrc}" data-page="${analyticsPage}" defer></script>
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="og:site_name" content="${escapeHtml(business.name)}" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${new URL(ogImage, siteUrl).href}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })}</script>
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    ${headerHtml}

    <main>
      ${breadcrumbs(breadcrumbItems)}
      ${body}
    </main>

    ${footerHtml}

    ${mobileBar(generalTopic)}
  </body>
</html>
`;
}

async function writePage(pagePath, html) {
  const directory = path.join(distDirectory, ...pagePath.split('/').filter(Boolean));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html);
}

const catalogPath = `/${catalogRoot}`;
const homeCrumb = ['/', 'Главная'];
const catalogCrumb = [catalogPath, 'Каталог запчастей'];
const vinTopic = 'Нужна запчасть. VIN или модель автомобиля:';

// Общая страница каталога: шесть разделов с фото.
const totalProducts = categories.reduce((sum, category) => sum + category.products.length, 0);
await writePage(
  catalogPath,
  page({
    pagePath: catalogPath,
    title: 'Каталог контрактных запчастей Mercedes-Benz и BMW — MB Kuzbass, Барнаул',
    description:
      'Контрактные запчасти Mercedes-Benz и BMW с японских доноров: двигатели, АКПП, оптика, кузов, подвеска, салон. Фото со склада в Барнауле, отправка по России.',
    breadcrumbItems: [homeCrumb, catalogCrumb],
    ogImage: categories[0].products[0].images[0].src,
    schemaType: 'CollectionPage',
    analyticsPage: 'catalog',
    body: `<section class="seo-hero seo-hero--compact">
        <div>
          <p class="seo-eyebrow">Каталог запчастей</p>
          <h1>Каталог контрактных запчастей Mercedes-Benz и BMW</h1>
          <p class="seo-lead">Оригинальные детали с японских автомобилей-доноров: ${totalProducts} ${plural(totalProducts, 'позиция', 'позиции', 'позиций')} с фото со склада в Барнауле. Наличие меняется каждый день — пришлите VIN, скажем, что есть сейчас и сколько стоит.</p>
          ${contactButtons(vinTopic, 'Подобрать по VIN в Telegram')}
        </div>
      </section>

      <div class="seo-content seo-content--wide">
        <section class="seo-section">
          <h2>Разделы каталога</h2>
          <div class="seo-grid">
          ${categories
            .map(
              (category) => `<a class="seo-card" href="${category.path}">
            ${image(category.products[0].images[0], `${category.heading} — фото со склада MB Kuzbass`, ` loading="lazy" decoding="async"${transition(category.transitionName)}`)}
            <span class="seo-card__body"><small>${category.products.length} ${plural(category.products.length, 'позиция', 'позиции', 'позиций')} с фото</small><strong>${escapeHtml(category.heading)}</strong><span>Открыть раздел →</span></span>
          </a>`,
            )
            .join('\n          ')}
          </div>
        </section>
        ${stepsSection}
        ${relatedNav(catalogPath)}
      </div>`,
  }),
);

for (const category of categories) {
  const categoryCrumb = [category.path, category.heading];
  await writePage(
    category.path,
    page({
      pagePath: category.path,
      title: `${category.heading} — Барнаул, отправка по России | MB Kuzbass`,
      description: `${category.description} Барнаул, отправка по России.`,
      breadcrumbItems: [homeCrumb, catalogCrumb, categoryCrumb],
      ogImage: category.products[0].images[0].src,
      schemaType: 'CollectionPage',
      analyticsPage: 'catalog',
      extraGraph: [
        {
          '@type': 'ItemList',
          '@id': `${new URL(category.path, siteUrl).href}#items`,
          itemListElement: category.products.map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: product.title,
            url: new URL(product.path, siteUrl).href,
          })),
        },
      ],
      body: `<section class="seo-hero">
        <div>
          <p class="seo-eyebrow">${escapeHtml(category.label)}</p>
          <h1>${escapeHtml(category.heading)}</h1>
          <p class="seo-lead">${escapeHtml(category.description)} Склад в Барнауле, отправка транспортными компаниями по России.</p>
          ${contactButtons(`Нужна деталь из раздела «${category.label}». VIN или модель:`, 'Подобрать по VIN в Telegram')}
        </div>
        ${image(category.products[0].images[0], `${category.products[0].title} — фото товара MB Kuzbass`, transition(category.transitionName))}
      </section>

      <div class="seo-content seo-content--wide">
        <section class="seo-section">
          <h2>Примеры со склада — ${category.products.length} ${plural(category.products.length, 'позиция', 'позиции', 'позиций')}</h2>
          <p>На фото — реальные детали со склада MB Kuzbass. Наличие меняется каждый день: цену и наличие подтверждаем при обращении. Если нужной позиции нет, проверим под заказ.</p>
          <div class="seo-grid">
          ${category.products.map((product) => productCard(product, category.label)).join('\n          ')}
          </div>
        </section>
        ${stepsSection}
        ${relatedNav(category.path)}
      </div>`,
    }),
  );

  for (const product of category.products) {
    const others = category.products.filter((other) => other !== product);
    const [mainImage, ...moreImages] = product.images;
    const topic = `Интересует: ${product.title}. Есть в наличии?`;
    await writePage(
      product.path,
      page({
        pagePath: product.path,
        title: `${product.title} — б/у с японского донора, Барнаул | MB Kuzbass`,
        description: `${product.title}: оригинальная деталь с японского автомобиля-донора. ${product.description} Барнаул, отправка по России.`,
        breadcrumbItems: [homeCrumb, catalogCrumb, categoryCrumb, [product.path, product.title]],
        ogImage: mainImage.src,
        schemaType: 'ItemPage',
        analyticsPage: 'product',
        body: `<section class="seo-product">
        <div class="seo-product__gallery">
          ${image(mainImage, `${product.title} — фото товара MB Kuzbass`, transition(product.transitionName))}
          ${moreImages.map((info, index) => image(info, `${product.title} — ракурс ${index + 2}`, ' loading="lazy" decoding="async"')).join('\n          ')}
        </div>
        <div class="seo-product__info">
          <p class="seo-eyebrow">${escapeHtml(product.meta || category.label)}</p>
          <h1>${escapeHtml(product.title)}</h1>
          <p class="seo-lead">${escapeHtml(product.description)}</p>
          <p class="seo-price">Цена и наличие — по запросу</p>
          ${contactButtons(topic, 'Узнать цену и наличие')}
          <ul class="seo-facts">
            <li>Оригинальная деталь с японского автомобиля-донора</li>
            <li>Проверка совместимости по VIN до оплаты</li>
            <li>Фото и видео конкретной детали до сделки</li>
            <li>Склад в Барнауле, отправка по России</li>
          </ul>
        </div>
      </section>

      <div class="seo-content seo-content--wide">
        ${stepsSection}
        ${
          others.length
            ? `<section class="seo-section">
          <h2>Ещё в разделе «${escapeHtml(category.label)}»</h2>
          <div class="seo-grid">
          ${others.map((other) => productCard(other, category.label)).join('\n          ')}
          </div>
        </section>`
            : ''
        }
        ${relatedNav(product.path)}
      </div>`,
      }),
    );
  }
}

// Блок «Примеры со склада» на посадочных: метка <!-- catalog-examples --> в public/<адрес>/index.html заменяется
// карточками деталей из catalog-products.json, поэтому примеры на посадочных всегда совпадают с каталогом
// (удалили деталь из каталога — пропала и карточка, битой ссылки не будет). brand — только детали этой марки,
// categories — только эти разделы; детали берутся по очереди из каждого раздела, чтобы примеры были разными.
const landingExamples = {
  'zapchasti-mercedes-barnaul': { brand: 'Mercedes-Benz', limit: 8 },
  'kontraktnye-zapchasti-barnaul': { limit: 6 },
  'dvigateli-akpp-mercedes-bmw-barnaul': { categories: ['engines', 'transmission'] },
  'kuzovnye-detali-optika-mercedes-bmw-barnaul': { categories: ['body', 'optics', 'interior'], limit: 8 },
};
const examplesMarker = '<!-- catalog-examples -->';

function pickExamples({ brand, categories: categorySlugs, limit = Infinity }) {
  const queues = categories
    .filter((category) => !categorySlugs || categorySlugs.includes(category.slug))
    .map((category) => ({
      label: category.label,
      products: category.products.filter((product) => !brand || product.title.includes(brand)),
    }))
    .filter((queue) => queue.products.length);
  const longest = Math.max(0, ...queues.map((queue) => queue.products.length));
  const picked = [];
  for (let round = 0; round < longest; round += 1) {
    for (const queue of queues) {
      if (queue.products[round] && picked.length < limit) picked.push(productCard(queue.products[round], queue.label));
    }
  }
  return picked;
}

for (const [slug, options] of Object.entries(landingExamples)) {
  const landingPath = path.join(distDirectory, slug, 'index.html');
  const landingHtml = await readFile(landingPath, 'utf8');
  const cards = pickExamples(options);
  if (!landingHtml.includes(examplesMarker)) {
    throw new Error(`/${slug}/: нет метки ${examplesMarker} для блока «Примеры со склада».`);
  }
  if (!cards.length) throw new Error(`/${slug}/: в каталоге нет деталей для блока «Примеры со склада».`);
  await writeFile(
    landingPath,
    landingHtml.replace(
      examplesMarker,
      `<div class="seo-grid">
          ${cards.join('\n          ')}
          </div>`,
    ),
  );
}

// Страницы каталога дописываются в sitemap.xml сборки.
const sitemapPath = path.join(distDirectory, 'sitemap.xml');
const sitemap = await readFile(sitemapPath, 'utf8');
const catalogUrls = [
  [catalogPath, '0.8'],
  ...categories.map((category) => [category.path, '0.8']),
  ...productPaths.map((productUrl) => [productUrl, '0.6']),
];
const sitemapEntries = catalogUrls
  .map(
    ([pagePath, priority]) => `  <url>
    <loc>${new URL(pagePath, siteUrl).href}</loc>
    <lastmod>${catalogUpdatedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join('\n');
await writeFile(sitemapPath, sitemap.replace('</urlset>', `${sitemapEntries}\n</urlset>`));

console.log(`Страницы каталога: 1 общая, ${categories.length} разделов, ${productPaths.length} деталей.`);
