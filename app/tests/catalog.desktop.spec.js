import { expect, isInViewport, test } from './fixtures.js';

test('категория каталога открывается и «Назад» возвращает к каталогу', async ({ page }) => {
  await page.goto('./');
  await page.locator('.category-card', { hasText: 'АКПП' }).click();
  await expect(page.locator('h1')).toHaveText('АКПП');
  await expect(page).toHaveURL(/#catalog\/transmission$/);
  await expect(page.locator('.catalog-product-card')).toHaveCount(3);

  await page.click('.catalog-page__back');
  await expect.poll(() => isInViewport(page, '#catalog')).toBe(true);
});

test('ссылка /#catalog открывает главную сразу на каталоге', async ({ page }) => {
  await page.goto('./#catalog');
  await expect.poll(() => isInViewport(page, '#catalog')).toBe(true);
});
