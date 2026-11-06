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

test('на странице авто из Японии разметка FAQ совпадает с вопросами и ответами на странице', async ({ page }) => {
  await page.goto('./avtomobili-iz-yaponii-barnaul/');
  const visible = await page.locator('.seo-faq__item').evaluateAll((items) =>
    items.map((item) => [item.querySelector('h3').textContent.trim(), item.querySelector('p').textContent.trim()]),
  );
  const graph = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent())['@graph'];
  const faq = graph.find((node) => node['@type'] === 'FAQPage');
  expect(visible.length).toBeGreaterThan(0);
  expect(faq.mainEntity.map((question) => [question.name, question.acceptedAnswer.text])).toEqual(visible);
});
