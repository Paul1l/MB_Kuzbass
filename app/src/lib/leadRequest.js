import { site } from '../data.js';

// Нужна для форм заявки. Собирает ответы формы в готовый текст для отправки в Telegram.
export function createRequestText(kind, formData) {
  const field = (name, fallback) => String(formData.get(name) || '').trim() || fallback;
  const consentTimestamp = new Date().toISOString();
  const details =
    kind === 'car'
      ? [
          'Заявка с сайта MB Kuzbass: автомобиль из Японии',
          `Автомобиль: ${field('car', 'не указан')}`,
          `Куда доставить: ${field('city', 'не указано')}`,
        ]
      : [
          'Заявка с сайта MB Kuzbass: запчасть',
          `Автомобиль или VIN: ${field('vehicle', 'не указан')}`,
          `Деталь: ${field('part', 'не указана')}`,
        ];

  return [
    ...details,
    `Согласие на обработку ПДн: дано ${consentTimestamp}`,
    `Редакция согласия: ${site.updatedAt}`,
    `Документ: ${new URL('#consent', site.url).href}`,
  ].join('\n');
}

// Копирует текст через выделение скрытого поля. Работает синхронно, поэтому успевает до того, как форма откроет
// Telegram в новой вкладке и страница потеряет фокус. Поле скрыто от Вебвизора, как и сама форма.
function copyWithSelection(text) {
  const previousFocus = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.className = 'ym-hide-content ym-disable-keys';
  field.setAttribute('readonly', '');
  field.setAttribute('aria-hidden', 'true');
  Object.assign(field.style, { position: 'absolute', left: '-9999px', top: `${window.scrollY}px`, fontSize: '16px' });
  document.body.append(field);
  field.select();
  field.setSelectionRange(0, text.length);

  let copied;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }

  field.remove();
  if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
  return copied;
}

// Нужна для ускорения заявки. Копирует подготовленный текст в буфер обмена в момент нажатия; если старый способ
// недоступен, запускает Clipboard API в том же нажатии. Возвращает Promise с результатом.
export function copyRequestText(text) {
  if (copyWithSelection(text)) return Promise.resolve(true);
  if (!navigator.clipboard) return Promise.resolve(false);

  return navigator.clipboard.writeText(text).then(
    () => true,
    () => false,
  );
}
