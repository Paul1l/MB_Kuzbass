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
  '.ice__text',
  '.particle-route',
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

// Фото-«окно» (как сайт-«окно» из примеров владельца): снимок чуть больше рамки и смещается за курсором,
// будто смотришь в окно на склад. Координаты курсора уходят в --wx/--wy от −1 до 1, сдвиг считает CSS
// (_motion.scss). Только для мыши; на телефоне снимок сдвигается при прокрутке средствами CSS.
export function initWindowParallax(root = document) {
  if (prefersReducedMotion() || !window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return () => {};

  const cleanups = [...root.querySelectorAll('[data-window]')].map((element) => {
    let frame = 0;
    let pointer = null;
    const handleMove = (event) => {
      pointer = event;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const rect = element.getBoundingClientRect();
        element.style.setProperty('--wx', (((pointer.clientX - rect.left) / rect.width) * 2 - 1).toFixed(3));
        element.style.setProperty('--wy', (((pointer.clientY - rect.top) / rect.height) * 2 - 1).toFixed(3));
      });
    };
    const handleLeave = () => {
      element.style.setProperty('--wx', '0');
      element.style.setProperty('--wy', '0');
    };
    element.addEventListener('pointermove', handleMove, { passive: true });
    element.addEventListener('pointerleave', handleLeave);
    return () => {
      element.removeEventListener('pointermove', handleMove);
      element.removeEventListener('pointerleave', handleLeave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

// Сцена «склад» (WarehouseScene, как примеры BORING и ARGON 18): пока сцена прокручивается, в --p уходит
// прогресс от 0 (фото на весь экран) до 1 (фото карточкой справа, слева текст), в --tx/--ty — положение
// курсора от −1 до 1 для наклона фото. Остальное считает CSS (_scene.scss). При «Уменьшить движение»
// сцена сразу в конечном виде и не следит за курсором.
export function initScene(element) {
  if (!element) return () => {};
  if (prefersReducedMotion()) {
    element.style.setProperty('--p', '1');
    element.classList.add('scene--static');
    return () => {};
  }

  let frame = 0;
  const update = () => {
    frame = 0;
    const rect = element.getBoundingClientRect();
    const range = Math.max(rect.height - window.innerHeight, 1);
    const raw = Math.min(Math.max(-rect.top / range, 0), 1);
    // Первые 12% прокрутки фото стоит на весь экран, последние 10% — сцена уже собрана.
    const progress = Math.min(Math.max((raw - 0.12) / 0.78, 0), 1);
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
    element.style.setProperty('--p', eased.toFixed(4));
    element.classList.toggle('is-assembled', eased > 0.85);
  };
  const handleScroll = () => {
    if (!frame) frame = window.requestAnimationFrame(update);
  };

  const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
  let pointerFrame = 0;
  let pointer = null;
  const handlePointerMove = (event) => {
    pointer = event;
    if (pointerFrame) return;
    pointerFrame = window.requestAnimationFrame(() => {
      pointerFrame = 0;
      element.style.setProperty('--tx', ((pointer.clientX / window.innerWidth) * 2 - 1).toFixed(3));
      element.style.setProperty('--ty', ((pointer.clientY / window.innerHeight) * 2 - 1).toFixed(3));
    });
  };
  const handlePointerLeave = () => {
    element.style.setProperty('--tx', '0');
    element.style.setProperty('--ty', '0');
  };

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      update();
      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll, { passive: true });
    } else {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    }
  });
  observer.observe(element);
  if (finePointer) {
    element.addEventListener('pointermove', handlePointerMove, { passive: true });
    element.addEventListener('pointerleave', handlePointerLeave);
  }

  return () => {
    observer.disconnect();
    window.removeEventListener('scroll', handleScroll);
    window.removeEventListener('resize', handleScroll);
    element.removeEventListener('pointermove', handlePointerMove);
    element.removeEventListener('pointerleave', handlePointerLeave);
    if (frame) window.cancelAnimationFrame(frame);
    if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
  };
}
