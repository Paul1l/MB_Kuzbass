const METRIKA_SCRIPT_ID = 'mb-yandex-metrika';
let initializationPromise = null;
let initializedCounterId = null;

// Читает публичную конфигурацию. Номер счетчика не является секретом, но по умолчанию равен нулю.
function getConfig() {
  if (typeof window === 'undefined') return { counterId: 0 };
  return window.MB_ANALYTICS_CONFIG || { counterId: 0 };
}

// Проверяет, указан ли корректный положительный номер счетчика.
export function isAnalyticsConfigured() {
  return Number.isInteger(Number(getConfig().counterId)) && Number(getConfig().counterId) > 0;
}

// Загружает внешний скрипт Метрики только после явного согласия пользователя.
function loadMetrikaScript() {
  if (window.ym) return Promise.resolve();
  if (initializationPromise) return initializationPromise;

  initializationPromise = new Promise((resolve, reject) => {
    window.ym = window.ym || function metrikaQueue() {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = Date.now();

    const script = document.createElement('script');
    script.id = METRIKA_SCRIPT_ID;
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', () => {
      initializationPromise = null;
      script.remove();
      delete window.ym;
      reject(new Error('Не удалось загрузить Яндекс Метрику'));
    }, { once: true });
    document.head.append(script);
  });

  return initializationPromise;
}

// Инициализирует Метрику в ограниченном режиме без Вебвизора и автоматической аналитики форм.
export async function enableAnalytics() {
  if (!isAnalyticsConfigured()) return false;
  const counterId = Number(getConfig().counterId);
  if (initializedCounterId === counterId) return true;

  await loadMetrikaScript();
  window.ym(counterId, 'init', {
    defer: true,
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: false,
  });
  initializedCounterId = counterId;
  return true;
}

// Удаляет известные first-party cookie Метрики после отзыва согласия и останавливает счетчик.
export function disableAnalytics() {
  const counterId = initializedCounterId;
  if (counterId && window.ym) window.ym(counterId, 'destruct');
  initializedCounterId = null;
  initializationPromise = null;
  document.getElementById(METRIKA_SCRIPT_ID)?.remove();
  delete window.ym;

  document.cookie
    .split('; ')
    .map((cookie) => cookie.split('=')[0])
    .filter((name) => name.startsWith('_ym_'))
    .forEach((name) => {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    });
}

// Отправляет виртуальный просмотр текущего SPA/hash-адреса после инициализации счетчика.
export function trackPageView(url = window.location.href, title = document.title) {
  if (!initializedCounterId || !window.ym) return;
  window.ym(initializedCounterId, 'hit', url, { title, referer: document.referrer });
}

// Отправляет только заранее определенные обезличенные цели по действиям с кнопками.
export function trackGoal(goalName) {
  if (!initializedCounterId || !window.ym) return;
  window.ym(initializedCounterId, 'reachGoal', goalName);
}
