import { LEAD_TELEGRAM, expect, hasHorizontalScroll, test } from './fixtures.js';

// «Уже заказали в Японии» — карусель в духе примера с мороженым: машина в центре, фон блока в её цвет.
test('«Уже заказали в Японии»: стрелки, точки и машины справа меняют машину в центре и цвет блока, «Хочу похожий» ведёт в @MB_Kuzbass с моделью', async ({
  page,
}) => {
  await page.goto('./');
  const section = page.locator('#japan-cars');
  await section.scrollIntoViewIfNeeded();
  const items = section.locator('.ice__item');
  await expect(items).toHaveCount(4);
  await expect(section.locator('.ice__item[data-slot="0"]')).toHaveCount(1);

  const caption = section.locator('.ice__car strong');
  const cta = section.locator('.ice__actions a').first();
  const colorOf = () => section.evaluate((element) => element.style.getPropertyValue('--stage-bg'));

  // Первое нажатие останавливает автопрокрутку, дальше машина меняется только по нажатию.
  await section.getByRole('button', { name: 'Следующая машина' }).click();
  const afterNext = await caption.textContent();
  const colorAfterNext = await colorOf();
  await section.getByRole('button', { name: 'Предыдущая машина' }).click();
  await expect(caption).toHaveText('Mercedes-Benz C-класс Кабриолет');
  expect(afterNext).toBe('Mercedes-Benz C-класс Купе');
  expect(await colorOf()).not.toBe(colorAfterNext);

  const href = await cta.getAttribute('href');
  expect(href.startsWith(`${LEAD_TELEGRAM}?text=`)).toBe(true);
  expect(decodeURIComponent(href)).toContain('Хочу похожий автомобиль из Японии: Mercedes-Benz C-класс Кабриолет (A205)');

  // Точка выбирает машину; машина справа тоже кликается.
  await section.locator('.ice__dots button').nth(2).click();
  await expect(caption).toHaveText('Mercedes-Benz C-класс седан');
  await expect(section.locator('.ice__dots button').nth(2)).toHaveAttribute('aria-pressed', 'true');
  expect(decodeURIComponent(await cta.getAttribute('href'))).toContain('седан (W205)');
  await section.locator('.ice__item[data-slot="1"]').click();
  await expect(caption).toHaveText('Mercedes-Benz C180 седан');

  // У машины в центре есть описание фото, у остальных — нет (они только кнопки выбора).
  await expect(section.locator('.ice__item[data-slot="0"] img')).toHaveAttribute('alt', /Mercedes-Benz C180/);

  await expect
    // Все четыре фото карусели (миниатюры в волне на телефоне скрыты и не грузятся — так и задумано).
    .poll(() => section.locator('.ice__stage img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)))
    .toBe(true);
  expect(await hasHorizontalScroll(page)).toBe(false);
});

test('«Уже заказали в Японии» листается само, пока блок на экране', async ({ page }) => {
  await page.goto('./');
  const section = page.locator('#japan-cars');
  const caption = section.locator('.ice__car strong');
  await expect(caption).toHaveText('Mercedes-Benz C-класс Кабриолет');
  // Первую секунду главная сама возвращается к первому экрану, поэтому блок прокручиваем на каждой проверке:
  // карусель листается только видимой.
  await expect
    .poll(
      async () => {
        await section.evaluate((element) => element.scrollIntoView({ block: 'center' }));
        return caption.textContent();
      },
      { timeout: 12000, intervals: [500] },
    )
    .not.toBe('Mercedes-Benz C-класс Кабриолет');
});
