import { readFileSync } from 'node:fs';
import { articles } from '../src/articles.js';
import { articleLinks } from '../src/articleLinks.js';
import { expect, hasHorizontalScroll, test } from './fixtures.js';

// Раздел «Статьи» (scripts/generate-article-pages.mjs): список /stati/ и страницы статей — обычный HTML.
// Черновики есть в сборке только с ARTICLES_DRAFTS=1 (проверка шаблона на заглушках), тогда и тесты их проверяют.

const built = articles.filter((article) => process.env.ARTICLES_DRAFTS === '1' || !article.draft);
const COUNTER_ID = Number(
  readFileSync(new URL('../public/analytics-config.js', import.meta.url), 'utf8').match(/counterId: (\d+)/)[1],
);
const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const humanDate = (iso) => {
  const [year, month, day] = iso.split('-').map(Number);
  return `${day} ${months[month - 1]} ${year}`;
};
// Видимый текст строки статьи: [текст](/адрес/) показывается как «текст».
const visible = (text) => text.replace(/\[([^\]\n]+)\]\((\/[^)\s]*)\)/g, (whole, label, href) => (href.startsWith('//') ? whole : label));

test('в сборке есть хотя бы одна статья', () => {
  expect(built.length).toBeGreaterThan(0);
});

test.describe('без JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('список /stati/: все статьи со ссылкой, заголовком, описанием и датой', async ({ page }) => {
    const response = await page.goto('./stati/');
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.seo-breadcrumbs li')).toHaveText(['Главная', 'Статьи']);
    const cards = page.locator('.seo-article-list .seo-article-card');
    await expect(cards).toHaveCount(built.length);
    for (const article of built) {
      const card = page.locator(`.seo-article-card[href="/stati/${article.slug}/"]`);
      await expect(card.locator('strong')).toHaveText(article.h1);
      await expect(card.locator('span')).toHaveText(article.description);
      await expect(card.locator('time')).toHaveAttribute('datetime', article.datePublished);
    }
    expect(await hasHorizontalScroll(page)).toBe(false);
  });

  for (const article of built) {
    test(`/stati/${article.slug}/: H1, крошки, даты, разделы, «Читайте также», FAQ = разметка FAQPage`, async ({ page }) => {
      const response = await page.goto(`./stati/${article.slug}/`);
      expect(response.status()).toBe(200);
      await expect(page.locator('h1')).toHaveText(article.h1);
      await expect(page.locator('.seo-breadcrumbs li')).toHaveText(['Главная', 'Статьи', article.h1]);
      await expect(page.locator('.seo-breadcrumbs a[href="/stati/"]')).toBeVisible();
      await expect(page.locator('.seo-article__dates time').first()).toHaveText(humanDate(article.datePublished));
      if (article.dateModified !== article.datePublished) {
        await expect(page.locator('.seo-article__dates time').nth(1)).toHaveText(humanDate(article.dateModified));
      }
      await expect(page.locator('.seo-article section h2')).toHaveText(article.sections.map((section) => visible(section.heading)));
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://mb-kuzbass.ru/stati/${article.slug}/`);

      const related = page.locator('nav[aria-label="Читайте также"] a');
      await expect(related).toHaveCount(article.related.length);
      for (const [index, item] of article.related.entries()) await expect(related.nth(index)).toHaveAttribute('href', item.href);

      const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
      const articleNode = graph.find((node) => node['@type'] === 'Article');
      expect(articleNode).toMatchObject({
        headline: article.h1,
        datePublished: article.datePublished,
        dateModified: article.dateModified,
        author: { '@type': 'Organization', name: 'MB Kuzbass', url: 'https://mb-kuzbass.ru/' },
        publisher: { '@type': 'Organization', name: 'MB Kuzbass' },
        mainEntityOfPage: { '@id': `https://mb-kuzbass.ru/stati/${article.slug}/` },
      });
      expect(graph.some((node) => node['@type'] === 'BreadcrumbList')).toBe(true);

      // FAQ: видимые вопросы и ответы совпадают с разметкой FAQPage; без вопросов нет ни блока, ни разметки.
      const faqVisible = await page.locator('.seo-faq__item').evaluateAll((items) =>
        items.map((item) => [item.querySelector('h3').textContent.trim(), item.querySelector('p').textContent.trim()]),
      );
      const faqNode = graph.find((node) => node['@type'] === 'FAQPage');
      if ((article.faq || []).length) {
        expect(faqVisible.length).toBe(article.faq.length);
        expect(faqNode.mainEntity.map((question) => [question.name, question.acceptedAnswer.text])).toEqual(faqVisible);
      } else {
        expect(faqVisible).toEqual([]);
        expect(faqNode).toBeUndefined();
      }

      // Все внутренние ссылки из текста статьи, FAQ и «Читайте также» открываются.
      const hrefs = await page
        .locator('.seo-article a[href^="/"], .seo-faq a[href^="/"], nav[aria-label="Читайте также"] a[href^="/"]')
        .evaluateAll((links) => [...new Set(links.map((link) => link.getAttribute('href')))]);
      for (const href of hrefs) expect((await page.request.get(`.${href}`)).status(), href).toBe(200);

      expect(await hasHorizontalScroll(page)).toBe(false);
    });
  }

  test('ссылка «Статьи» в подвале посадочной и главной, блок «Полезные статьи» на посадочной', async ({ page }) => {
    const [pagePath, slugsForPage] = Object.entries(articleLinks).find(([, list]) =>
      list.some((slug) => built.some((article) => article.slug === slug)),
    );
    await page.goto(`.${pagePath}`);
    await expect(page.locator('.seo-footer a[href="/stati/"]')).toHaveText('Статьи');
    const useful = page.locator('.seo-useful .seo-article-card');
    const expected = slugsForPage.filter((slug) => built.some((article) => article.slug === slug)).slice(0, 3);
    await expect(useful).toHaveCount(expected.length);
    for (const [index, slug] of expected.entries()) await expect(useful.nth(index)).toHaveAttribute('href', `/stati/${slug}/`);

    await page.goto('./');
    const homeLink = page.locator('.footer a', { hasText: /^Статьи$/ });
    expect(await homeLink.evaluate((link) => new URL(link.href).pathname)).toBe('/stati/');
  });
});

test.describe('согласие на cookie и цели', () => {
  test.use({ consent: false });

  test('на статье плашка cookie, до согласия Метрики нет, после — цели article_*', async ({ page }) => {
    const article = built[0];
    const requests = [];
    await page.context().route(/^https:\/\/mc\.yandex\.(ru|com)\//, (route) => {
      requests.push(route.request().url());
      return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
    });
    await page.goto(`./stati/${article.slug}/`);
    const banner = page.locator('.seo-cookie');
    await expect(banner).toBeVisible();

    const clickWithoutLeaving = async (locator) => {
      await page.evaluate(() => window.addEventListener('click', (event) => event.preventDefault(), { once: true }));
      await locator.click();
    };
    const cta = page.locator('.seo-contact-cta');
    await clickWithoutLeaving(cta.locator('a[href^="https://t.me/MB_Kuzbass"]'));
    await page.waitForTimeout(300);
    expect(requests).toEqual([]);
    expect(await page.evaluate(() => typeof window.ym)).toBe('undefined');

    await banner.getByRole('button', { name: 'Разрешить аналитику' }).click();
    await expect.poll(() => requests.some((url) => url.includes(`tag.js?id=${COUNTER_ID}`))).toBe(true);
    await clickWithoutLeaving(cta.locator('a[href^="https://t.me/MB_Kuzbass"]'));
    await clickWithoutLeaving(cta.locator('a[href^="tel:"]'));
    await clickWithoutLeaving(cta.locator('a[href^="https://wa.me/"]'));
    const goals = await page.evaluate(() =>
      (window.ym?.a || []).map((call) => Array.from(call)).filter((call) => call[1] === 'reachGoal').map((call) => call[2]),
    );
    expect(goals).toEqual(['article_telegram', 'article_phone', 'article_whatsapp']);
  });
});
