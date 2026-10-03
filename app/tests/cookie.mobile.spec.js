import { expect, test } from './fixtures.js';

test.use({ consent: false });

test('при первом визите плашка cookie появляется и закрывается выбором', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('.cookie-banner')).toBeVisible();
  await page.locator('.cookie-banner').getByText('Только необходимые').click();
  await expect(page.locator('.cookie-banner')).toHaveCount(0);
});
