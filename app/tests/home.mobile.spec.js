import { expect, hasHorizontalScroll, isInViewport, test } from './fixtures.js';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('переключатель форм: по умолчанию «Нужна запчасть», фото первого экрана не загружаются', async ({ page }) => {
  await expect(page.locator('.hero-switch')).toBeVisible();
  await expect(page.locator('.door').nth(0)).toBeVisible();
  await expect(page.locator('.door').nth(1)).toBeHidden();
  const heroPhotoRequested = await page.evaluate(() =>
    performance.getEntriesByType('resource').some((entry) => /client-car-0(2|7)/.test(entry.name)),
  );
  expect(heroPhotoRequested).toBe(false);

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
