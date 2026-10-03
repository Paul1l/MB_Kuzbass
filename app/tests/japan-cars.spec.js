import { LEAD_TELEGRAM, expect, hasHorizontalScroll, test } from './fixtures.js';

test('«Уже заказали в Японии»: фото листаются по кругу, «Хочу похожий» ведёт в @MB_Kuzbass с моделью', async ({
  page,
}) => {
  await page.goto('./');
  const section = page.locator('#japan-cars');
  await section.scrollIntoViewIfNeeded();
  await expect(section.locator('.car-card')).toHaveCount(4);

  const card = section.locator('.car-card').first();
  const photo = card.locator('img');
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

  // Все первые фото карточек загрузились.
  await section.locator('.car-card').last().scrollIntoViewIfNeeded();
  await expect
    .poll(() => section.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)))
    .toBe(true);
  expect(await hasHorizontalScroll(page)).toBe(false);
});
