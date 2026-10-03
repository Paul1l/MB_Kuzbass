import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  brandAvatar,
  brandBackdropImage,
  catalog,
  catalogCards,
  commerce,
  contact,
  createMessengerUrl,
  directions,
  donorModels,
  dromListingsLabel,
  featuredProducts,
  heroImages,
  japanCars,
  landingPages,
  legalDocs,
  owner,
  purchaseSteps,
  reviews,
  reviewsMeta,
  reviewsProvider,
  site,
  trustPoints,
} from './data.js';
import { isOnlineReviewsConfigured, loadOnlineReviewsMeta } from './onlineReviews.js';
import { disableAnalytics, enableAnalytics, trackGoal, trackPageView } from './analytics.js';
import { readPrivacyPreferences, savePrivacyPreferences } from './privacyConsent.js';

// Прозрачная точка вместо фото первого экрана на телефоне: там фото скрыто, и браузер не скачивает лишнее.
const EMPTY_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Контуры иконок 24×24. Рисуются линией текущего цвета текста.
const iconPaths = {
  phone: ['M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'],
  send: ['M21 4L3 11l7 2 2 7 9-16z', 'M10 13l4-3'],
  star: ['M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z'],
  layers: ['M12 3l9 5-9 5-9-5z', 'M3 13l9 5 9-5'],
  pin: ['M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z', 'M14.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z'],
  truck: [
    'M3 6h11v10H3z',
    'M14 9h4l3 3v4h-7',
    'M8.8 17.5a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0z',
    'M19.3 17.5a1.8 1.8 0 1 1-3.6 0 1.8 1.8 0 0 1 3.6 0z',
  ],
  tag: ['M3 12V4h8l10 10-8 8z', 'M9 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z'],
  search: ['M17.5 11a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z', 'M20 20l-4.2-4.2'],
  camera: ['M4 7h3l2-2h6l2 2h3v12H4z', 'M15.5 13a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z'],
  shield: ['M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z', 'M8.5 12l2.5 2.5 4.5-5'],
  menu: ['M4 7h16M4 12h16M4 17h16'],
  close: ['M6 6l12 12M18 6L6 18'],
};

// Нужна для иконок в интерфейсе. Иконка декоративная: смысл передает подпись рядом.
function Icon({ name, size = 20 }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {iconPaths[name].map((path) => (
        <path d={path} key={path} />
      ))}
    </svg>
  );
}

// Нужна для форм заявки. Собирает ответы формы в готовый текст для отправки в Telegram.
function createRequestText(kind, formData) {
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
function copyRequestText(text) {
  if (copyWithSelection(text)) return Promise.resolve(true);
  if (!navigator.clipboard) return Promise.resolve(false);

  return navigator.clipboard.writeText(text).then(
    () => true,
    () => false,
  );
}

// Нужна для SPA-каталога. Достает slug категории из hash вида #catalog/engines.
function getCatalogSlugFromHash(hash) {
  const cleanHash = (hash || '').replace(/^#/, '');
  if (!cleanHash.startsWith('catalog/')) return null;
  return decodeURIComponent(cleanHash.slice('catalog/'.length));
}

// Keeps hash navigation stable after images and responsive sections change page height.
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

// Runs anchor alignment several times because late image sizing can shift the section after the first scroll.
function schedulePageAnchorScroll(hash = window.location.hash) {
  if (!hash || hash.startsWith('#catalog/')) return;

  window.requestAnimationFrame(() => scrollToPageAnchor(hash));
  [80, 240, 700].forEach((delay) => {
    window.setTimeout(() => scrollToPageAnchor(hash), delay);
  });
}

// Prevents the browser from restoring an old scroll position when the main page is opened again.
function schedulePageTopReset() {
  const resetScroll = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

  window.requestAnimationFrame(resetScroll);
  [80, 240, 700].forEach((delay) => {
    window.setTimeout(resetScroll, delay);
  });
}

// Keeps image areas useful when a cached page points at an asset that has
// already been replaced during deployment.
function createImageFallbackHandler(fallbackUrl) {
  return (event) => {
    const image = event.currentTarget;
    if (image.dataset.fallbackApplied === 'true') return;

    image.dataset.fallbackApplied = 'true';
    image.classList.add('is-fallback');
    image.src = fallbackUrl;
  };
}

const handleImageError = createImageFallbackHandler(brandBackdropImage);

// Нужна для шапки сайта: адрес и режим, бренд, меню, телефон и Telegram. На телефоне меню открывается кнопкой.
function Header({ menuOpen, onToggleMenu, onCloseMenu }) {
  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <span>
            {contact.address} · {contact.workTime}
          </span>
          <span>Запчасти и автомобили из Японии · отправка по всей России</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container site-header__inner">
          <a className="brand" href="#top" onClick={onCloseMenu}>
            <img className="brand__logo" src={brandAvatar} alt="Логотип MB Kuzbass" width="48" height="48" />
            <span className="brand__text">
              <strong>{site.shortName}</strong>
              <small>Запчасти и авто из Японии</small>
            </span>
          </a>

          <nav id="site-nav" className={`nav${menuOpen ? ' is-open' : ''}`} aria-label="Основное меню" onClick={onCloseMenu}>
            <a href="#catalog">Каталог</a>
            <a href="/avtomobili-iz-yaponii-barnaul/">Авто из Японии</a>
            <a href="/dvigateli-akpp-mercedes-bmw-barnaul/">Двигатели и АКПП</a>
            <a href="/postavki-dlya-avtorazborov-barnaul/">Для разборов</a>
            <a href="#contacts">Контакты</a>
          </nav>

          <div className="site-header__actions">
            <a className="header-phone" href={contact.phoneHref} onClick={() => trackGoal('header_phone')}>
              <Icon name="phone" />
              <span className="header-phone__text">
                <strong>{contact.phone}</strong>
                <small>пн–пт 9:00–18:00</small>
              </span>
            </a>
            <a
              className="button button--dark header-telegram"
              href={createMessengerUrl(contact.telegram)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGoal('header_telegram')}
            >
              <Icon name="send" size={18} />
              Telegram
            </a>
            <button
              className="menu-toggle"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="site-nav"
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
              onClick={onToggleMenu}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

// Нужна для мобильной версии. Держит звонок и мессенджеры на экране, пока посетитель листает страницу.
function MobileContactBar() {
  return (
    <nav className="mobile-contact-bar" aria-label="Быстрая связь">
      <a className="mobile-contact-bar__phone" href={contact.phoneHref} onClick={() => trackGoal('mobile_bar_phone')}>
        Позвонить
      </a>
      <a
        href={createMessengerUrl(contact.telegram)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackGoal('mobile_bar_telegram')}
      >
        Telegram
      </a>
      <a
        href={createMessengerUrl(contact.whatsapp)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackGoal('mobile_bar_whatsapp')}
      >
        WhatsApp
      </a>
    </nav>
  );
}

// Нужна под формой заявки: что произошло после нажатия и запасная ссылка, если вкладка не открылась.
function FormStatus({ status }) {
  if (!status) return null;

  return (
    <p className="form-status">
      {status === 'copied'
        ? 'Текст заявки скопирован. Вставьте его в чат Telegram и отправьте.'
        : 'Текст не скопировался. Напишите в чате Telegram модель, VIN и что нужно.'}{' '}
      <a href={contact.telegram} target="_blank" rel="noopener noreferrer">
        Чат не открылся? Открыть @MB_Kuzbass
      </a>
    </p>
  );
}

// Нужна для обеих форм первого экрана: отдельное согласие на обработку ПДн со ссылкой на документ.
function ConsentCheckbox({ id, onOpenLegal }) {
  return (
    <label className="privacy-check" htmlFor={id}>
      <input id={id} type="checkbox" name="agree" required />
      <span>
        Даю отдельное согласие на обработку персональных данных на условиях документа{' '}
        <LegalLink doc={legalDocs.find((doc) => doc.id === 'consent')} onOpen={onOpenLegal} />.
      </span>
    </label>
  );
}

// Нужна для карточек каталога. Показывает фото товара, а если файл недоступен — запасное изображение.
function CatalogProductGallery({ product }) {
  const [activeImage, setActiveImage] = useState(0);
  const totalImages = product.images.length;
  const currentImage = product.images[activeImage];

  const showPrevious = () => {
    setActiveImage((current) => (current - 1 + totalImages) % totalImages);
  };

  const showNext = () => {
    setActiveImage((current) => (current + 1) % totalImages);
  };

  return (
    <div className="catalog-product-card__media">
      <a
        className="catalog-product-card__image-link"
        href={currentImage}
        target="_blank"
        rel="noopener noreferrer"
        title={`Открыть фото: ${product.title}`}
      >
        <img
          src={currentImage}
          alt={totalImages > 1 ? `${product.alt}, ракурс ${activeImage + 1}` : product.alt}
          width="800"
          height="600"
          loading="lazy"
          decoding="async"
          onError={handleImageError}
        />
      </a>

      {totalImages > 1 && (
        <>
          <button
            className="catalog-product-card__gallery-button catalog-product-card__gallery-button--previous"
            type="button"
            onClick={showPrevious}
            aria-label={`Предыдущее фото: ${product.title}`}
            title="Предыдущее фото"
          >
            ‹
          </button>
          <button
            className="catalog-product-card__gallery-button catalog-product-card__gallery-button--next"
            type="button"
            onClick={showNext}
            aria-label={`Следующее фото: ${product.title}`}
            title="Следующее фото"
          >
            ›
          </button>
          <span className="catalog-product-card__gallery-count" aria-live="polite">
            {activeImage + 1} / {totalImages}
          </span>
        </>
      )}
    </div>
  );
}

// Нужна для карточек «Уже заказали в Японии». Стрелки стоят под фото, чтобы не закрывать машину и табличку;
// на телефоне свайп листает сами карточки, как в «Примерах с нашего склада». Следующее фото грузится при листании.
function JapanCarCard({ car }) {
  const [activePhoto, setActivePhoto] = useState(0);
  const totalPhotos = car.photos.length;
  const photo = car.photos[activePhoto];
  const showPhoto = (delta) => setActivePhoto((current) => (current + delta + totalPhotos) % totalPhotos);

  return (
    <article className="car-card">
      <div className="car-card__media">
        <img src={photo.src} alt={photo.alt} width="840" height="560" loading="lazy" decoding="async" />
        <span className="tag">Фото из Японии</span>
      </div>
      <div className="car-card__body">
        <div className="car-card__meta">
          <span className="car-card__code mono">Кузов {car.code}</span>
          {totalPhotos > 1 && (
            <div className="car-card__nav">
              <button
                type="button"
                onClick={() => showPhoto(-1)}
                aria-label={`Предыдущее фото: ${car.title}`}
                title="Предыдущее фото"
              >
                ‹
              </button>
              <span aria-live="polite">
                {activePhoto + 1} / {totalPhotos}
              </span>
              <button
                type="button"
                onClick={() => showPhoto(1)}
                aria-label={`Следующее фото: ${car.title}`}
                title="Следующее фото"
              >
                ›
              </button>
            </div>
          )}
        </div>
        <h3>{car.title}</h3>
        <a
          className="button button--dark"
          href={createMessengerUrl(
            contact.telegram,
            `Хочу похожий автомобиль из Японии: ${car.query}. Бюджет и годы выпуска:`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackGoal('japan_car_telegram')}
        >
          <Icon name="send" size={18} />
          Хочу похожий
        </a>
      </div>
    </article>
  );
}

// Нужна для SPA-страниц каталога. Показывает выбранную категорию, карточки позиций и CTA для запроса в Telegram.
function CatalogCategoryPage({ category }) {
  return (
    <section className="catalog-page">
      <div className="container catalog-page__inner">
        <a className="catalog-page__back" href="#catalog">
          ← Вернуться к категориям
        </a>

        <div className="catalog-page__hero">
          <span>Каталог запчастей</span>
          <h1>{category.label}</h1>
          <p>{category.description}</p>
          <div className="catalog-page__actions">
            <a
              className="button button--accent"
              href={createMessengerUrl(contact.telegram, `Интересует раздел «${category.label}».`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGoal('catalog_telegram')}
            >
              <Icon name="send" size={18} />
              Уточнить наличие в Telegram
            </a>
            <a className="button button--outline" href={contact.phoneHref} onClick={() => trackGoal('catalog_phone')}>
              Позвонить
            </a>
          </div>
          <p className="catalog-page__notice">
            Информационная витрина: наличие, состояние, комплектность и цена подтверждаются менеджером.
            Заказ и оплата на сайте не оформляются.
          </p>
        </div>

        <div className="catalog-products" aria-label={`Каталог: ${category.label}`}>
          {category.items.map((item) => (
            <article className="catalog-product-card" key={item.title}>
              <CatalogProductGallery product={item} />
              <div className="catalog-product-card__body">
                <span>{item.meta}</span>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <a
                  className="button button--dark"
                  href={createMessengerUrl(contact.telegram, `Интересует: ${item.title}. Есть в наличии?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackGoal('catalog_item_telegram')}
                >
                  Узнать цену и наличие
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// Нужна для footer-документов. Открывает выбранный юридический документ в модальном окне без перезагрузки страницы.
function LegalLink({ doc, onOpen }) {
  if (!doc) return null;

  return (
    <a
      href={`#${doc.id}`}
      onClick={(event) => {
        event.preventDefault();
        if (typeof window !== 'undefined' && window.location.hash !== `#${doc.id}`) {
          window.history.pushState(null, '', `#${doc.id}`);
        }
        onOpen(doc.id);
      }}
    >
      {doc.footerLabel}
    </a>
  );
}

// Нужна для правовой информации. Показывает выбранный документ поверх страницы, не растягивая основной лендинг.
function LegalModal({ doc, onClose }) {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const openerRef = useRef(null);

  // Блокирует прокрутку страницы, удерживает фокус внутри документа и возвращает его инициатору после закрытия.
  useEffect(() => {
    if (!doc) return undefined;

    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    function keepFocusInside(event) {
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusableElements = Array.from(
        panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (!focusableElements.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', keepFocusInside);
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', keepFocusInside);
      openerRef.current?.focus();
    };
  }, [doc]);

  if (!doc) return null;

  return (
    <div className="legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-title">
      <button className="legal-modal__backdrop" type="button" aria-label="Закрыть документ" onClick={onClose} />
      <article className="legal-modal__panel" ref={panelRef} tabIndex="-1">
        <div className="legal-modal__head">
          <div>
            <p>Правовая информация</p>
            <h2 id="legal-title">{doc.title}</h2>
          </div>
          <button className="legal-modal__close" type="button" onClick={onClose} ref={closeButtonRef}>
            Закрыть
          </button>
        </div>
        <p className="legal-modal__lead">{doc.lead}</p>
        <div className="legal-modal__body">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h3>{section.heading}</h3>
              <p>{section.text}</p>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}

// Показывает отдельный выбор для обязательных cookie и необязательной аналитики.
function CookieBanner({ preferences, initialSettings = false, onSave, onClose, onOpenDocument }) {
  const [showSettings, setShowSettings] = useState(initialSettings);
  const [analyticsAllowed, setAnalyticsAllowed] = useState(Boolean(preferences?.analytics));

  if (showSettings) {
    return (
      <div className="cookie-banner" role="region" aria-labelledby="cookie-settings-title">
        <div className="cookie-banner__copy">
          <h2 id="cookie-settings-title">Настройки cookie</h2>
          <p>Вы можете изменить необязательные настройки в любое время через ссылку в подвале сайта.</p>
        </div>
        <div className="cookie-options">
          <label className="cookie-option">
            <input type="checkbox" checked disabled />
            <span>
              <strong>Необходимые</strong>
              <small>Запоминают выбранные настройки. Эти cookie нужны для работы интерфейса.</small>
            </span>
          </label>
          <label className="cookie-option">
            <input
              type="checkbox"
              checked={analyticsAllowed}
              onChange={(event) => setAnalyticsAllowed(event.target.checked)}
            />
            <span>
              <strong>Аналитика</strong>
              <small>Яндекс.Метрика помогает оценивать посещения и клики. Загружается только после согласия.</small>
            </span>
          </label>
        </div>
        <div className="cookie-banner__actions">
          <button className="button button--primary" type="button" onClick={() => onSave(analyticsAllowed)}>
            Сохранить выбор
          </button>
          {preferences && (
            <button className="button" type="button" onClick={onClose}>
              Отмена
            </button>
          )}
          <button className="button" type="button" onClick={() => onOpenDocument('cookies')}>
            Политика cookie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cookie-banner" role="region" aria-label="Выбор cookie">
      <div className="cookie-banner__copy">
        <h2>Управление cookie</h2>
        <p>
          Необходимые cookie запоминают ваш выбор. Яндекс.Метрика включится только после отдельного
          разрешения на аналитику. Рекламные технологии не подключены.
        </p>
      </div>
      <div className="cookie-banner__actions">
        <button className="button button--primary" type="button" onClick={() => onSave(true)}>
          Разрешить аналитику
        </button>
        <button className="button" type="button" onClick={() => onSave(false)}>
          Только необходимые
        </button>
        <button className="button" type="button" onClick={() => setShowSettings(true)}>
          Настроить
        </button>
        <button className="button" type="button" onClick={() => onOpenDocument('cookies')}>
          Подробнее
        </button>
      </div>
    </div>
  );
}

// Нужна для нижней части сайта: бренд и реквизиты, ссылки на разделы и юридические документы.
function Footer({ onOpenLegal, onOpenPrivacySettings }) {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__columns">
          <div className="footer__brand">
            <a className="brand brand--footer" href="#top">
              <img className="brand__logo" src={brandAvatar} alt="Логотип MB Kuzbass" width="44" height="44" />
              <span className="brand__text">
                <strong>{site.name}</strong>
              </span>
            </a>
            <p>
              Контрактные запчасти Mercedes-Benz и BMW с японских доноров, автомобили с аукционов Японии и
              поставки для авторазборов. {site.city}.
            </p>
            <p className="footer__requisites">
              {owner.name} · ИНН {owner.inn} · ОГРНИП {owner.ogrnip}
            </p>
          </div>

          <nav className="footer__nav" aria-label="Разделы сайта">
            <h3>Разделы</h3>
            {landingPages.map((page) => (
              <a href={page.href} key={page.href}>
                {page.label}
              </a>
            ))}
          </nav>

          <nav className="footer__nav" aria-label="Документы сайта">
            <h3>Документы</h3>
            {legalDocs.map((doc) => (
              <LegalLink doc={doc} onOpen={onOpenLegal} key={doc.id} />
            ))}
            <button type="button" onClick={onOpenPrivacySettings}>
              Настройки cookie
            </button>
          </nav>
        </div>

        <p className="footer__bottom">
          © 2026 {site.name}. Информационная витрина: заказы и платежи на сайте не принимаются, наличие,
          состояние и цена подтверждаются при обращении. Обновлено: {site.updatedAt}.
        </p>
        <p className="footer__note">
          Сайт не является официальным дилером или представительством Mercedes-Benz и BMW. Товарные знаки
          принадлежат их правообладателям и используются для описания совместимости товаров.
          {commerce.acceptsPaymentsOnSite ? '' : ' Онлайн-оплата на сайте не подключена.'}
        </p>
      </div>
    </footer>
  );
}

// Нужна как корневой компонент. Собирает SEO-состояние, SPA-каталог, отзывы, формы заявки,
// footer-документы и cookie-плашку в одну страницу.
function App() {
  const [formStatus, setFormStatus] = useState({ parts: '', car: '' });
  const [heroMode, setHeroMode] = useState('parts');
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLegalId, setActiveLegalId] = useState(null);
  const [privacyPreferences, setPrivacyPreferences] = useState(() => readPrivacyPreferences());
  const [privacyPanelOpen, setPrivacyPanelOpen] = useState(() => !readPrivacyPreferences());
  const [currentReviewsMeta, setCurrentReviewsMeta] = useState(() => ({ ...reviewsMeta, isLive: false }));
  const onlineReviewsConfigured = useMemo(() => isOnlineReviewsConfigured(reviewsProvider), []);
  const [reviewsSyncStatus, setReviewsSyncStatus] = useState(onlineReviewsConfigured ? 'loading' : 'static');
  const [catalogSlug, setCatalogSlug] = useState(() =>
    typeof window === 'undefined' ? null : getCatalogSlugFromHash(window.location.hash),
  );
  const partInputRef = useRef(null);
  const ratingDetails = [currentReviewsMeta.ratingCount, currentReviewsMeta.reviewCount].filter(Boolean).join(', ');
  const reviewsStatusText =
    reviewsSyncStatus === 'loading'
      ? 'обновляем 2ГИС'
      : currentReviewsMeta.isLive
        ? currentReviewsMeta.updatedLabel
        : '';
  const flampReview = reviews.find((review) => review.source === 'Фламп');
  const activeLegalDoc = useMemo(
    () => legalDocs.find((doc) => doc.id === activeLegalId),
    [activeLegalId],
  );
  const activeCatalogCategory = useMemo(
    () => catalog.find((item) => item.slug === catalogSlug),
    [catalogSlug],
  );

  // Closes a legal document and clears its hash so a refresh does not reopen the modal.
  const closeLegalDocument = useCallback(() => {
    const legalDocId = window.location.hash.replace(/^#/, '');
    const hasLegalDocHash = legalDocs.some((doc) => doc.id === legalDocId);

    if (hasLegalDocHash) {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}`,
      );
    }

    setActiveLegalId(null);
  }, []);

  // Загружает Метрику только после согласия, учитывает смену SPA-страницы и
  // удаляет доступные cookie счетчика после отзыва согласия.
  useEffect(() => {
    let isActive = true;

    if (!privacyPreferences?.analytics) {
      disableAnalytics();
      return undefined;
    }

    const analyticsTitle = activeCatalogCategory
      ? `${activeCatalogCategory.label} — каталог MB Kuzbass`
      : activeLegalDoc
        ? `${activeLegalDoc.title} — ${site.shortName}`
        : document.title;

    enableAnalytics()
      .then((enabled) => {
        if (isActive && enabled) {
          trackPageView(window.location.href, analyticsTitle);
        }
      })
      .catch(() => {
        // Сбой внешней аналитики не влияет на работу витрины и формы.
      });

    return () => {
      isActive = false;
    };
  }, [activeCatalogCategory, activeLegalDoc, privacyPreferences?.analytics]);

  // Закрывает документ и меню по Escape, чтобы они не мешали просмотру сайта.
  useEffect(() => {
    // Нужна для клавиатурного закрытия. При Escape сбрасывает выбранный документ и закрывает меню.
    function handleEscape(event) {
      if (event.key !== 'Escape') return;
      closeLegalDocument();
      setMenuOpen(false);
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeLegalDocument]);

  // Синхронизирует hash URL с состоянием SPA-каталога и сбрасывает прокрутку при открытии категории.
  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    let isInitialNavigation = true;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Нужна для маршрутизации каталога. Читает hash, выбирает категорию и ставит страницу наверх.
    function handleHashChange() {
      const isFirstRun = isInitialNavigation;
      isInitialNavigation = false;
      const currentHash = window.location.hash;

      // Обычное открытие сайта начинается с первого экрана. Ссылка /#catalog (например, из шапки
      // посадочных страниц) обрабатывается ниже как якорь и прокручивает страницу к каталогу.
      if (isFirstRun && !currentHash) {
        setActiveLegalId(null);
        setCatalogSlug(null);
        schedulePageTopReset();
        return;
      }

      const legalDocId = window.location.hash.replace(/^#/, '');
      const hasLegalDoc = legalDocs.some((doc) => doc.id === legalDocId);

      if (hasLegalDoc) {
        setActiveLegalId(legalDocId);
        return;
      }

      setActiveLegalId(null);

      const nextCatalogSlug = getCatalogSlugFromHash(window.location.hash);
      setCatalogSlug(nextCatalogSlug);

      if (nextCatalogSlug) {
        window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }));
      } else {
        schedulePageAnchorScroll(window.location.hash);
      }
    }

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);

      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
    };
  }, []);

  // Обновляет title и description для главной страницы и внутренних страниц каталога.
  useEffect(() => {
    const nextTitle = activeCatalogCategory
      ? `${activeCatalogCategory.label} — каталог MB Kuzbass`
      : site.title;
    const nextDescription = activeCatalogCategory
      ? `${activeCatalogCategory.description} MB Kuzbass, Барнаул.`
      : site.description;
    const descriptionMeta = document.querySelector('meta[name="description"]');

    document.title = nextTitle;
    if (descriptionMeta) descriptionMeta.setAttribute('content', nextDescription);
  }, [activeCatalogCategory]);

  // Управляет прокруткой после смены SPA-состояния, чтобы якоря и страницы каталога открывались предсказуемо.
  useEffect(() => {
    if (activeCatalogCategory) {
      const resetScroll = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      window.requestAnimationFrame(resetScroll);
      window.setTimeout(resetScroll, 80);
      return;
    }

    const hashTarget = window.location.hash.replace(/^#/, '');
    if (!hashTarget || hashTarget.startsWith('catalog/')) return;

    schedulePageAnchorScroll(window.location.hash);
  }, [activeCatalogCategory]);

  // Пытается получить актуальные публичные показатели отзывов из 2ГИС, если задан API-ключ или proxy.
  useEffect(() => {
    if (!onlineReviewsConfigured) return undefined;

    let isActive = true;

    // Нужна для онлайн-отзывов. Загружает рейтинг и обновляет его на странице.
    async function syncReviews() {
      setReviewsSyncStatus('loading');

      try {
        const meta = await loadOnlineReviewsMeta(reviewsMeta, reviewsProvider);
        if (!isActive) return;

        setCurrentReviewsMeta(meta);
        setReviewsSyncStatus(meta.isLive ? 'success' : 'static');
      } catch {
        if (isActive) setReviewsSyncStatus('static');
      }
    }

    syncReviews();

    return () => {
      isActive = false;
    };
  }, [onlineReviewsConfigured]);

  // Нужна для форм первого экрана. Копирует текст и открывает личный чат Telegram в том же нажатии: если открыть
  // окно после await, Safari на iPhone может заблокировать новую вкладку. Данные формы в ссылку не попадают.
  function handleLeadSubmit(event, kind) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const copying = copyRequestText(createRequestText(kind, formData));

    window.open(contact.telegram, '_blank', 'noopener,noreferrer');
    trackGoal('request_submit');
    trackGoal(`request_submit_${kind}`);
    copying.then((copied) => {
      setFormStatus((current) => ({ ...current, [kind]: copied ? 'copied' : 'not-copied' }));
    });
  }

  // Нужна для кнопок «Частые доноры». Подставляет модель в форму подбора запчасти и переводит к полю детали.
  function handleDonorPick(model) {
    setVehicleQuery(model.query);
    setHeroMode('parts');
    trackGoal('donor_model_pick');
    window.requestAnimationFrame(() => {
      const input = partInputRef.current;
      if (!input) return;
      input.scrollIntoView({ block: 'center' });
      input.focus({ preventScroll: true });
    });
  }

  // Нужна для карточек каталога на главной. Открывает SPA-категорию и сбрасывает старую позицию прокрутки.
  function handleCatalogOpen(event, slug) {
    event.preventDefault();
    const nextHash = `#catalog/${slug}`;
    const resetScroll = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    if (window.location.hash !== nextHash) {
      window.history.pushState(null, '', nextHash);
    }

    setCatalogSlug(slug);
    trackGoal('catalog_open');
    window.requestAnimationFrame(resetScroll);
    window.setTimeout(resetScroll, 80);
  }

  // Фиксирует выбор cookie и закрывает панель. Отдельное согласие на аналитику можно отозвать в footer.
  function handlePrivacySave(analyticsAllowed) {
    const nextPreferences = savePrivacyPreferences(analyticsAllowed);
    setPrivacyPreferences(nextPreferences);
    setPrivacyPanelOpen(false);
  }

  return (
    <>
      <Header
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        onCloseMenu={() => setMenuOpen(false)}
      />

      <main id="top" className="page">
        {activeCatalogCategory ? (
          <CatalogCategoryPage category={activeCatalogCategory} />
        ) : (
          <>
            <section className="hero" aria-labelledby="hero-title">
              <div className="container hero__inner">
                <div className="route" aria-label="Маршрут: Япония, Барнаул, вся Россия">
                  <span className="route__point route__point--start">Япония</span>
                  <span className="route__line" aria-hidden="true" />
                  <span className="route__point">Барнаул</span>
                  <span className="route__line" aria-hidden="true" />
                  <span className="route__point">вся Россия</span>
                </div>

                <div className="hero__head">
                  <h1 id="hero-title">Mercedes-Benz и BMW из Японии — по запчастям и целиком</h1>
                  <p className="hero__lead">
                    Контрактные запчасти с японских доноров и автомобили с аукционов Японии под заказ. Склад
                    в Барнауле, отправка по всей России.
                  </p>
                </div>

                <div className="hero-switch" role="group" aria-label="Что вы ищете">
                  <button type="button" aria-pressed={heroMode === 'parts'} onClick={() => setHeroMode('parts')}>
                    Нужна запчасть
                  </button>
                  <button type="button" aria-pressed={heroMode === 'car'} onClick={() => setHeroMode('car')}>
                    Авто из Японии
                  </button>
                </div>

                <div className="doors" id="request">
                  <article className={`door${heroMode === 'parts' ? ' is-active' : ''}`} aria-labelledby="door-parts-title">
                    <div className="door__media">
                      <picture>
                        <source media="(max-width: 820px)" srcSet={EMPTY_IMAGE} />
                        <img src={heroImages.parts} alt={heroImages.partsAlt} width="1280" height="960" />
                      </picture>
                      <span className="tag">Запчасти</span>
                    </div>
                    <form className="door__form ym-hide-content" onSubmit={(event) => handleLeadSubmit(event, 'parts')}>
                      <h2 id="door-parts-title">Нужна запчасть</h2>
                      <p>
                        Двигатели, АКПП, оптика, кузов, подвеска с японских доноров. Проверим по VIN и пришлём
                        фото до оплаты.
                      </p>
                      <div className="door__fields">
                        <label htmlFor="lead-vehicle">
                          VIN или марка, модель, год
                          <input
                            id="lead-vehicle"
                            name="vehicle"
                            type="text"
                            placeholder="Например: W211 E300, 2007"
                            maxLength="120"
                            className="ym-disable-keys"
                            value={vehicleQuery}
                            onChange={(event) => setVehicleQuery(event.target.value)}
                          />
                        </label>
                        <label htmlFor="lead-part">
                          Какая деталь нужна
                          <input
                            id="lead-part"
                            name="part"
                            type="text"
                            placeholder="Например: АКПП или левая фара"
                            maxLength="300"
                            className="ym-disable-keys"
                            ref={partInputRef}
                          />
                        </label>
                      </div>
                      <ConsentCheckbox id="lead-parts-agree" onOpenLegal={setActiveLegalId} />
                      <button className="button button--accent button--wide" type="submit">
                        <Icon name="send" />
                        Подобрать запчасть
                      </button>
                      <FormStatus status={formStatus.parts} />
                    </form>
                  </article>

                  <article className={`door${heroMode === 'car' ? ' is-active' : ''}`} aria-labelledby="door-car-title">
                    <div className="door__media">
                      <picture>
                        <source media="(max-width: 820px)" srcSet={EMPTY_IMAGE} />
                        <img src={heroImages.cars} alt={heroImages.carsAlt} width="960" height="1280" />
                      </picture>
                      <span className="tag tag--dark">Авто из Японии</span>
                    </div>
                    <form className="door__form ym-hide-content" onSubmit={(event) => handleLeadSubmit(event, 'car')}>
                      <h2 id="door-car-title">Хочу авто из Японии</h2>
                      <p>Подберём и купим автомобиль на японском аукционе, доставим в любую точку России.</p>
                      <div className="door__fields">
                        <label htmlFor="lead-car">
                          Марка, модель, годы выпуска
                          <input
                            id="lead-car"
                            name="car"
                            type="text"
                            placeholder="Например: Mercedes-Benz E-Class, 2016–2019"
                            maxLength="160"
                            className="ym-disable-keys"
                          />
                        </label>
                        <label htmlFor="lead-city">
                          Куда доставить
                          <input
                            id="lead-city"
                            name="city"
                            type="text"
                            placeholder="Например: Новосибирск"
                            maxLength="80"
                            className="ym-disable-keys"
                          />
                        </label>
                      </div>
                      <ConsentCheckbox id="lead-car-agree" onOpenLegal={setActiveLegalId} />
                      <button className="button button--dark button--wide" type="submit">
                        <Icon name="send" />
                        Подобрать автомобиль
                      </button>
                      <FormStatus status={formStatus.car} />
                    </form>
                  </article>
                </div>

                <p className="hero__note">
                  Данные не отправляются на сервер сайта: форма копирует текст заявки, а отправляете его вы сами
                  в Telegram. Перед отправкой ознакомьтесь с документом{' '}
                  <LegalLink doc={legalDocs.find((doc) => doc.id === 'privacy')} onOpen={setActiveLegalId} />.
                  Согласие на публикацию имени, фото или отзыва этой галочкой не предоставляется.
                </p>

                <ul className="facts" aria-label="Коротко о компании">
                  <li>
                    <Icon name="star" size={26} />
                    <span>
                      <strong>{currentReviewsMeta.rating} в 2ГИС</strong>
                      <small>{ratingDetails}</small>
                    </span>
                  </li>
                  <li>
                    <Icon name="layers" size={26} />
                    <span>
                      <strong>{dromListingsLabel}</strong>
                      <small>профиль MBKuzbass на Drom</small>
                    </span>
                  </li>
                  <li>
                    <Icon name="pin" size={26} />
                    <span>
                      <strong>Склад в Барнауле</strong>
                      <small>самовывоз по адресу</small>
                    </span>
                  </li>
                  <li>
                    <Icon name="truck" size={26} />
                    <span>
                      <strong>Отправка по России</strong>
                      <small>транспортными компаниями</small>
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            <section className="donors" aria-label="Частые доноры">
              <div className="container donors__inner">
                <strong>Частые доноры:</strong>
                {donorModels.map((model) => (
                  <button className="chip" type="button" onClick={() => handleDonorPick(model)} key={model.query}>
                    {model.brand} <span className="mono">{model.code}</span>
                  </button>
                ))}
                <a className="chip chip--plain" href="#request" onClick={() => setHeroMode('parts')}>
                  Другая модель →
                </a>
              </div>
            </section>

            <section className="section section--paper" id="catalog" aria-labelledby="catalog-title">
              <div className="container">
                <div className="section-head">
                  <h2 id="catalog-title">Каталог запчастей</h2>
                  <p>Наличие меняется каждый день. Пришлите VIN — скажем, что есть сейчас и сколько стоит.</p>
                </div>
                <div className="category-grid">
                  {catalog.map((item) => (
                    <a
                      className="category-card"
                      href={item.href}
                      onClick={(event) => handleCatalogOpen(event, item.slug)}
                      key={item.slug}
                    >
                      <img
                        src={catalogCards[item.slug]?.cover || item.items[0]?.images[0]}
                        alt={`${item.label} — фото товара MB Kuzbass`}
                        width="800"
                        height="600"
                        loading="lazy"
                        decoding="async"
                        onError={handleImageError}
                      />
                      <span className="category-card__body">
                        <strong>{item.label}</strong>
                        {catalogCards[item.slug] && <span className="mono">{catalogCards[item.slug].codes}</span>}
                        <span className="category-card__more">Смотреть раздел →</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            </section>

            <section className="section section--white" aria-labelledby="featured-title">
              <div className="container">
                <div className="section-head">
                  <h2 id="featured-title">Примеры с нашего склада</h2>
                  <p>На фото — реальные детали с биркой MB KUZBASS. Наличие и цену подтверждаем перед продажей.</p>
                </div>
                <div className="product-grid">
                  {featuredProducts.map((product) => (
                    <article className="product-card" key={product.title}>
                      <a
                        className="product-card__media"
                        href={`#catalog/${product.categorySlug}`}
                        onClick={(event) => handleCatalogOpen(event, product.categorySlug)}
                      >
                        <img
                          src={product.images[0]}
                          alt={product.alt}
                          width="800"
                          height="600"
                          loading="lazy"
                          decoding="async"
                          onError={handleImageError}
                        />
                        <span className="tag">Фото товара</span>
                      </a>
                      <div className="product-card__body">
                        <span className="product-card__meta">{product.meta}</span>
                        <h3>{product.title}</h3>
                        <p className="product-card__price">Цена по запросу</p>
                        <a
                          className="button button--dark"
                          href={createMessengerUrl(contact.telegram, `Интересует: ${product.title}. Есть в наличии?`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackGoal('featured_telegram')}
                        >
                          Узнать цену и наличие
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section section--paper" aria-labelledby="steps-title">
              <div className="container">
                <h2 id="steps-title" className="section-title">
                  Как купить деталь
                </h2>
                <ol className="steps">
                  {purchaseSteps.map((step, index) => (
                    <li className="step" key={step.title}>
                      <span className="step__number">{index + 1}</span>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section className="section section--dark" id="directions" aria-labelledby="directions-title">
              <div className="container">
                <h2 id="directions-title" className="section-title">
                  Авто из Японии и поставки для разборов
                </h2>
                <div className="direction-grid">
                  {directions.map((item) => (
                    <article className="direction-card" key={item.title}>
                      <img src={item.image} alt={item.alt} width="1280" height="960" loading="lazy" decoding="async" />
                      <div className="direction-card__body">
                        <h3>{item.title}</h3>
                        <p>{item.text}</p>
                        <a href={item.href}>{item.linkText} →</a>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {japanCars.length > 0 && (
              <section className="section section--white" id="japan-cars" aria-labelledby="japan-cars-title">
                <div className="container">
                  <div className="section-head">
                    <h2 id="japan-cars-title">Уже заказали в Японии</h2>
                    <p>
                      Фото сделаны в Японии. Подберём похожий автомобиль под ваш бюджет и доставим в любую точку России.
                    </p>
                  </div>
                  <div className="car-grid">
                    {japanCars.map((car) => (
                      <JapanCarCard car={car} key={car.query} />
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className="section section--paper" id="reviews" aria-labelledby="trust-title">
              <div className="container">
                <h2 id="trust-title" className="section-title">
                  Почему нам доверяют
                </h2>
                <div className="trust-grid">
                  {trustPoints.map((point) => (
                    <div className="trust-card" key={point.title}>
                      <Icon name={point.icon} size={30} />
                      <h3>{point.title}</h3>
                      <p>{point.text}</p>
                    </div>
                  ))}
                </div>
                <div className="review-grid">
                  <div className="review-card review-card--rating">
                    <div className="review-card__score">
                      <strong>{currentReviewsMeta.rating}</strong>
                      <Icon name="star" size={34} />
                    </div>
                    <p>
                      Рейтинг в 2ГИС · {ratingDetails}
                      {reviewsStatusText && <small> · {reviewsStatusText}</small>}
                    </p>
                    <a href={contact.twoGis} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('reviews_2gis')}>
                      Читать отзывы в 2ГИС →
                    </a>
                  </div>
                  {flampReview && (
                    <div className="review-card">
                      <span className="review-card__source">
                        {flampReview.source} · {flampReview.rating} · {flampReview.date}
                      </span>
                      <p>{flampReview.text}</p>
                      <a href={flampReview.link} target="_blank" rel="noopener noreferrer">
                        Открыть отзыв на Флампе →
                      </a>
                    </div>
                  )}
                  <div className="review-card">
                    <span className="review-card__source">Drom · профиль продавца MBKuzbass</span>
                    <p>{dromListingsLabel}, история продавца и отзывы покупателей.</p>
                    <a href={contact.drom} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('reviews_drom')}>
                      Открыть профиль на Drom →
                    </a>
                  </div>
                </div>
              </div>
            </section>

            <section className="section section--dark" id="contacts" aria-labelledby="contacts-title">
              <div className="container contacts">
                <div className="contacts__main">
                  <h2 id="contacts-title" className="section-title">
                    Приезжайте или напишите
                  </h2>
                  <dl className="contacts__facts">
                    <div>
                      <dt>Адрес склада</dt>
                      <dd>{contact.address}</dd>
                    </div>
                    <div>
                      <dt>Режим работы</dt>
                      <dd>{contact.workTime}</dd>
                    </div>
                  </dl>
                  <a className="contacts__phone" href={contact.phoneHref} onClick={() => trackGoal('contacts_phone')}>
                    {contact.phone}
                  </a>
                  <div className="contacts__buttons">
                    <a
                      className="button button--accent"
                      href={createMessengerUrl(contact.telegram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackGoal('contacts_telegram')}
                    >
                      <Icon name="send" size={18} />
                      Telegram @MB_Kuzbass
                    </a>
                    <a
                      className="button button--outline-light"
                      href={createMessengerUrl(contact.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackGoal('contacts_whatsapp')}
                    >
                      WhatsApp
                    </a>
                    <a
                      className="button button--outline-light"
                      href={contact.twoGis}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackGoal('contacts_route')}
                    >
                      Маршрут в 2ГИС
                    </a>
                  </div>
                </div>

                <div className="contacts__more">
                  <h3>Где мы ещё есть</h3>
                  <a href={contact.telegramGroup} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('contacts_telegram_group')}>
                    <span>Группа в Telegram</span>
                    <span>t.me/mbc_kuzbass</span>
                  </a>
                  <a href={contact.vk} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('contacts_vk')}>
                    <span>ВКонтакте</span>
                    <span>vk.ru/mb_kuzbass</span>
                  </a>
                  <a href={contact.drom} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('contacts_drom')}>
                    <span>Drom</span>
                    <span>{dromListingsLabel}</span>
                  </a>
                  <a href={contact.twoGis} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('contacts_2gis')}>
                    <span>2ГИС</span>
                    <span>
                      {currentReviewsMeta.rating} · {currentReviewsMeta.ratingCount}
                    </span>
                  </a>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer onOpenLegal={setActiveLegalId} onOpenPrivacySettings={() => setPrivacyPanelOpen(true)} />
      <MobileContactBar />
      {privacyPanelOpen && (
        <CookieBanner
          preferences={privacyPreferences}
          initialSettings={Boolean(privacyPreferences)}
          onSave={handlePrivacySave}
          onClose={() => setPrivacyPanelOpen(false)}
          onOpenDocument={setActiveLegalId}
        />
      )}
      <LegalModal doc={activeLegalDoc} onClose={closeLegalDocument} />
    </>
  );
}

export default App;
