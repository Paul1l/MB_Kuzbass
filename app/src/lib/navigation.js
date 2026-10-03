// Нужна для SPA-каталога. Достает slug категории из hash вида #catalog/engines.
export function getCatalogSlugFromHash(hash) {
  const cleanHash = (hash || '').replace(/^#/, '');
  if (!cleanHash.startsWith('catalog/')) return null;
  return decodeURIComponent(cleanHash.slice('catalog/'.length));
}

// Прокручивает к разделу из hash с учетом высоты липкой шапки.
function scrollToPageAnchor(hash = window.location.hash) {
  const targetId = decodeURIComponent((hash || '').replace(/^#/, ''));
  if (!targetId || targetId.startsWith('catalog/')) return;

  const target = document.getElementById(targetId);
  if (!target) return;

  const header = document.querySelector('.site-header');
  const headerHeight = header ? header.getBoundingClientRect().height : 72;
  const nextTop = window.scrollY + target.getBoundingClientRect().top - headerHeight - 12;

  window.scrollTo({ top: Math.max(0, nextTop), left: 0, behavior: 'auto' });
}

// Повторяет прокрутку к якорю несколько раз: картинки и адаптивные блоки догружаются и сдвигают раздел
// уже после первой прокрутки.
export function schedulePageAnchorScroll(hash = window.location.hash) {
  if (!hash || hash.startsWith('#catalog/')) return;

  window.requestAnimationFrame(() => scrollToPageAnchor(hash));
  [80, 240, 700].forEach((delay) => {
    window.setTimeout(() => scrollToPageAnchor(hash), delay);
  });
}

// Не дает браузеру восстановить старую позицию прокрутки, когда главная открывается заново.
export function schedulePageTopReset() {
  const resetScroll = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

  window.requestAnimationFrame(resetScroll);
  [80, 240, 700].forEach((delay) => {
    window.setTimeout(resetScroll, delay);
  });
}
