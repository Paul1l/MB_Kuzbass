import { expect, hasHorizontalScroll, isInViewport, test } from './fixtures.js';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('переключатель форм: по умолчанию «Нужна запчасть», фото первого экрана грузятся отложенно', async ({ page }) => {
  await expect(page.locator('.hero-switch')).toBeVisible();
  await expect(page.locator('.door').nth(0)).toBeVisible();
  await expect(page.locator('.door').nth(1)).toBeHidden();
  // Форма стоит выше фото, а фото не мешают первому экрану загрузиться.
  const formTop = await page.locator('#request').evaluate((element) => element.getBoundingClientRect().top);
  const photoTop = await page.locator('.hero__main').evaluate((element) => element.getBoundingClientRect().top);
  expect(formTop).toBeLessThan(photoTop);
  const loadingModes = await page.locator('.hero img').evaluateAll((images) => images.map((image) => image.loading));
  expect(loadingModes.length).toBeGreaterThan(0);
  expect(loadingModes.every((mode) => mode === 'lazy')).toBe(true);

  await page.locator('.hero-switch button', { hasText: 'Авто из Японии' }).click();
  await expect(page.locator('.door').nth(1)).toBeVisible();
  await expect(page.locator('.door').nth(0)).toBeHidden();
});

test('панель «Позвонить / Telegram / WhatsApp» видна и прячется, пока печатают', async ({ page }) => {
  await expect(page.locator('.mobile-contact-bar')).toBeVisible();
  await page.focus('#lead-vehicle');
  await expect(page.locator('.mobile-contact-bar')).toBeHidden();
});

test('меню открывается кнопкой и закрывается после перехода', async ({ page }) => {
  await expect(page.locator('#site-nav')).toBeHidden();
  await page.click('.menu-toggle');
  await expect(page.locator('#site-nav')).toBeVisible();
  await expect(page.locator('.menu-toggle')).toHaveAttribute('aria-expanded', 'true');

  await page.click('#site-nav a[href="#contacts"]');
  await expect(page.locator('#site-nav')).toBeHidden();
  await expect.poll(() => isInViewport(page, '#contacts')).toBe(true);
});

test('страница не прокручивается вбок', async ({ page }) => {
  expect(await hasHorizontalScroll(page)).toBe(false);
});
