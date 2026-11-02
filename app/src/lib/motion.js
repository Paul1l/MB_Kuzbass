// Анимации главной: плитки проявляются из размытия при прокрутке и подсветка карточек под курсором.
// Если в системе включено «Уменьшить движение», появление не включается и всё видно сразу.
// Первый экран (.hero) не анимируется: заголовок и форма должны быть видны без задержки.

const revealSelector = [
  '.section-head',
  '.category-card',
  '.pill-row',
  '.product-card',
  '.step',
  '.direction-card',
  '.car-card',
  '.trust-rating',
  '.trust-card',
  '.review-card',
  '.contacts__main',
  '.contacts__photo',
  '.contacts__more',
].join(',');

const spotlightSelector = '.category-card, .trust-card, .step';

// Нужна всем анимациям: true, если посетитель просил систему уменьшить движение на экране.
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

// Нужна для счётчиков и появления: анимация имеет смысл, только если её можно запустить при показе на экране.
export function canAnimateOnView() {
  return typeof window !== 'undefined' && 'IntersectionObserver' in window && !prefersReducedMotion();
}

// Помечает плитки и, когда плитка заходит в окно, запускает появление. Плитки, пришедшие в одной пачке
// (например, ряд каталога), проявляются по очереди с шагом 80 мс. Возвращает функцию отключения.
export function initReveal(root = document) {
  if (!canAnimateOnView()) return () => {};
  const elements = [...root.querySelectorAll(revealSelector)].filter((element) => !element.closest('.hero'));
  if (!elements.length) return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry, index) => {
          entry.target.style.setProperty('--reveal-index', String(Math.min(index, 5)));
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.1 },
  );

  elements.forEach((element) => {
    element.setAttribute('data-reveal', '');
    observer.observe(element);
  });
  // Класс включает скрытое начальное состояние только после разметки: без JS или при ошибке всё видно.
  document.documentElement.classList.add('reveal-ready');

  return () => {
    observer.disconnect();
    document.documentElement.classList.remove('reveal-ready');
  };
}

// Подсветка под курсором (как «spotlight card»): карточка получает координаты курсора в --spot-x/--spot-y,
// CSS рисует по ним мягкое пятно. Только для мыши: на телефоне курсора нет.
export function initSpotlight(root = document) {
  if (typeof window === 'undefined' || !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) {
    return () => {};
  }
  root.querySelectorAll(spotlightSelector).forEach((element) => element.setAttribute('data-spotlight', ''));

  let frame = 0;
  let pending = null;
  function handlePointerMove(event) {
    const card = event.target instanceof Element ? event.target.closest('[data-spotlight]') : null;
    if (!card) return;
    pending = { card, x: event.clientX, y: event.clientY };
    if (frame) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      const rect = pending.card.getBoundingClientRect();
      pending.card.style.setProperty('--spot-x', `${pending.x - rect.left}px`);
      pending.card.style.setProperty('--spot-y', `${pending.y - rect.top}px`);
    });
  }

  document.addEventListener('pointermove', handlePointerMove, { passive: true });
  return () => {
    document.removeEventListener('pointermove', handlePointerMove);
    if (frame) window.cancelAnimationFrame(frame);
  };
}
