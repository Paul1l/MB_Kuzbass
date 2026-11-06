// Согласие на cookie и Яндекс Метрика на статичных страницах: 7 посадочных (public/<адрес>/index.html)
// и страницы каталога (scripts/generate-catalog-pages.mjs). Повторяет модель главной (src/privacyConsent.js,
// src/analytics.js, CookieBanner.jsx): тот же cookie выбора, те же тексты, счётчик грузится только после
// «Разрешить аналитику». Выбор, сделанный на главной, действует здесь, и наоборот.
// Подключается внешним файлом после analytics-config.js: политика безопасности (CSP) запрещает встроенные скрипты.
// После правки поменяйте ?v= в ссылке на этот файл во всех посадочных: браузеры до 7 дней берут его из кеша.
(() => {
  // Должна совпадать с PRIVACY_CONSENT_VERSION в src/privacyConsent.js — это проверяет scripts/verify-build.mjs.
  const CONSENT_VERSION = '2026-08-03';
  const PREFERENCES_COOKIE = 'mb_privacy_preferences';
  const PREFERENCES_MAX_AGE = 60 * 60 * 24 * 180;
  const METRIKA_SCRIPT_ID = 'mb-yandex-metrika';
  // Тип страницы — начало идентификатора цели: landing_telegram, product_phone, catalog_whatsapp.
  const pageType = document.currentScript?.dataset.page || 'landing';
  const config = window.MB_ANALYTICS_CONFIG || { counterId: 0 };
  const counterId = Number(config.counterId);
  let analyticsEnabled = false;
  let banner = null;

  // Читает выбор только для текущей версии документа о cookie (как readPrivacyPreferences).
  function readPreferences() {
    const prefix = `${PREFERENCES_COOKIE}=`;
    const item = document.cookie.split('; ').find((cookie) => cookie.startsWith(prefix));
    if (!item) return null;
    const [version, analyticsValue] = decodeURIComponent(item.slice(prefix.length)).split('.');
    if (version !== CONSENT_VERSION) return null;
    return { analytics: analyticsValue === 'analytics' };
  }

  // Сохраняет выбор на 180 дней для всего сайта (как savePrivacyPreferences на основном домене).
  function savePreferences(analytics) {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    const value = `${CONSENT_VERSION}.${analytics ? 'analytics' : 'necessary'}`;
    document.cookie = `${PREFERENCES_COOKIE}=${encodeURIComponent(value)}; Max-Age=${PREFERENCES_MAX_AGE}; Path=/; SameSite=Lax${secure}`;
    return { analytics };
  }

  // Загружает счётчик с теми же параметрами, что главная, и отправляет просмотр этой страницы.
  function enableAnalytics() {
    if (analyticsEnabled || !Number.isInteger(counterId) || counterId <= 0) return;
    analyticsEnabled = true;

    window.ym = window.ym || function metrikaQueue() {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = Date.now();

    const script = document.createElement('script');
    script.id = METRIKA_SCRIPT_ID;
    script.async = true;
    script.src = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`;
    // Блокировщик рекламы или сбой сети: страница работает дальше без аналитики.
    script.addEventListener('error', () => disableAnalytics(), { once: true });
    document.head.append(script);

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
    window.ym(counterId, 'hit', window.location.href, { title: document.title, referer: document.referrer });
  }

  // Останавливает счётчик и удаляет доступные ему cookie после отзыва согласия (как disableAnalytics).
  function disableAnalytics() {
    if (analyticsEnabled && typeof window.ym === 'function') window.ym(counterId, 'destruct');
    analyticsEnabled = false;
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

  function applyChoice(analytics) {
    savePreferences(analytics);
    closeBanner();
    if (analytics) enableAnalytics();
    else disableAnalytics();
  }

  // Создаёт элемент без innerHTML: тексты задаются как текст, не как разметка.
  function element(tag, attributes = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
    node.append(...children);
    return node;
  }

  function button(label, className, onClick) {
    const node = element('button', { type: 'button', class: className }, [label]);
    node.addEventListener('click', onClick);
    return node;
  }

  const policyLink = (label, className) => element('a', { class: className, href: '/#cookies' }, [label]);

  function closeBanner() {
    banner?.remove();
    banner = null;
  }

  // Первый вид — как плашка главной: «Разрешить аналитику», «Только необходимые», «Настроить», «Подробнее».
  function choiceView() {
    return [
      element('div', { class: 'seo-cookie__copy' }, [
        element('h2', { id: 'seo-cookie-title' }, ['Управление cookie']),
        element('p', {}, [
          'Необходимые cookie запоминают ваш выбор. Яндекс.Метрика включится только после отдельного разрешения на аналитику.',
          element('span', { class: 'seo-cookie__extra' }, [' Рекламные технологии не подключены.']),
        ]),
      ]),
      element('div', { class: 'seo-cookie__actions' }, [
        button('Разрешить аналитику', 'seo-button seo-button--primary', () => applyChoice(true)),
        button('Только необходимые', 'seo-button', () => applyChoice(false)),
        button('Настроить', 'seo-button seo-cookie__more', () => openBanner(true)),
        policyLink('Подробнее', 'seo-button seo-cookie__more'),
      ]),
    ];
  }

  // «Настройки cookie» — как на главной: необходимые включены всегда, аналитика — отдельной галочкой.
  function settingsView(preferences) {
    const analyticsInput = element('input', { type: 'checkbox' });
    analyticsInput.checked = Boolean(preferences?.analytics);
    const necessaryInput = element('input', { type: 'checkbox', checked: '', disabled: '' });
    const option = (input, title, text) =>
      element('label', { class: 'seo-cookie__option' }, [input, element('span', {}, [element('strong', {}, [title]), element('small', {}, [text])])]);

    return [
      element('div', { class: 'seo-cookie__copy' }, [
        element('h2', { id: 'seo-cookie-title' }, ['Настройки cookie']),
        element('p', {}, ['Вы можете изменить необязательные настройки в любое время через ссылку в подвале сайта.']),
      ]),
      element('div', { class: 'seo-cookie__options' }, [
        option(necessaryInput, 'Необходимые', 'Запоминают выбранные настройки. Эти cookie нужны для работы интерфейса.'),
        option(analyticsInput, 'Аналитика', 'Яндекс.Метрика помогает оценивать посещения и клики. Загружается только после согласия.'),
      ]),
      element('div', { class: 'seo-cookie__actions' }, [
        button('Сохранить выбор', 'seo-button seo-button--primary', () => applyChoice(analyticsInput.checked)),
        ...(preferences ? [button('Отмена', 'seo-button', closeBanner)] : []),
        policyLink('Политика cookie', 'seo-button'),
      ]),
    ];
  }

  function openBanner(showSettings) {
    closeBanner();
    const preferences = readPreferences();
    banner = element('div', { class: 'seo-cookie', role: 'region', 'aria-labelledby': 'seo-cookie-title' });
    banner.append(...(showSettings ? settingsView(preferences) : choiceView()));
    document.body.append(banner);
  }

  // Ссылка «Настройки cookie» в подвале: через неё политика cookie предлагает изменить или отозвать выбор.
  function addFooterSettingsLink() {
    const documentsLine = document.querySelector('.seo-footer a[href="/#cookies"]')?.parentElement;
    if (!documentsLine) return;
    documentsLine.append(' · ', button('Настройки cookie', 'seo-cookie-link', () => openBanner(true)));
  }

  // Цели по кнопкам связи. Суффикс — канал: под него в Метрике настроены цели «_telegram», «_phone», «_whatsapp».
  function contactChannel(href) {
    if (href.startsWith('tel:')) return 'phone';
    try {
      const { hostname } = new URL(href, window.location.href);
      if (hostname === 't.me' || hostname === 'telegram.me') return 'telegram';
      if (hostname === 'wa.me' || hostname === 'api.whatsapp.com') return 'whatsapp';
    } catch {
      // Неразборчивый адрес — не кнопка связи.
    }
    return null;
  }

  document.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
    const channel = link && contactChannel(link.getAttribute('href'));
    // Без согласия счётчика нет — и цель не отправляется.
    if (!channel || !analyticsEnabled || typeof window.ym !== 'function') return;
    window.ym(counterId, 'reachGoal', `${pageType}_${channel}`);
  });

  addFooterSettingsLink();
  const preferences = readPreferences();
  if (!preferences) openBanner(false);
  else if (preferences.analytics) enableAnalytics();
})();
