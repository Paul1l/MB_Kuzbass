import { expect, test, waitForInitialScrollReset } from './fixtures.js';

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

test('счётчик не показывает отрицательных чисел, даже если метка кадра раньше начала счёта', async ({ page }) => {
  // Браузер передаёт в requestAnimationFrame время начала кадра, и оно бывает раньше performance.now() в момент
  // запуска счёта (так было при медленной загрузке скрипта: «-1.0» и «-1 640+» на первом кадре). Здесь все
  // метки кадров сдвинуты на 300 мс в прошлое, чтобы этот случай повторялся всегда.
  await page.addInitScript(() => {
    const requestFrame = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => requestFrame((time) => callback(time - 300));
    window.__counterValues = [];
    new MutationObserver(() => {
      for (const value of document.querySelectorAll('.hero__stat .count-up__value')) window.__counterValues.push(value.textContent);
    }).observe(document, { childList: true, subtree: true, characterData: true });
  });
  await page.goto('./');
  const rating = page.locator('.hero__stat--rating .count-up');
  await rating.scrollIntoViewIfNeeded();
  await expect(rating.locator('.count-up__value')).toHaveText(await rating.locator('.visually-hidden').textContent());
  const values = await page.evaluate(() => window.__counterValues);
  expect(values.length).toBeGreaterThan(5);
  expect(values.filter((value) => value.includes('-'))).toEqual([]);
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

test('фото на карточках и на страницах каталога связаны одним именем для плавного перехода', async ({ page }) => {
  const transitionNames = () =>
    page.locator('[style*="view-transition-name"]').evaluateAll((items) => items.map((item) => item.style.viewTransitionName));

  await page.goto('./');
  const homeNames = await transitionNames();
  expect(homeNames.length).toBeGreaterThanOrEqual(10);
  expect(new Set(homeNames).size, 'имена на главной не повторяются').toBe(homeNames.length);

  const featured = page.locator('#stock .product-card').first();
  const productName = await featured.locator('img').evaluate((image) => image.style.viewTransitionName);
  const productHref = await featured.locator('h3 a').evaluate((link) => link.href);
  const categoryName = await page.locator('.category-card img').first().evaluate((image) => image.style.viewTransitionName);
  const categoryHref = await page.locator('.category-card').first().evaluate((link) => link.href);

  await page.goto(productHref);
  await expect(page.locator('.seo-product__gallery img').first()).toHaveAttribute('style', new RegExp(`view-transition-name: ${productName};`));
  const productPageNames = await transitionNames();
  expect(new Set(productPageNames).size).toBe(productPageNames.length);

  await page.goto(categoryHref);
  await expect(page.locator('.seo-hero img')).toHaveAttribute('style', new RegExp(`view-transition-name: ${categoryName};`));
  const categoryPageNames = await transitionNames();
  expect(new Set(categoryPageNames).size).toBe(categoryPageNames.length);
});

test('частицы рисуют маршрут, а большие слова едут при прокрутке', async ({ page }) => {
  await page.goto('./');
  await waitForInitialScrollReset(page);
  const canvas = page.locator('.particle-route canvas');
  await canvas.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const { data } = element.getContext('2d').getImageData(0, 0, element.width, element.height);
        let painted = 0;
        for (let index = 3; index < data.length; index += 4) if (data[index] > 0) painted += 1;
        return painted;
      }),
    )
    .toBeGreaterThan(500);

  const mega = page.locator('.mega-type');
  await mega.scrollIntoViewIfNeeded();
  await expect.poll(() => mega.evaluate((element) => element.style.getPropertyValue('--mega-p'))).not.toBe('');
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
    await expect(page.locator('.particle-route')).toBeHidden();
    expect(await page.locator('.hero__main img').evaluate((image) => getComputedStyle(image).scale)).toBe('none');
  });
});
