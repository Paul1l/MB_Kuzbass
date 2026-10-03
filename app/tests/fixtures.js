import { readFileSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';

// Аккаунт для заявок и все посадочные страницы из sitemap.xml.
export const LEAD_TELEGRAM = 'https://t.me/MB_Kuzbass';
export const LANDING_PATHS = [
  ...readFileSync(new URL('../public/sitemap.xml', import.meta.url), 'utf8').matchAll(
    /<loc>https:\/\/mb-kuzbass\.ru(\/[^<]+\/)<\/loc>/g,
  ),
].map((match) => match[1]);

// Версия согласия берётся из исходника: после новой редакции документов тесты не устареют.
const consentVersion = readFileSync(new URL('../src/privacyConsent.js', import.meta.url), 'utf8').match(
  /PRIVACY_CONSENT_VERSION = '([^']+)'/,
)[1];

// Нужна для проверок «блок на экране»: true, если элемент хотя бы частично в окне браузера.
export async function isInViewport(page, selector) {
  return page.locator(selector).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });
}

// Нужна для проверки вёрстки на телефоне: страница не должна прокручиваться вбок.
export async function hasHorizontalScroll(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
}

// Страница сайта для тестов:
// - по умолчанию выбор cookie уже сделан, чтобы плашка не закрывала страницу (`test.use({ consent: false })` — первый визит);
// - window.open и копирование подменены: тест видит, какой адрес открылся и в каком событии, и текст заявки;
// - после теста проверяется, что в консоли нет ошибок.
export const test = base.extend({
  consent: [true, { option: true }],
  page: async ({ page, consent, baseURL }, use) => {
    if (consent) {
      await page.context().addCookies([
        { name: 'mb_privacy_preferences', value: encodeURIComponent(`${consentVersion}.necessary`), url: baseURL },
      ]);
    }
    await page.addInitScript(() => {
      window.__opens = [];
      window.open = (url) => {
        window.__opens.push({ url: String(url), event: window.event ? window.event.type : null });
        return null;
      };
      document.execCommand = (command) => {
        if (command === 'copy') window.__copied = document.activeElement && document.activeElement.value;
        return true;
      };
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await use(page);
    expect(errors, 'ошибки в консоли браузера').toEqual([]);
  },
});

export { expect };
