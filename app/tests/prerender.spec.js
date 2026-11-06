import { LANDING_PATHS, expect, test } from './fixtures.js';

// Главная приходит готовым HTML (scripts/prerender-home.mjs), а React в браузере подхватывает его (main.jsx).

test.describe('без JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('главная показывает заголовок, тексты, ссылки на каталог, посадочные и контакты', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('#root h1')).toHaveText('Mercedes-Benz и BMW из Японии — по запчастям и целиком');
    await expect(page.locator('#catalog-title')).toHaveText('Каталог запчастей');

    const hrefs = await page.locator('#root a[href]').evaluateAll((links) => links.map((link) => new URL(link.href).pathname));
    expect(hrefs).toContain('/katalog/');
    expect(hrefs).toContain('/katalog/dvigateli/');
    expect(hrefs.filter((href) => /^\/katalog\/[a-z-]+\/[a-z0-9-]+\/$/.test(href)).length).toBeGreaterThanOrEqual(10);
    for (const landingPath of LANDING_PATHS) expect(hrefs).toContain(landingPath);

    // Контакты: телефон ссылкой, адрес склада текстом.
    await expect(page.locator('#root a[href="tel:+79235362777"]').first()).toBeAttached();
    await expect(page.locator('#contacts')).toContainText('Барнаул');
    // Плашка cookie — не содержимое страницы: в готовом HTML её нет.
    await expect(page.locator('.cookie-banner')).toHaveCount(0);
  });
});

test('в ответе сервера заголовок H1 лежит внутри #root', async ({ request }) => {
  const html = await (await request.get('./')).text();
  const rootStart = html.indexOf('<div id="root">');
  expect(rootStart).toBeGreaterThan(0);
  expect(html.indexOf('<h1', rootStart)).toBeGreaterThan(rootStart);
});

for (const consent of [false, true]) {
  test.describe(consent ? 'повторный визит (выбор cookie сделан)' : 'первый визит', () => {
    test.use({ consent });

    test('React подхватывает готовую разметку без расхождений и перерисовки', async ({ page }) => {
      const warnings = [];
      page.on('console', (message) => {
        if (message.type() === 'warning' || message.type() === 'error') warnings.push(message.text());
      });
      // Запоминает первый H1 из HTML и всё, что видно к моменту, когда скрипт главной уже выполнился.
      await page.addInitScript(() => {
        window.__bannerSeen = false;
        new MutationObserver(() => {
          window.__firstH1 = window.__firstH1 || document.querySelector('#root h1');
          if (document.querySelector('.cookie-banner')) window.__bannerSeen = true;
        }).observe(document, { childList: true, subtree: true });
        document.addEventListener('DOMContentLoaded', () => {
          window.__atStart = {
            counter: document.querySelector('.hero__stat--rating .count-up__value')?.textContent,
            banner: Boolean(document.querySelector('.cookie-banner')),
          };
        });
      });

      await page.goto('./');
      await expect(page.locator('h1')).toBeVisible();
      // Тот же узел H1, что пришёл в HTML: React не стёр разметку и не нарисовал страницу заново.
      expect(await page.evaluate(() => window.__firstH1 === document.querySelector('#root h1'))).toBe(true);

      const atStart = await page.evaluate(() => window.__atStart);
      // К концу скрипта (до первого кадра) счётчик уже на нуле, а не на итоговом числе.
      expect(atStart.counter).toMatch(/^0[.,]0$/);
      // Плашка: у нового посетителя — сразу, у вернувшегося — не появляется ни на миг.
      expect(atStart.banner).toBe(!consent);
      expect(await page.evaluate(() => window.__bannerSeen)).toBe(!consent);

      expect(warnings.filter((text) => /hydrat|did not match|Minified React error/i.test(text))).toEqual([]);
    });
  });
}

test('браузер без blocking="render": счётчик первого экрана не сбрасывается в ноль, ниже экрана — набегает', async ({
  page,
}) => {
  // Так ведут себя Firefox и браузеры, которые рисуют готовый HTML раньше скрипта главной.
  await page.addInitScript(() => {
    delete HTMLScriptElement.prototype.blocking;
    window.__heroValues = new Set();
    const watch = () => {
      const value = document.querySelector('.hero__stat--rating .count-up__value')?.textContent;
      if (value) window.__heroValues.add(value);
      if (performance.now() < 4000) requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
    document.addEventListener('DOMContentLoaded', () => {
      window.__belowFold = document.querySelector('.trust-rating .count-up__value')?.textContent;
    });
  });
  await page.goto('./');
  const heroCounter = page.locator('.hero__stat--rating .count-up');
  const finalValue = await heroCounter.locator('.visually-hidden').textContent();
  await page.waitForTimeout(1500);
  // На телефоне плитка рейтинга может быть ниже первого экрана — тогда она набегает, как в Chrome.
  const heroOnScreen = await heroCounter.evaluate((element) => element.getBoundingClientRect().top < window.innerHeight);
  if (heroOnScreen) expect(await page.evaluate(() => [...window.__heroValues])).toEqual([finalValue]);
  expect(await page.evaluate(() => window.__belowFold)).toMatch(/^0[.,]0$/);
});
