const METRIKA_SCRIPT_ID = 'mb-yandex-metrika';
let initializationPromise = null;
let initializedCounterId = null;
let enableJob = null;
let lastTrackedUrl = null;

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
function loadMetrikaScript(counterId) {
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
    script.src = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`;
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

// Инициализирует счетчик после согласия. Первый и последующие SPA-просмотры
// отправляются вручную через trackPageView, поэтому автоматический hit отключен.
// Повторные вызовы, пока скрипт грузится (смена страницы SPA сразу после согласия),
// ждут ту же загрузку: иначе init уходил дважды. Отзыв согласия во время загрузки
// отменяет init.
export function enableAnalytics() {
  if (!isAnalyticsConfigured()) return Promise.resolve(false);
  const config = getConfig();
  const counterId = Number(config.counterId);
  if (initializedCounterId === counterId) return Promise.resolve(true);
  if (enableJob) return enableJob;

  const job = loadMetrikaScript(counterId).then(() => {
    if (enableJob !== job) return false;
    window.dataLayer = window.dataLayer || [];
    window.ym(counterId, 'init', {
      defer: true,
      ssr: true,
      webvisor: config.webvisor === true,
      clickmap: true,
      ecommerce: config.ecommerceContainer || false,
      referrer: document.referrer,
      url: window.location.href,
      trackLinks: true,
      accurateTrackBounce: true,
    });
    initializedCounterId = counterId;
    enableJob = null;
    return true;
  });
  enableJob = job;
  job.catch(() => {
    if (enableJob === job) enableJob = null;
  });
  return job;
}

// Метрика ставит cookie на домен второго уровня (.mb-kuzbass.ru): без Domain такую
// cookie удалить нельзя. Пробуем все варианты — лишние браузер просто игнорирует.
function forgetMetrikaCookies() {
  const hostname = window.location.hostname;
  const domains = ['', hostname, `.${hostname}`, `.${hostname.split('.').slice(-2).join('.')}`];

  document.cookie
    .split('; ')
    .map((cookie) => cookie.split('=')[0])
    .filter((name) => name.startsWith('_ym'))
    .forEach((name) => {
      domains.forEach((domain) => {
        document.cookie = `${name}=; Max-Age=0; Path=/${domain ? `; Domain=${domain}` : ''}; SameSite=Lax`;
      });
    });

  // Идентификатор посетителя Метрика дублирует в localStorage (_ym_uid и др.).
  try {
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith('_ym'))
      .forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Хранилище недоступно (приватный режим) — удалять нечего.
  }
}

// Удаляет известные first-party cookie Метрики после отзыва согласия и останавливает счетчик.
export function disableAnalytics() {
  const counterId = initializedCounterId;
  if (counterId && window.ym) window.ym(counterId, 'destruct');
  initializedCounterId = null;
  initializationPromise = null;
  enableJob = null;
  lastTrackedUrl = null;
  document.getElementById(METRIKA_SCRIPT_ID)?.remove();
  delete window.ym;
  forgetMetrikaCookies();
}

// Отправляет виртуальный просмотр текущего SPA/hash-адреса после инициализации счетчика.
export function trackPageView(url = window.location.href, title = document.title) {
  if (!initializedCounterId || !window.ym || lastTrackedUrl === url) return;

  window.ym(initializedCounterId, 'hit', url, {
    title,
    referer: lastTrackedUrl || document.referrer,
  });
  lastTrackedUrl = url;
}

// Отправляет только заранее определенные обезличенные цели по действиям с кнопками.
export function trackGoal(goalName) {
  if (!initializedCounterId || !window.ym) return;
  window.ym(initializedCounterId, 'reachGoal', goalName);
}
