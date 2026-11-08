import { LANDING_PATHS, LEAD_TELEGRAM, expect, hasHorizontalScroll, test } from './fixtures.js';

for (const path of LANDING_PATHS) {
  test(`посадочная ${path}: стили, заявка в @MB_Kuzbass, ссылки на остальные`, async ({ page }) => {
    const response = await page.goto(`.${path}`);
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();

    // Стили seo-pages.css применились: заголовок шрифтом Unbounded, меню в белой капсуле.
    await expect(page.locator('h1')).toHaveCSS('font-family', /Unbounded/);
    await expect(page.locator('.seo-header nav')).toHaveCSS('background-color', 'rgb(255, 255, 255)');

    const hrefs = await page.locator('a[href]').evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('href')),
    );
    expect(hrefs.some((href) => href.startsWith(`${LEAD_TELEGRAM}?text=`))).toBe(true);
    for (const otherPath of LANDING_PATHS.filter((other) => other !== path)) expect(hrefs).toContain(otherPath);
    // Документы — страницы /dokumenty/…/: открываются и без JavaScript.
    for (const doc of ['/dokumenty/politika/', '/dokumenty/soglasie/', '/dokumenty/cookie/', '/dokumenty/rekvizity/']) {
      expect(hrefs).toContain(doc);
    }
    expect(await hasHorizontalScroll(page)).toBe(false);
  });
}

test('на странице авто из Японии 4 машины с фото и кнопкой «Хочу похожий»', async ({ page }) => {
  await page.goto('./avtomobili-iz-yaponii-barnaul/');
  const cars = page.locator('.seo-car');
  await expect(cars).toHaveCount(4);
  for (const car of await cars.all()) {
    await car.scrollIntoViewIfNeeded();
    await expect(car.locator('a')).toHaveAttribute('href', new RegExp(`^${LEAD_TELEGRAM}\\?text=`));
  }
  await expect
    .poll(() => cars.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)))
    .toBe(true);
});

// Посадочные с блоком «Частые вопросы»: разметка FAQPage должна совпадать с тем, что видит посетитель.
const FAQ_LANDINGS = [
  '/avtomobili-iz-yaponii-barnaul/',
  '/zapchasti-mercedes-barnaul/',
  '/kontraktnye-zapchasti-barnaul/',
  '/dvigateli-akpp-mercedes-bmw-barnaul/',
  '/kuzovnye-detali-optika-mercedes-bmw-barnaul/',
];

for (const path of FAQ_LANDINGS) {
  test(`посадочная ${path}: разметка FAQ совпадает с вопросами и ответами на странице`, async ({ page }) => {
    await page.goto(`.${path}`);
    const visible = await page.locator('.seo-faq__item').evaluateAll((items) =>
      items.map((item) => [item.querySelector('h3').textContent.trim(), item.querySelector('p').textContent.trim()]),
    );
    const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
    const faq = graph.find((node) => node['@type'] === 'FAQPage');
    expect(visible.length).toBeGreaterThan(0);
    expect(faq.mainEntity.map((question) => [question.name, question.acceptedAnswer.text])).toEqual(visible);
  });
}

// Блок «Примеры со склада»: карточки из каталога вставляет generate-catalog-pages.mjs. Какие разделы и марка
// должны попасть на каждую посадочную — как в landingExamples того скрипта.
const EXAMPLE_LANDINGS = {
  '/zapchasti-mercedes-barnaul/': { sections: null, brand: 'Mercedes-Benz' },
  '/kontraktnye-zapchasti-barnaul/': { sections: null, brand: null },
  '/dvigateli-akpp-mercedes-bmw-barnaul/': { sections: ['dvigateli', 'akpp'], brand: null },
  '/kuzovnye-detali-optika-mercedes-bmw-barnaul/': { sections: ['kuzov', 'optika', 'salon'], brand: null },
};

for (const [path, { sections, brand }] of Object.entries(EXAMPLE_LANDINGS)) {
  test(`посадочная ${path}: примеры со склада ведут на страницы деталей, фото загружаются`, async ({ page }) => {
    await page.goto(`.${path}`);
    const cards = page.locator('.seo-grid .seo-card');
    expect(await cards.count()).toBeGreaterThan(0);
    const items = await cards.evaluateAll((elements) =>
      elements.map((element) => ({ href: element.getAttribute('href'), title: element.querySelector('strong').textContent.trim() })),
    );
    for (const { href, title } of items) {
      expect(href).toMatch(/^\/katalog\/[a-z-]+\/[a-z0-9-]+\/$/);
      if (sections) expect(sections).toContain(href.split('/')[2]);
      if (brand) expect(title).toContain(brand);
      const response = await page.request.get(`.${href}`);
      expect(response.status()).toBe(200);
    }
    for (const card of await cards.all()) await card.scrollIntoViewIfNeeded();
    await expect
      .poll(() => cards.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)))
      .toBe(true);
    expect(await hasHorizontalScroll(page)).toBe(false);
  });
}
