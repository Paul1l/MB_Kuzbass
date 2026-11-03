import { LEAD_TELEGRAM, expect, isInViewport, test } from './fixtures.js';

// Каталог — отдельные страницы /katalog/... (их создаёт scripts/generate-catalog-pages.mjs), чтобы поисковики видели
// каждый раздел и каждую деталь. Главная только ссылается на них.

test('плитка раздела на главной открывает страницу раздела', async ({ page }) => {
  await page.goto('./');
  await page.locator('.category-card', { hasText: 'АКПП' }).click();
  await expect(page).toHaveURL(/\/katalog\/akpp\/$/);
  await expect(page.locator('h1')).toHaveText('Контрактные АКПП Mercedes-Benz и BMW');
  await expect(page.locator('.seo-grid .seo-card')).toHaveCount(3);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://mb-kuzbass.ru/katalog/akpp/');
});

test('старая ссылка #catalog/transmission ведёт на страницу раздела', async ({ page }) => {
  await page.goto('./#catalog/transmission');
  await expect(page).toHaveURL(/\/katalog\/akpp\/$/);
  await expect(page.locator('h1')).toHaveText('Контрактные АКПП Mercedes-Benz и BMW');
});

test('страница детали: фото, цена по запросу и заявка в Telegram с названием детали', async ({ page }) => {
  await page.goto('./katalog/akpp/');
  await page.locator('.seo-card', { hasText: 'АКПП BMW 525i' }).click();
  await expect(page).toHaveURL(/\/katalog\/akpp\/akpp-bmw-525i\/$/);
  await expect(page.locator('h1')).toHaveText('АКПП BMW 525i');
  await expect(page.locator('.seo-price')).toHaveText('Цена и наличие — по запросу');

  const photo = page.locator('.seo-product__gallery img').first();
  await expect(photo).toBeVisible();
  expect(await photo.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);

  const telegram = page.locator('.seo-product__info .seo-button--primary');
  const href = new URL(await telegram.getAttribute('href'));
  expect(`${href.origin}${href.pathname}`).toBe(LEAD_TELEGRAM);
  expect(href.searchParams.get('text')).toContain('Интересует: АКПП BMW 525i');
});

test('карточка «Примеры с нашего склада» ведёт на страницу детали', async ({ page }) => {
  await page.goto('./');
  const link = page.locator('#stock .product-card h3 a').first();
  const title = (await link.textContent()).trim();
  await link.click();
  await expect(page).toHaveURL(/\/katalog\/[a-z-]+\/[a-z0-9-]+\/$/);
  await expect(page.locator('h1')).toHaveText(title);
});

test('ссылка /#catalog открывает главную сразу на каталоге', async ({ page }) => {
  await page.goto('./#catalog');
  await expect.poll(() => isInViewport(page, '#catalog')).toBe(true);
});
