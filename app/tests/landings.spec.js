import { LANDING_PATHS, LEAD_TELEGRAM, expect, hasHorizontalScroll, test } from './fixtures.js';

for (const path of LANDING_PATHS) {
  test(`посадочная ${path}: стили, заявка в @MB_Kuzbass, ссылки на остальные`, async ({ page }) => {
    const response = await page.goto(`.${path}`);
    expect(response.status()).toBe(200);
    await expect(page.locator('h1')).toBeVisible();

    // Стили seo-pages.css применились: шапка графитовая.
    await expect(page.locator('.seo-header')).toHaveCSS('background-color', 'rgb(18, 20, 23)');

    const hrefs = await page.locator('a[href]').evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('href')),
    );
    expect(hrefs.some((href) => href.startsWith(`${LEAD_TELEGRAM}?text=`))).toBe(true);
    for (const otherPath of LANDING_PATHS.filter((other) => other !== path)) expect(hrefs).toContain(otherPath);
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
