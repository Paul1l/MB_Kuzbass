import { expect, test } from './fixtures.js';

// Анимации главной (src/lib/motion.js, CountUp, StockMarquee): работают и ничего не прячут насовсем,
// а при «Уменьшить движение» в системе выключаются.

test('счётчики первого экрана доходят до итогового значения, итог для программ чтения есть сразу', async ({ page }) => {
  await page.goto('./');
  const rating = page.locator('.hero__stat--rating .count-up');
  const finalValue = await rating.locator('.visually-hidden').textContent();
  expect(finalValue).toMatch(/^\d[.,]\d$/);
  // На телефоне плитки ниже формы: счёт начинается, когда плитка показалась на экране.
  await rating.scrollIntoViewIfNeeded();
  await expect(rating.locator('.count-up__value')).toHaveText(finalValue);
  await expect(page.locator('.hero__stat--drom .count-up__value')).toHaveText(
    await page.locator('.hero__stat--drom .count-up .visually-hidden').textContent(),
  );
});

test('бегущая лента ведёт на существующие страницы деталей, копия скрыта, пауза останавливает', async ({ page }) => {
  await page.goto('./');
  const links = page.locator('.marquee__list:not([aria-hidden]) a');
  await expect(links).toHaveCount(30);
  for (const href of await links.evaluateAll((items) => items.map((item) => item.href))) {
    expect(href).toMatch(/\/katalog\/[a-z-]+\/[a-z0-9-]+\/$/);
    expect((await page.request.get(href)).status(), href).toBe(200);
  }
  await expect(page.locator('.marquee__list[aria-hidden="true"] a').first()).toHaveAttribute('tabindex', '-1');

  const toggle = page.locator('.marquee__toggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.marquee__track')).toHaveCSS('animation-play-state', 'paused');
});

test('плитки каталога проявляются при прокрутке', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveClass(/reveal-ready/);
  const card = page.locator('.category-card').first();
  await expect(card).toHaveAttribute('data-reveal', '');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveClass(/is-revealed/);
  await expect(card).toHaveCSS('opacity', '1');
});

test.describe('при «Уменьшить движение»', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('ничего не скрыто и не движется', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('html')).not.toHaveClass(/reveal-ready/);
    await expect(page.locator('[data-reveal]')).toHaveCount(0);
    await expect(page.locator('.hero__stat--rating .count-up__value')).toHaveText(
      await page.locator('.hero__stat--rating .count-up .visually-hidden').textContent(),
    );
    await expect(page.locator('.marquee__track')).toHaveCSS('animation-name', 'none');
    await expect(page.locator('.marquee__list[aria-hidden="true"]')).toBeHidden();
    await expect(page.locator('.hero__form .beam')).toBeHidden();
  });
});
