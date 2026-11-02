import { LEAD_TELEGRAM, expect, hasHorizontalScroll, test } from './fixtures.js';

test('«Уже заказали в Японии»: витрина переключает машины и цвет, фото листаются по кругу, «Хочу похожий» ведёт в @MB_Kuzbass с моделью', async ({
  page,
}) => {
  await page.goto('./');
  const section = page.locator('#japan-cars');
  await section.scrollIntoViewIfNeeded();
  const picks = section.locator('.car-pick');
  await expect(picks).toHaveCount(4);
  await expect(picks.first()).toHaveAttribute('aria-pressed', 'true');

  const card = section.locator('.car-card');
  await expect(card).toHaveCount(1);
  const photo = card.locator('.car-card__media img');
  const counter = card.locator('.car-card__nav span');
  const firstPhoto = await photo.getAttribute('src');
  await expect(counter).toHaveText('1 / 3');

  await card.getByRole('button', { name: /Следующее фото/ }).click();
  await expect(counter).toHaveText('2 / 3');
  expect(await photo.getAttribute('src')).not.toBe(firstPhoto);

  await card.getByRole('button', { name: /Предыдущее фото/ }).click();
  await card.getByRole('button', { name: /Предыдущее фото/ }).click();
  await expect(counter).toHaveText('3 / 3');

  const href = await card.locator('a.button').getAttribute('href');
  expect(href.startsWith(`${LEAD_TELEGRAM}?text=`)).toBe(true);
  expect(decodeURIComponent(href)).toContain('Хочу похожий автомобиль из Японии: Mercedes-Benz C-класс Кабриолет (A205)');

  // Другая машина: карточка, ссылка и цвет витрины меняются, фото начинается с первого.
  const stage = section.locator('.car-stage');
  const firstColor = await stage.evaluate((element) => element.style.getPropertyValue('--stage-bg'));
  await picks.nth(2).click();
  await expect(picks.nth(2)).toHaveAttribute('aria-pressed', 'true');
  await expect(picks.first()).toHaveAttribute('aria-pressed', 'false');
  await expect(card.locator('h3')).toHaveText('Mercedes-Benz C-класс седан');
  await expect(counter).toHaveText('1 / 4');
  expect(decodeURIComponent(await card.locator('a.button').getAttribute('href'))).toContain('седан (W205)');
  await expect(stage).toHaveAttribute('data-tone', 'dark');
  expect(await stage.evaluate((element) => element.style.getPropertyValue('--stage-bg'))).not.toBe(firstColor);

  // Фото машины и все миниатюры загрузились.
  await expect
    .poll(() => section.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)))
    .toBe(true);
  expect(await hasHorizontalScroll(page)).toBe(false);
});
