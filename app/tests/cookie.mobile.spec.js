import { expect, test } from './fixtures.js';

test.use({ consent: false });

test('при первом визите плашка cookie появляется, занимает не больше трети экрана и закрывается выбором', async ({
  page,
}) => {
  await page.goto('./');
  await expect(page.locator('.cookie-banner')).toBeVisible();
  const box = await page.locator('.cookie-banner').boundingBox();
  expect(box.height).toBeLessThan(page.viewportSize().height / 3);
  // До выбора на сайте нет ни cookie, ни Метрики.
  expect(await page.context().cookies()).toHaveLength(0);
  expect(await page.evaluate(() => typeof window.ym)).toBe('undefined');
  await page.locator('.cookie-banner').getByText('Только необходимые').click();
  await expect(page.locator('.cookie-banner')).toHaveCount(0);
});
