import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { articles as allArticles } from '../src/articles.js';
import { articleLinks, articleRoot, maxArticlesPerPage } from '../src/articleLinks.js';
import { contactButtons, escapeHtml, mobileBar } from './static-contact.mjs';

// Создаёт в dist раздел «Статьи»: список /stati/ и страницу на каждую статью из src/articles.js, дописывает их в
// dist/sitemap.xml и вставляет блок «Полезные статьи» перед подвалом посадочных и страниц каталога (карта —
// src/articleLinks.js и поле linkFrom статьи). Шапка, подвал и версии стилей и скрипта — из посадочной страницы,
// как у каталога и документов. Запускается после generate-catalog-pages.mjs: блок вставляется и в страницы каталога.
//
// Черновики (draft: true) собираются только с ARTICLES_DRAFTS=1 — чтобы посмотреть шаблон. Они закрыты от индекса,
// не попадают в sitemap.xml, а обычная сборка с ними останавливается (verify-build.mjs).

const distDirectory = path.resolve('dist');
const siteUrl = 'https://mb-kuzbass.ru/';
const includeDrafts = process.env.ARTICLES_DRAFTS === '1';
const listPath = `/${articleRoot}`;
const organization = { '@type': 'Organization', name: 'MB Kuzbass', url: siteUrl, logo: `${siteUrl}assets/telegram-avatar.jpg` };
const generalTopic = 'Нужна запчасть.';

// Проверяет данные статей до сборки: ошибку в файле автора лучше увидеть сразу, чем на сайте.
function validate(article, index) {
  const where = `src/articles.js, статья ${index + 1} (${article.slug || 'без slug'})`;
  const required = ['slug', 'title', 'description', 'h1', 'datePublished', 'dateModified', 'lead', 'sections', 'related'];
  const missing = required.filter((key) => article[key] === undefined || article[key] === '');
  if (missing.length) throw new Error(`${where}: нет полей ${missing.join(', ')}.`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) throw new Error(`${where}: slug только из латиницы, цифр и дефисов.`);
  if (article.title.length > 65) throw new Error(`${where}: title длиннее 65 знаков (${article.title.length}).`);
  for (const key of ['datePublished', 'dateModified']) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(article[key]) || Number.isNaN(Date.parse(article[key]))) {
      throw new Error(`${where}: ${key} должна быть датой ГГГГ-ММ-ДД.`);
    }
  }
  if (article.dateModified < article.datePublished) throw new Error(`${where}: dateModified раньше datePublished.`);
  if (!Array.isArray(article.sections) || !article.sections.length) throw new Error(`${where}: нет разделов.`);
  for (const section of article.sections) {
    if (!section.heading || !Array.isArray(section.blocks) || !section.blocks.length) {
      throw new Error(`${where}: у раздела нет заголовка или текста.`);
    }
    for (const block of section.blocks) {
      if (block.type === 'p' && typeof block.text === 'string' && block.text) continue;
      if ((block.type === 'ul' || block.type === 'ol') && Array.isArray(block.items) && block.items.length) continue;
      throw new Error(`${where}, раздел «${section.heading}»: блок должен быть p с text или ul/ol с items.`);
    }
  }
  const faq = article.faq || [];
  if (!Array.isArray(faq) || faq.length > 4 || faq.some((item) => !item.q || !item.a)) {
    throw new Error(`${where}: faq — от 0 до 4 пар { q, a }.`);
  }
  if (!Array.isArray(article.related) || article.related.some((item) => !item.href?.startsWith('/') || !item.label)) {
    throw new Error(`${where}: related — список { href: '/адрес/', label }.`);
  }
}

allArticles.forEach(validate);
const slugs = allArticles.map((article) => article.slug);
if (new Set(slugs).size !== slugs.length) throw new Error('src/articles.js: у двух статей одинаковый slug.');

const articles = allArticles
  .filter((article) => includeDrafts || !article.draft)
  .sort((a, b) => b.datePublished.localeCompare(a.datePublished) || a.slug.localeCompare(b.slug));
const articlePath = (article) => `/${articleRoot}${article.slug}/`;

// Ссылка внутри текста — [текст](/адрес/) на страницу этого сайта. Остальное, включая внешние адреса и HTML,
// выводится как текст.
const linkPattern = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
const isInternal = (href) => href.startsWith('/') && !href.startsWith('//');

function inline(text) {
  let html = '';
  let last = 0;
  for (const match of String(text).matchAll(linkPattern)) {
    const [whole, label, href] = match;
    html += escapeHtml(text.slice(last, match.index));
    html += isInternal(href) ? `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>` : escapeHtml(whole);
    last = match.index + whole.length;
  }
  return html + escapeHtml(String(text).slice(last));
}

// Тот же текст без разметки ссылок — для разметки FAQPage: она должна совпадать с видимым текстом.
const plainText = (text) => String(text).replace(linkPattern, (whole, label, href) => (isInternal(href) ? label : whole));

const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const formatDate = (iso) => {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} ${months[month - 1]} ${year}`;
};
const time = (iso) => `<time datetime="${iso}">${formatDate(iso)}</time>`;

// Шапка, подвал и версии стилей и скрипта — из посадочной, как у каталога и документов.
const referenceLanding = (
  await readFile(path.join(distDirectory, 'zapchasti-mercedes-barnaul', 'index.html'), 'utf8')
).replace(/\r\n/g, '\n');
const stylesheetHref = referenceLanding.match(/href="(\/seo-pages\.css\?v=[^"]+)"/)?.[1];
const pageScriptSrc = referenceLanding.match(/src="(\/seo-pages\.js\?v=[^"]+)"/)?.[1];
const headerHtml = referenceLanding.match(/<header class="seo-header">[\s\S]*?<\/header>/)?.[0];
const footerHtml = referenceLanding.match(/<footer class="seo-footer">[\s\S]*?<\/footer>/)?.[0];
if (!stylesheetHref || !pageScriptSrc || !headerHtml || !footerHtml) {
  throw new Error('Не удалось взять версии стилей и скрипта, шапку или подвал из посадочной zapchasti-mercedes-barnaul.');
}

function breadcrumbs(items) {
  const links = items
    .map(([href, label], index) =>
      index === items.length - 1 ? `<li aria-current="page">${escapeHtml(label)}</li>` : `<li><a href="${href}">${escapeHtml(label)}</a></li>`,
    )
    .join('');
  return `<nav class="seo-breadcrumbs" aria-label="Навигация по разделам"><ol>${links}</ol></nav>`;
}

const breadcrumbList = (url, items) => ({
  '@type': 'BreadcrumbList',
  '@id': `${url}#breadcrumb`,
  itemListElement: items.map(([href, label], index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: label,
    item: new URL(href, siteUrl).href,
  })),
});

// Разметка для поисковиков. «<» заменяется JSON-последовательностью \u003c: текст статьи не сможет закрыть тег <script>.
const jsonLd = (graph) => JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');

function page({ pagePath, title, description, ogType, extraMeta = '', graph, robots, body, draft }) {
  const url = new URL(pagePath, siteUrl).href;
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="${robots}" />
    <meta name="description" content="${escapeHtml(description)}" />
    <link rel="canonical" href="${url}" />
    <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
    <link rel="stylesheet" href="${stylesheetHref}" />
    <script src="/analytics-config.js" defer></script>
    <script src="${pageScriptSrc}" data-page="article" defer></script>
    <meta property="og:type" content="${ogType}" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="og:site_name" content="МБ Кузбасс / MB Kuzbass" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${organization.logo}" />${extraMeta}
    <meta name="twitter:card" content="summary" />
    <script type="application/ld+json">${jsonLd(graph)}</script>
    <title>${escapeHtml(title)}</title>
  </head>
  <body${draft ? ' data-article-draft' : ''}>
    ${headerHtml}

    <main>
      ${body}
    </main>

    ${footerHtml}

    ${mobileBar(generalTopic)}
  </body>
</html>
`;
}

function block(item) {
  if (item.type === 'p') return `<p>${inline(item.text)}</p>`;
  const tag = item.type;
  return `<${tag}>${item.items.map((entry) => `<li>${inline(entry)}</li>`).join('')}</${tag}>`;
}

const dates = (article) =>
  `<p class="seo-article__dates">Опубликовано ${time(article.datePublished)}${
    article.dateModified !== article.datePublished ? ` · Обновлено ${time(article.dateModified)}` : ''
  }</p>`;

function articlePage(article) {
  const pagePath = articlePath(article);
  const url = new URL(pagePath, siteUrl).href;
  const crumbs = [['/', 'Главная'], [listPath, 'Статьи'], [pagePath, article.h1]];
  const faq = article.faq || [];
  const graph = [
    {
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: article.h1,
      description: article.description,
      datePublished: article.datePublished,
      dateModified: article.dateModified,
      inLanguage: 'ru-RU',
      image: organization.logo,
      author: organization,
      publisher: organization,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    },
    breadcrumbList(url, crumbs),
    ...(faq.length
      ? [
          {
            '@type': 'FAQPage',
            '@id': `${url}#faq`,
            mainEntity: faq.map((item) => ({
              '@type': 'Question',
              name: plainText(item.q),
              acceptedAnswer: { '@type': 'Answer', text: plainText(item.a) },
            })),
          },
        ]
      : []),
  ];
  const sections = article.sections
    .map(
      (section) => `<section>
            <h2>${inline(section.heading)}</h2>
            ${section.blocks.map(block).join('\n            ')}
          </section>`,
    )
    .join('\n          ');
  const faqHtml = faq.length
    ? `<section class="seo-section seo-faq" aria-labelledby="article-faq-title">
          <h2 id="article-faq-title">Частые вопросы</h2>
          ${faq.map((item) => `<div class="seo-faq__item"><h3>${inline(item.q)}</h3><p>${inline(item.a)}</p></div>`).join('\n          ')}
        </section>`
    : '';
  const related = article.related.length
    ? `<nav class="seo-related" aria-label="Читайте также">
          <h2>Читайте также</h2>
          ${article.related.map((item) => `<a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a>`).join('\n          ')}
        </nav>`
    : '';

  return page({
    pagePath,
    title: `${article.title} | MB Kuzbass`,
    description: article.description,
    ogType: 'article',
    extraMeta: `
    <meta property="article:published_time" content="${article.datePublished}" />
    <meta property="article:modified_time" content="${article.dateModified}" />`,
    graph,
    robots: article.draft ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    draft: article.draft,
    body: `${breadcrumbs(crumbs)}
      <div class="seo-content">
        <article class="seo-section seo-article">
          <p class="seo-eyebrow">Статья</p>
          <h1>${escapeHtml(article.h1)}</h1>
          ${dates(article)}
          <p class="seo-lead">${inline(article.lead)}</p>
          ${sections}
        </article>
        ${faqHtml}
        <section class="seo-section seo-contact-cta" aria-labelledby="article-cta-title">
          <h2 id="article-cta-title">Подберём деталь или авто под заказ</h2>
          <p>Пришлите VIN, модель или фото детали — проверим совместимость, покажем фото и видео и назовём цену. Склад в Барнауле, отправка по России.</p>
          ${contactButtons(`Пишу по статье «${article.h1}».`, 'Написать в Telegram')}
        </section>
        ${related}
      </div>`,
  });
}

function listPage() {
  const url = new URL(listPath, siteUrl).href;
  const crumbs = [['/', 'Главная'], [listPath, 'Статьи']];
  const title = 'Статьи о контрактных запчастях и авто из Японии | MB Kuzbass';
  const description =
    'Статьи MB Kuzbass: контрактные двигатели и АКПП Mercedes-Benz и BMW, подбор запчастей по VIN, проверка агрегатов, авто из Японии под заказ.';
  const cards = articles
    .map(
      (article) => `<a class="seo-article-card" href="${articlePath(article)}">
            <small>${time(article.datePublished)}</small>
            <strong>${escapeHtml(article.h1)}</strong>
            <span>${escapeHtml(article.description)}</span>
          </a>`,
    )
    .join('\n          ');
  return page({
    pagePath: listPath,
    title,
    description,
    ogType: 'website',
    graph: [
      { '@type': 'CollectionPage', '@id': `${url}#webpage`, url, name: title, description, inLanguage: 'ru-RU', publisher: organization },
      breadcrumbList(url, crumbs),
      {
        '@type': 'ItemList',
        '@id': `${url}#items`,
        itemListElement: articles.map((article, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: article.h1,
          url: new URL(articlePath(article), siteUrl).href,
        })),
      },
    ],
    robots: 'index, follow, max-image-preview:large',
    body: `${breadcrumbs(crumbs)}
      <section class="seo-hero seo-hero--compact">
        <div>
          <p class="seo-eyebrow">Статьи</p>
          <h1>Статьи о контрактных запчастях и авто из Японии</h1>
          <p class="seo-lead">Как устроены контрактные запчасти, как подобрать деталь по VIN и проверить агрегат, как проходит покупка автомобиля с аукциона Японии.</p>
        </div>
      </section>
      <div class="seo-content">
        <section class="seo-section" aria-label="Список статей">
          <div class="seo-article-list">
          ${cards || '<p>Статьи скоро появятся.</p>'}
          </div>
        </section>
      </div>`,
  });
}

async function writePage(pagePath, html) {
  const directory = path.join(distDirectory, ...pagePath.split('/').filter(Boolean));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html);
}

await writePage(listPath, listPage());
for (const article of articles) await writePage(articlePath(article), articlePage(article));

// Блок «Полезные статьи» перед подвалом посадочных и страниц каталога: из карты src/articleLinks.js и поля linkFrom.
const placements = new Map(Object.entries(articleLinks).map(([pagePath, list]) => [pagePath, [...list]]));
for (const article of allArticles) {
  for (const pagePath of article.linkFrom || []) placements.set(pagePath, [...(placements.get(pagePath) || []), article.slug]);
}
const bySlug = new Map(articles.map((article) => [article.slug, article]));
let pagesWithBlock = 0;
for (const [pagePath, list] of placements) {
  const chosen = [...new Set(list)].map((slug) => bySlug.get(slug)).filter(Boolean).slice(0, maxArticlesPerPage);
  if (!chosen.length) continue;
  const filePath = path.join(distDirectory, ...pagePath.split('/').filter(Boolean), 'index.html');
  const html = await readFile(filePath, 'utf8').catch(() => {
    throw new Error(`src/articleLinks.js: страницы ${pagePath} нет в сборке.`);
  });
  const usefulBlock = `<section class="seo-useful" aria-labelledby="useful-articles-title">
        <h2 id="useful-articles-title">Полезные статьи</h2>
        <div class="seo-article-list">
          ${chosen
            .map(
              (article) => `<a class="seo-article-card" href="${articlePath(article)}">
            <strong>${escapeHtml(article.h1)}</strong>
            <span>${escapeHtml(article.description)}</span>
          </a>`,
            )
            .join('\n          ')}
        </div>
      </section>
    `;
  const mainEnd = html.lastIndexOf('</main>');
  if (mainEnd === -1 || html.includes('seo-useful')) throw new Error(`${pagePath}: нет </main> или блок статей уже вставлен.`);
  await writeFile(filePath, `${html.slice(0, mainEnd)}  ${usefulBlock}${html.slice(mainEnd)}`);
  pagesWithBlock += 1;
}

// В sitemap.xml — список и опубликованные статьи; дата изменения — dateModified статьи. Черновиков там нет никогда.
const published = articles.filter((article) => !article.draft);
const sitemapPath = path.join(distDirectory, 'sitemap.xml');
const sitemap = await readFile(sitemapPath, 'utf8');
const sitemapEntries = [
  ...(published.length ? [[listPath, published.map((article) => article.dateModified).sort().at(-1), '0.6']] : []),
  ...published.map((article) => [articlePath(article), article.dateModified, '0.6']),
]
  .map(
    ([pagePath, lastmod, priority]) => `  <url>
    <loc>${new URL(pagePath, siteUrl).href}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`,
  )
  .join('\n');
if (sitemapEntries) await writeFile(sitemapPath, sitemap.replace('</urlset>', `${sitemapEntries}\n</urlset>`));

console.log(
  `Статьи: ${articles.length} (опубликованных ${published.length}${includeDrafts ? ', черновики включены' : ''}), блок «Полезные статьи» на ${pagesWithBlock} страницах.`,
);
