import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures.js';

// Метрика на посадочных и страницах каталога (public/seo-pages.js): только после согласия, с целями по кнопкам связи.
// Запросы к Метрике не уходят наружу: тест подменяет её скрипт пустым и записывает, что запрашивалось.

test.use({ consent: false });

const COUNTER_ID = Number(
  readFileSync(new URL('../public/analytics-config.js', import.meta.url), 'utf8').match(/counterId: (\d+)/)[1],
);
// Политика безопасности как на хостинге: страница должна работать без встроенных скриптов.
const CSP = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8').match(/Content-Security-Policy: (.+)/)[1];

const PAGES = [
  { path: '/zapchasti-bmw-barnaul/', type: 'landing' },
  { path: '/katalog/akpp/akpp-bmw-525i/', type: 'product' },
  { path: '/katalog/akpp/', type: 'catalog' },
];

// Подменяет Метрику и отдаёт статичные страницы с заголовком CSP. Возвращает список адресов запросов к Метрике.
async function interceptMetrika(page) {
  const requests = [];
  await page.context().route(/^https:\/\/mc\.yandex\.(ru|com)\//, (route) => {
    requests.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '' });
  });
  await page.route(/\/(katalog|zapchasti|kontraktnye|dvigateli|kuzovnye|avtomobili|postavki)[^?]*\/$/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': CSP } });
  });
  return requests;
}

// Цели, которые страница поставила в очередь счётчика (подменённый скрипт её не забирает).
const queuedGoals = (page) =>
  page.evaluate(() =>
    (window.ym?.a || []).map((call) => Array.from(call)).filter((call) => call[1] === 'reachGoal').map((call) => [call[0], call[2]]),
  );

// Нажимает ссылку, но не даёт уйти со страницы в Telegram, WhatsApp или звонилку.
async function clickWithoutLeaving(page, locator) {
  await page.evaluate(() => window.addEventListener('click', (event) => event.preventDefault(), { once: true }));
  await locator.click();
}

for (const { path, type } of PAGES) {
  test(`${path}: до согласия Метрики нет, после «Разрешить аналитику» — счётчик и цели ${type}_*`, async ({ page }) => {
    const requests = await interceptMetrika(page);
    await page.goto(`.${path}`);

    const banner = page.locator('.seo-cookie');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText('Яндекс.Метрика включится только после отдельного разрешения на аналитику');
    await expect(banner.locator('a', { hasText: 'Подробнее' })).toHaveAttribute('href', '/#cookies');
    if (test.info().project.name === 'mobile') {
      // На телефоне плашка не выше трети экрана и не закрывает нижнюю панель связи.
      const box = await banner.boundingBox();
      const bar = await page.locator('.seo-mobile-bar').boundingBox();
      expect(box.height).toBeLessThan(page.viewportSize().height / 3);
      expect(box.y + box.height).toBeLessThanOrEqual(bar.y);
    }

    // Нажатие на кнопку связи до согласия ничего не отправляет.
    const telegram = page.locator('main a[href^="https://t.me/MB_Kuzbass"]').first();
    await clickWithoutLeaving(page, telegram);
    await page.waitForTimeout(300);
    expect(requests).toEqual([]);
    expect(await page.evaluate(() => typeof window.ym)).toBe('undefined');

    await banner.getByRole('button', { name: 'Разрешить аналитику' }).click();
    await expect(banner).toHaveCount(0);
    await expect.poll(() => requests.some((url) => url.startsWith(`https://mc.yandex.ru/metrika/tag.js?id=${COUNTER_ID}`))).toBe(true);
    const cookies = await page.context().cookies();
    expect(cookies.find((cookie) => cookie.name === 'mb_privacy_preferences')?.value).toMatch(/\.analytics$/);

    await clickWithoutLeaving(page, telegram);
    await clickWithoutLeaving(page, page.locator('main a[href^="tel:"]').first());
    await clickWithoutLeaving(page, page.locator('main a[href^="https://wa.me/"]').first());
    expect(await queuedGoals(page)).toEqual([
      [COUNTER_ID, `${type}_telegram`],
      [COUNTER_ID, `${type}_phone`],
      [COUNTER_ID, `${type}_whatsapp`],
    ]);
  });
}

test('«Только необходимые» на посадочной: Метрика не грузится и после перезагрузки, плашки нет', async ({ page }) => {
  const requests = await interceptMetrika(page);
  await page.goto('./zapchasti-mercedes-barnaul/');
  await page.locator('.seo-cookie').getByRole('button', { name: 'Только необходимые' }).click();
  await expect(page.locator('.seo-cookie')).toHaveCount(0);
  await page.reload();
  await page.waitForTimeout(300);
  await expect(page.locator('.seo-cookie')).toHaveCount(0);
  expect(requests).toEqual([]);
});

test('согласие с главной действует на посадочной, а «Настройки cookie» в подвале его отзывают', async ({ page }) => {
  const requests = await interceptMetrika(page);
  await page.goto('./');
  await page.locator('.cookie-banner').getByRole('button', { name: 'Разрешить аналитику' }).click();
  await expect.poll(() => requests.length).toBeGreaterThan(0);

  requests.length = 0;
  await page.goto('./avtomobili-iz-yaponii-barnaul/');
  await expect.poll(() => requests.some((url) => url.includes(`tag.js?id=${COUNTER_ID}`))).toBe(true);
  await expect(page.locator('.seo-cookie')).toHaveCount(0);

  await page.locator('.seo-footer').getByRole('button', { name: 'Настройки cookie' }).click();
  const settings = page.locator('.seo-cookie');
  await expect(settings.getByRole('checkbox', { name: /Аналитика/ })).toBeChecked();
  await settings.getByRole('checkbox', { name: /Аналитика/ }).uncheck();
  await settings.getByRole('button', { name: 'Сохранить выбор' }).click();
  expect(await page.evaluate(() => [typeof window.ym, Boolean(document.getElementById('mb-yandex-metrika'))])).toEqual([
    'undefined',
    false,
  ]);

  // Отказ, сделанный на посадочной, действует на главной: плашки нет, Метрика не грузится.
  requests.length = 0;
  await page.goto('./');
  await page.waitForTimeout(300);
  await expect(page.locator('.cookie-banner')).toHaveCount(0);
  expect(requests).toEqual([]);
});
