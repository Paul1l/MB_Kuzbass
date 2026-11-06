import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { legalDocPath } from '../src/legalPaths.js';

// Создаёт в dist страницы юридических документов /dokumenty/<документ>/ — политика, согласие, cookie, соглашение,
// условия заказа, реквизиты. Тексты — те же legalDocs из src/data.js, что открываются окном на главной: их берёт
// серверная сборка dist-ssr (см. prerender-home.mjs), поэтому формулировки нигде не дублируются. Страницы — обычный
// HTML: документы открываются и без JavaScript, и по ссылкам с посадочных и каталога.
// Шапка, подвал и версии стилей и скрипта — из посадочной страницы, как у страниц каталога.

process.env.NODE_ENV = 'production';

const distDirectory = path.resolve('dist');
const ssrDirectory = path.resolve('dist-ssr');
const siteUrl = 'https://mb-kuzbass.ru/';

const { contact, createMessengerUrl, legalDocs, site } = await import(
  pathToFileURL(path.join(ssrDirectory, 'entry-server.js')).href
);

const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

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

const generalTopic = 'Нужна запчасть.';

function page(doc) {
  const pagePath = `/${legalDocPath(doc.id)}`;
  const url = new URL(pagePath, siteUrl).href;
  const title = `${doc.title} — ${site.shortName}`;
  const sections = doc.sections
    .map(
      (section) => `<section>
            <h2>${escapeHtml(section.heading)}</h2>
            <p>${escapeHtml(section.text)}</p>
          </section>`,
    )
    .join('\n          ');
  const otherDocs = legalDocs
    .filter((other) => other.id !== doc.id)
    .map((other) => `<a href="/${legalDocPath(other.id)}">${escapeHtml(other.title)}</a>`)
    .join('\n          ');

  // Документы нужны посетителю, а не поиску: в sitemap их нет, в выдачу не просятся (noindex), ссылки индексируются.
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, follow" />
    <meta name="description" content="${escapeHtml(doc.lead)}" />
    <link rel="canonical" href="${url}" />
    <link rel="icon" href="/favicon-96x96.png" type="image/png" sizes="96x96" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
    <link rel="stylesheet" href="${stylesheetHref}" />
    <script src="/analytics-config.js" defer></script>
    <script src="${pageScriptSrc}" data-page="document" defer></script>
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    ${headerHtml}

    <main>
      <nav class="seo-breadcrumbs" aria-label="Навигация по разделам"><ol><li><a href="/">Главная</a></li><li aria-current="page">${escapeHtml(doc.title)}</li></ol></nav>
      <section class="seo-hero seo-hero--compact">
        <div>
          <p class="seo-eyebrow">Правовая информация</p>
          <h1>${escapeHtml(doc.title)}</h1>
          <p class="seo-lead">${escapeHtml(doc.lead)}</p>
        </div>
      </section>

      <div class="seo-content">
        <article class="seo-section seo-legal">
          ${sections}
        </article>
        <nav class="seo-related" aria-label="Другие документы">
          <h2>Другие документы</h2>
          ${otherDocs}
          <a href="/">Вернуться на главную MB Kuzbass</a>
        </nav>
      </div>
    </main>

    ${footerHtml}

    <nav class="seo-mobile-bar" aria-label="Быстрая связь">
      <a class="seo-mobile-bar__phone" href="${contact.phoneHref}">Позвонить</a>
      <a href="${escapeHtml(createMessengerUrl(contact.telegram, generalTopic))}">Telegram</a>
      <a href="${escapeHtml(createMessengerUrl(contact.whatsapp, generalTopic))}">WhatsApp</a>
    </nav>
  </body>
</html>
`;
}

for (const doc of legalDocs) {
  const directory = path.join(distDirectory, ...legalDocPath(doc.id).split('/').filter(Boolean));
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), page(doc));
}
// Серверная сборка нужна только при сборке и на хостинг не идёт: это последний шаг, который её использует.
await rm(ssrDirectory, { recursive: true, force: true });

console.log(`Страницы документов: ${legalDocs.length} (/${legalDocPath(legalDocs[0].id).split('/')[0]}/…).`);
