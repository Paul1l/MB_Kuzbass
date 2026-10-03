import { LANDING_PATHS, LEAD_TELEGRAM, expect, test } from './fixtures.js';

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('первый экран: заголовок, обе формы и меню', async ({ page }) => {
  await expect(page.locator('h1')).toContainText('по запчастям и целиком');
  await expect(page.locator('.door').nth(0)).toBeVisible();
  await expect(page.locator('.door').nth(1)).toBeVisible();
  await expect(page.locator('.hero-switch')).toBeHidden();
  await expect(page.locator('.nav a[href="#catalog"]')).toBeVisible();
});

test('«Частые доноры» подставляют модель и переводят к полю детали', async ({ page }) => {
  await page.locator('.donors .chip', { hasText: 'W211' }).click();
  await expect(page.locator('#lead-vehicle')).toHaveValue('Mercedes-Benz W211');
  await expect(page.locator('#lead-part')).toBeFocused();
});

test('форма запчасти: без согласия не отправляется, с согласием открывает личный чат в том же нажатии', async ({
  page,
}) => {
  const partsDoor = page.locator('.door').nth(0);
  await page.fill('#lead-vehicle', 'Mercedes-Benz W211');
  await page.fill('#lead-part', 'Левая фара');
  await partsDoor.locator('button[type="submit"]').click();
  expect(await page.evaluate(() => window.__opens.length)).toBe(0);

  await page.check('#lead-parts-agree');
  await partsDoor.locator('button[type="submit"]').click();
  // Окно должно открыться внутри события submit: иначе Safari на iPhone заблокирует вкладку.
  expect(await page.evaluate(() => window.__opens)).toEqual([{ url: LEAD_TELEGRAM, event: 'submit' }]);
  const copied = await page.evaluate(() => window.__copied);
  expect(copied).toContain('Заявка с сайта MB Kuzbass: запчасть');
  expect(copied).toContain('Автомобиль или VIN: Mercedes-Benz W211');
  expect(copied).toContain('Деталь: Левая фара');
  expect(copied).toContain('Редакция согласия:');
  await expect(partsDoor.locator('.form-status')).toContainText('скопирован');
});

test('форма «Хочу авто из Японии»: текст заявки и открытие чата', async ({ page }) => {
  const carDoor = page.locator('.door').nth(1);
  await page.fill('#lead-car', 'Mercedes-Benz E-Class 2018');
  await page.fill('#lead-city', 'Новосибирск');
  await page.check('#lead-car-agree');
  await carDoor.locator('button[type="submit"]').click();
  expect(await page.evaluate(() => window.__opens)).toEqual([{ url: LEAD_TELEGRAM, event: 'submit' }]);
  const copied = await page.evaluate(() => window.__copied);
  expect(copied).toContain('автомобиль из Японии');
  expect(copied).toContain('Автомобиль: Mercedes-Benz E-Class 2018');
  expect(copied).toContain('Куда доставить: Новосибирск');
});

test('«Примеры с нашего склада» ведут в @MB_Kuzbass с готовым текстом', async ({ page }) => {
  const links = await page.locator('.product-card .button').evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('href')),
  );
  expect(links).toHaveLength(4);
  for (const href of links) expect(href.startsWith(`${LEAD_TELEGRAM}?text=`)).toBe(true);
});

test('главная ссылается на все посадочные, открытая группа — только отдельной ссылкой', async ({ page }) => {
  const hrefs = await page.locator('a[href]').evaluateAll((elements) =>
    elements.map((element) => element.getAttribute('href')),
  );
  expect(LANDING_PATHS).toHaveLength(7);
  for (const path of LANDING_PATHS) expect(hrefs).toContain(path);
  expect(hrefs.filter((href) => href.includes('mbc_kuzbass'))).toHaveLength(1);
});

test('title и разметка без чужого рейтинга', async ({ page }) => {
  await expect(page).toHaveTitle('Запчасти Mercedes-Benz, BMW и авто из Японии в Барнауле — MB Kuzbass');
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.join('')).not.toContain('aggregateRating');
});

test('документ согласия открывается из формы и закрывается по Escape', async ({ page }) => {
  await page.locator('.door').nth(0).locator('.privacy-check a').click();
  await expect(page.locator('.legal-modal')).toBeVisible();
  await expect(page.locator('#legal-title')).toContainText('Согласие');
  await page.keyboard.press('Escape');
  await expect(page.locator('.legal-modal')).toHaveCount(0);
});
