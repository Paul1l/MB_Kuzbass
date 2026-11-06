import { LANDING_PATHS, expect, test } from './fixtures.js';

// Документы — отдельные страницы /dokumenty/…/ (scripts/generate-legal-pages.mjs) из тех же текстов, что окна
// документов на главной. Они открываются без JavaScript, на них ведут подвалы всех страниц.

const DOCS = [
  ['requisites', '/dokumenty/rekvizity/', 'Реквизиты'],
  ['privacy', '/dokumenty/politika/', 'Политика обработки персональных данных'],
  ['consent', '/dokumenty/soglasie/', 'Согласие на обработку ПДн'],
  ['agreement', '/dokumenty/soglashenie/', 'Пользовательское соглашение'],
  ['order-terms', '/dokumenty/usloviya-zakaza/', 'Заказ, оплата и доставка'],
  ['cookies', '/dokumenty/cookie/', 'Файлы cookie'],
];

// Текст документа: заголовок, вводный абзац и разделы — одинаково для окна на главной и для страницы.
const readDocument = (root) =>
  root.evaluate((element) => ({
    title: element.querySelector('h1, h2').textContent.trim(),
    lead: element.querySelector('.legal-modal__lead, .seo-lead').textContent.trim(),
    sections: [...element.querySelectorAll('.legal-modal__body section, .seo-legal section')].map((section) => [
      section.querySelector('h2, h3').textContent.trim(),
      section.querySelector('p').textContent.trim(),
    ]),
  }));

for (const [id, docPath] of DOCS) {
  test(`${docPath}: тот же текст, что в окне документа на главной`, async ({ page }) => {
    await page.goto(`./#${id}`);
    await expect(page.locator('.legal-modal')).toBeVisible();
    const modal = await readDocument(page.locator('.legal-modal__panel'));

    const response = await page.goto(`.${docPath}`);
    expect(response.status()).toBe(200);
    const staticPage = await readDocument(page.locator('main'));
    expect(staticPage).toEqual(modal);
    expect(staticPage.sections.length).toBeGreaterThan(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://mb-kuzbass.ru${docPath}`);
  });
}

test.describe('без JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('документы открываются по ссылкам из подвала посадочной, в подвале — ИНН, ОГРНИП и все документы', async ({ page }) => {
    await page.goto(`.${LANDING_PATHS[0]}`);
    const footer = page.locator('.seo-footer');
    await expect(footer).toContainText('ИНН 420211367957');
    await expect(footer).toContainText('ОГРНИП 323420500092541');
    for (const [, docPath, label] of DOCS) await expect(footer.getByRole('link', { name: label, exact: true })).toHaveAttribute('href', docPath);

    await footer.getByRole('link', { name: 'Политика обработки персональных данных', exact: true }).click();
    await expect(page).toHaveURL(/\/dokumenty\/politika\/$/);
    await expect(page.locator('h1')).toHaveText('Политика обработки персональных данных');
    await expect(page.locator('.seo-legal section').first()).toBeVisible();
  });

  test('подвал главной ведёт на страницы документов', async ({ page }) => {
    await page.goto('./');
    const documents = page.locator('.footer nav[aria-label="Документы сайта"]');
    for (const [, docPath, label] of DOCS) {
      const href = await documents.getByRole('link', { name: label, exact: true }).evaluate((link) => new URL(link.href).pathname);
      expect(href).toBe(docPath);
    }
  });
});

test('старая ссылка /#privacy по-прежнему открывает документ окном на главной', async ({ page }) => {
  await page.goto('./#privacy');
  await expect(page.locator('#legal-title')).toHaveText('Политика обработки персональных данных');
});
