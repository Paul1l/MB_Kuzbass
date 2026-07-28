import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  brandBackdropImage,
  brandAvatar,
  benefits,
  catalog,
  commerce,
  contact,
  directions,
  garageSlides,
  legalDocs,
  messengers,
  owner,
  parallaxBackgrounds,
  reviews,
  reviewsMeta,
  reviewsProvider,
  site,
  stats,
} from './data.js';
import { isOnlineReviewsConfigured, loadOnlineReviewsMeta } from './onlineReviews.js';
import { disableAnalytics, enableAnalytics, trackGoal, trackPageView } from './analytics.js';
import { readPrivacyPreferences, savePrivacyPreferences } from './privacyConsent.js';

const requestPlaceholderText =
  'Здравствуйте! Нужны запчасти, автомобиль с японского аукциона или поставка машинокомплекта.';

// Нужна для единообразного оформления ссылок-кнопок. По типу канала связи возвращает CSS-классы обычной,
// основной или второстепенной кнопки.
function getButtonClass(variant) {
  if (variant === 'primary') return 'button button--primary';
  if (variant === 'ghost') return 'button button--ghost';
  return 'button';
}

// Нужна для формы заявки. Собирает имя, контакт и задачу в готовый текст для отправки в Telegram.
function createRequestText(formData) {
  const name = formData.get('name') || 'не указано';
  const userContact = formData.get('contact') || 'не указан';
  const message = formData.get('message') || 'без описания';

  return [
    'Заявка с сайта MB Kuzbass',
    `Имя: ${name}`,
    `Контакт: ${userContact}`,
    `Задача: ${message}`,
  ].join('\n');
}

// Нужна для ускорения заявки. Пытается скопировать подготовленный текст в буфер обмена перед открытием Telegram.
async function copyRequestText(text) {
  if (!navigator.clipboard) return false;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Нужна для SEO. Обновляет JSON-LD AggregateRating после успешной загрузки актуального рейтинга из 2ГИС.
function updateRatingStructuredData(meta) {
  const script = document.querySelector('script[type="application/ld+json"]');
  if (!script || !meta?.ratingCountValue) return;

  try {
    const data = JSON.parse(script.textContent);
    data.aggregateRating = {
      ...data.aggregateRating,
      ratingValue: meta.rating,
      ratingCount: meta.ratingCountValue,
      bestRating: 5,
    };
    script.textContent = JSON.stringify(data);
  } catch {
    // Если JSON-LD изменили вручную, страница продолжит работать без обновления SEO-блока.
  }
}

// Нужна для секции отзывов. Собирает короткую строку с источником, рейтингом и количеством оценок.
function createReviewsIntroText(meta) {
  const sources = Array.isArray(meta.sources) && meta.sources.length
    ? meta.sources.map((source) => source.name).join(' и ')
    : meta.source;

  return `${sources}: ${[meta.rating, meta.ratingCount, meta.reviewCount].filter(Boolean).join(', ')}.`;
}

// Нужна для блока отзывов. Возвращает список внешних площадок, куда пользователь может перейти для проверки рейтинга и отзывов.
function getReviewSourceLinks(meta) {
  if (Array.isArray(meta.sources) && meta.sources.length) return meta.sources;

  return [
    {
      name: meta.source,
      url: meta.sourceUrl,
      label: meta.ratingCount,
    },
  ];
}

// Нужна для верхних метрик. Подставляет актуальный рейтинг и количество оценок в массив показателей.
function createStatsWithReviews(baseStats, meta) {
  return baseStats.map((item) => {
    if (item.key === 'rating') return { ...item, value: meta.rating };
    if (item.key === 'reviews') return { ...item, value: meta.ratingCountValue || item.value, label: meta.ratingCount };
    return item;
  });
}

// Нужна для фоновых изображений. Делает URL абсолютным, чтобы CSS background не искал assets относительно CSS-файла.
function resolveAssetUrl(url) {
  if (typeof window === 'undefined') return url;
  return new URL(url, window.location.href).href;
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

// Нужна для ручной карусели авто. Считает кратчайшее смещение слайда относительно активной карточки.
function getCarouselOffset(index, activeIndex, total) {
  let offset = index - activeIndex;
  const halfway = Math.floor(total / 2);

  if (offset > halfway) offset -= total;
  if (offset < -halfway) offset += total;

  return offset;
}

// Нужна для шапки сайта. Отрисовывает бренд, город и быстрые ссылки по основным разделам страницы.
function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="#top">
        <span className="brand__mark">
          <img className="brand__avatar" src={brandAvatar} alt="Аватарка MB Kuzbass из Telegram" />
        </span>
        <span>
          <strong>{site.name}</strong>
          <small>{site.city}</small>
        </span>
      </a>

      <nav className="nav" aria-label="Навигация">
        <a href="#about">О компании</a>
        <a href="#directions">Направления</a>
        <a href="#vehicles">Авто</a>
        <a href="#reviews">Отзывы</a>
        <a href="#contacts">Контакты</a>
      </nav>
    </header>
  );
}

// Нужна для одинаковой структуры секций. Делает заголовок с номером, подписью, H2 и необязательным описанием.
function SectionIntro({ index, eyebrow, title, text }) {
  return (
    <div className="section-intro">
      <span>{index}</span>
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
        {text && <small>{text}</small>}
      </div>
    </div>
  );
}

// Нужна для быстрых контактов. Создает ссылку на внешний канал связи в едином стиле кнопки.
function ContactButton({ item }) {
  return (
    <a
      className={getButtonClass(item.variant)}
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackGoal(`contact_${item.key}`)}
    >
      {item.label}
    </a>
  );
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

// Нужна карточкам с несколькими ракурсами. Показывает одно стабильное по размеру изображение
// и позволяет вручную переключать фото, не запуская автоматическую карусель.
function CatalogProductGallery({ product }) {
  const [activeImage, setActiveImage] = useState(0);
  const handleImageError = createImageFallbackHandler(brandBackdropImage);
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

// Нужна для SPA-страниц каталога. Показывает выбранную категорию, карточки позиций и CTA для запроса в Telegram.
function CatalogCategoryPage({ category }) {
  return (
    <section className="catalog-page" data-parallax-bg="3">
      <a className="catalog-page__back" href="#catalog">
        Вернуться к категориям
      </a>

      <div className="catalog-page__hero">
        <span>Каталог запчастей</span>
        <h1>{category.label}</h1>
        <p>{category.description}</p>
        <div className="catalog-page__actions">
          <a
            className="button button--primary"
            href={contact.telegram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackGoal('catalog_telegram')}
          >
            Уточнить наличие в Telegram
          </a>
          <a className="button button--ghost" href="#contacts">
            Оставить заявку
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
                className="button button--ghost"
                href={contact.telegram}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackGoal('catalog_item_telegram')}
              >
                Уточнить наличие
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// Нужна как доказательный блок, а не как главный продающий CTA. Показывает реальные автомобили-доноры в ручной
// карусели без автопрокрутки: пользователь сам выбирает слайд стрелками или кликом по видимому авто.
function GarageCarousel() {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeSlide = garageSlides[activeSlideIndex];

  // Нужна для ручной навигации назад. Переключает активное авто по кругу.
  function setPreviousSlide() {
    setActiveSlideIndex((currentIndex) => (currentIndex - 1 + garageSlides.length) % garageSlides.length);
  }

  // Нужна для ручной навигации вперед. Переключает активное авто по кругу.
  function setNextSlide() {
    setActiveSlideIndex((currentIndex) => (currentIndex + 1) % garageSlides.length);
  }

  return (
    <section className="section section--garage" id="vehicles" data-parallax-bg="4">
      <SectionIntro
        index="05"
        eyebrow="Авто"
        title="Автомобили доноры"
      />

      <div className="garage-carousel">
        <div className="garage-stage" role="region" aria-label="Карусель автомобилей MB Kuzbass">
          {garageSlides.map((slide, index) => {
            const offset = getCarouselOffset(index, activeSlideIndex, garageSlides.length);
            const absoluteOffset = Math.abs(offset);
            const isVisible = absoluteOffset <= 2;
            const scale = absoluteOffset === 0 ? 1 : absoluteOffset === 1 ? 0.74 : 0.58;
            const opacity = isVisible ? (absoluteOffset === 0 ? 1 : 0.62) : 0;

            return (
              <button
                className={`garage-slide${offset === 0 ? ' is-active' : ''}`}
                style={{
                  '--offset': offset,
                  '--scale': scale,
                  '--opacity': opacity,
                  '--z-index': 10 - absoluteOffset,
                }}
                type="button"
                onClick={() => setActiveSlideIndex(index)}
                aria-label={`${slide.meta}. Показать ${slide.title}`}
                aria-hidden={!isVisible}
                tabIndex={isVisible ? 0 : -1}
                key={slide.title}
              >
                <img src={slide.image} alt={slide.alt} loading={absoluteOffset === 0 ? 'eager' : 'lazy'} />
                <span>{slide.meta}</span>
              </button>
            );
          })}
        </div>

        <div className="garage-panel">
          <div>
            <span>{activeSlide.meta}</span>
            <h3>{activeSlide.title}</h3>
            <p className="garage-description-slot" aria-hidden="true" />
          </div>
          <div className="garage-controls">
            <button type="button" onClick={setPreviousSlide} aria-label="Предыдущее авто">
              ‹
            </button>
            <button type="button" onClick={setNextSlide} aria-label="Следующее авто">
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Нужна для отзывов. Показывает одну карточку с автором, рейтингом, текстом и ссылкой на источник.
function ReviewCard({ review }) {
  return (
    <article className="review-card">
      <div className="review-card__top">
        <strong>{review.author}</strong>
        <span>{review.rating}</span>
      </div>
      <p>{review.text}</p>
      <a href={review.link} target="_blank" rel="noopener noreferrer">
        {review.source}, {review.date}
      </a>
    </article>
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

// Нужна для нижней части сайта. Показывает служебную информацию и ссылки на юридические документы.
function Footer({ onOpenLegal, onOpenPrivacySettings }) {
  const footerNavigation = [
    { href: '#about', label: 'О компании' },
    { href: '#directions', label: 'Направления' },
    { href: '#catalog', label: 'Каталог' },
    { href: '#vehicles', label: 'Авто' },
    { href: '#reviews', label: 'Отзывы' },
    { href: '#contacts', label: 'Контакты' },
  ];

  return (
    <footer className="footer">
      <div className="footer__main">
        <div className="footer__brand">
          <a className="footer-brand" href="#top">
            <span className="footer-brand__mark">
              <img src={brandAvatar} alt="Логотип MB Kuzbass" />
            </span>
            <span>
              <strong>{site.name}</strong>
              <small>{site.city}</small>
            </span>
          </a>
          <p>
            Оригинальные запчасти Mercedes-Benz и BMW с японских доноров, автомобили с аукционов и
            поставки для авторазборов по России.
          </p>
          <div className="footer__actions">
            <a
              className="button button--primary"
              href={contact.telegram}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGoal('footer_telegram')}
            >
              Telegram
            </a>
            <a className="button button--dark-outline" href="#request" onClick={() => trackGoal('footer_request')}>
              Оставить заявку
            </a>
          </div>
        </div>

        <div className="footer__column">
          <h3>Контакты</h3>
          <a href={contact.phoneHref} onClick={() => trackGoal('footer_phone')}>{contact.phone}</a>
          <a
            href={contact.telegram}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackGoal('footer_contact_telegram')}
          >
            Telegram
          </a>
          <p>{contact.address}</p>
          <p>{contact.workTime}</p>
        </div>

        <nav className="footer__column" aria-label="Навигация по сайту">
          <h3>Разделы</h3>
          {footerNavigation.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <nav className="footer__column footer-links" aria-label="Документы сайта">
          <h3>Документы</h3>
          {legalDocs.map((doc) => (
            <LegalLink doc={doc} onOpen={onOpenLegal} key={doc.id} />
          ))}
          <button type="button" onClick={onOpenPrivacySettings}>
            Настройки cookie
          </button>
        </nav>
      </div>

      <div className="footer__bottom">
        <span>© 2026 {site.name}</span>
        <span>{owner.name}</span>
        <p>
          Информационная витрина. Заказы и платежи на сайте не принимаются. Обновлено: {site.updatedAt}.
        </p>
      </div>
      <p className="footer__trademark-note">
        Сайт не является официальным дилером или представительством Mercedes-Benz и BMW. Товарные
        знаки принадлежат их правообладателям и используются для описания совместимости товаров.
        {commerce.acceptsPaymentsOnSite ? '' : ' Онлайн-оплата на сайте не подключена.'}
      </p>
    </footer>
  );
}

// Нужна как корневой компонент. Собирает SEO-состояние, SPA-каталог, отзывы, параллакс, форму заявки,
// footer-документы и cookie-плашку в одну страницу.
function App() {
  const [formStatus, setFormStatus] = useState('');
  const [activeLegalId, setActiveLegalId] = useState(null);
  const [privacyPreferences, setPrivacyPreferences] = useState(() => readPrivacyPreferences());
  const [privacyPanelOpen, setPrivacyPanelOpen] = useState(() => !readPrivacyPreferences());
  const [currentReviewsMeta, setCurrentReviewsMeta] = useState(() => ({ ...reviewsMeta, isLive: false }));
  const onlineReviewsConfigured = useMemo(() => isOnlineReviewsConfigured(reviewsProvider), []);
  const [reviewsSyncStatus, setReviewsSyncStatus] = useState(onlineReviewsConfigured ? 'loading' : 'static');
  const [activeParallaxIndex, setActiveParallaxIndex] = useState(null);
  const [catalogSlug, setCatalogSlug] = useState(() =>
    typeof window === 'undefined' ? null : getCatalogSlugFromHash(window.location.hash),
  );
  const heroCoverBackgroundImage = useMemo(() => resolveAssetUrl(brandBackdropImage), []);
  const resolvedParallaxBackgrounds = useMemo(
    () => parallaxBackgrounds.map((image) => resolveAssetUrl(image)),
    [],
  );
  const pageShellStyle = useMemo(
    () => ({
      '--hero-cover-image': `url("${heroCoverBackgroundImage}")`,
    }),
    [heroCoverBackgroundImage],
  );
  const primaryMessengers = messengers.filter((item) => item.key !== 'twoGis');
  const currentStats = useMemo(
    () => createStatsWithReviews(stats, currentReviewsMeta),
    [currentReviewsMeta],
  );
  const reviewsIntroText = useMemo(() => createReviewsIntroText(currentReviewsMeta), [currentReviewsMeta]);
  const reviewSourceLinks = useMemo(() => getReviewSourceLinks(currentReviewsMeta), [currentReviewsMeta]);
  const reviewsStatusText =
    reviewsSyncStatus === 'loading'
      ? 'обновляем 2ГИС'
      : currentReviewsMeta.isLive
        ? currentReviewsMeta.updatedLabel
        : '';
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

  // Закрывает модальное окно документов по Escape, чтобы юридические страницы не блокировали просмотр сайта.
  useEffect(() => {
    // Нужна для клавиатурного закрытия модалки. При Escape сбрасывает выбранный документ.
    function handleEscape(event) {
      if (event.key === 'Escape') closeLegalDocument();
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

      // Старые ссылки на обзор каталога и обычное открытие сайта должны начинаться с первого экрана.
      if (isFirstRun && (!currentHash || currentHash === '#catalog')) {
        if (currentHash === '#catalog') {
          window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        }

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

  // Переключает фоновые параллакс-изображения по ближайшей секции и обновляет CSS-смещение при прокрутке.
  useEffect(() => {
    if (!resolvedParallaxBackgrounds.length) return undefined;

    let isQueued = false;

    // Нужна для параллакса. Выбирает активный фон по секции около середины экрана и двигает фон по scrollY.
    function updateParallaxBackground() {
      isQueued = false;
      const scrollShift = Math.max(-220, Math.round((window.scrollY || 0) * -0.035));
      document.documentElement.style.setProperty('--parallax-y', `${scrollShift}px`);

      const sections = Array.from(document.querySelectorAll('[data-parallax-bg]'));
      const focusLine = window.innerHeight * 0.46;
      let activeSection = sections[0];
      let closestDistance = Number.POSITIVE_INFINITY;

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const isInFocus = rect.top <= focusLine && rect.bottom >= focusLine;
        const distance = isInFocus ? 0 : Math.abs(rect.top - focusLine);

        if (distance < closestDistance) {
          closestDistance = distance;
          activeSection = section;
        }
      });

      const parallaxValue = activeSection?.dataset.parallaxBg;
      const nextIndex =
        parallaxValue === 'none' ? null : Number(parallaxValue || 0) % resolvedParallaxBackgrounds.length;
      setActiveParallaxIndex((currentIndex) => (currentIndex === nextIndex ? currentIndex : nextIndex));
    }

    // Нужна для производительности. Ставит обновление параллакса в requestAnimationFrame вместо частых пересчетов.
    function queueUpdate() {
      if (isQueued) return;
      isQueued = true;
      window.requestAnimationFrame(updateParallaxBackground);
    }

    const delayedUpdates = [80, 260, 700].map((delay) => window.setTimeout(queueUpdate, delay));
    const pageShell = document.querySelector('.page-shell');
    const resizeObserver =
      pageShell && typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(queueUpdate)
        : null;

    resizeObserver?.observe(pageShell);
    queueUpdate();
    window.addEventListener('scroll', queueUpdate, { passive: true });
    window.addEventListener('resize', queueUpdate);
    window.addEventListener('hashchange', queueUpdate);

    return () => {
      window.removeEventListener('scroll', queueUpdate);
      window.removeEventListener('resize', queueUpdate);
      window.removeEventListener('hashchange', queueUpdate);
      delayedUpdates.forEach((timeoutId) => window.clearTimeout(timeoutId));
      resizeObserver?.disconnect();
      document.documentElement.style.removeProperty('--parallax-y');
    };
  }, [catalogSlug, resolvedParallaxBackgrounds.length]);

  // Пытается получить актуальные публичные показатели отзывов из 2ГИС, если задан API-ключ или proxy.
  useEffect(() => {
    if (!onlineReviewsConfigured) return undefined;

    let isActive = true;

    // Нужна для онлайн-отзывов. Загружает рейтинг, обновляет состояние страницы и JSON-LD для SEO.
    async function syncReviews() {
      setReviewsSyncStatus('loading');

      try {
        const meta = await loadOnlineReviewsMeta(reviewsMeta, reviewsProvider);
        if (!isActive) return;

        setCurrentReviewsMeta(meta);
        setReviewsSyncStatus(meta.isLive ? 'success' : 'static');
        updateRatingStructuredData(meta);
      } catch {
        if (isActive) setReviewsSyncStatus('static');
      }
    }

    syncReviews();

    return () => {
      isActive = false;
    };
  }, [onlineReviewsConfigured]);

  // Нужна для формы заявки. Формирует текст, копирует его и открывает основной Telegram-канал связи.
  async function handleRequestSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const text = createRequestText(formData);
    const copied = await copyRequestText(text);

    setFormStatus(
      copied
        ? 'Текст заявки скопирован. Telegram откроется в новой вкладке, вставьте сообщение в чат.'
        : 'Telegram откроется в новой вкладке. Если текст не скопировался, отправьте VIN, контакт и задачу вручную.',
    );

    trackGoal('request_submit');
    window.open(contact.telegram, '_blank', 'noopener,noreferrer');
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
      <Header />

      <main id="top" className="page-shell" style={pageShellStyle}>
        <div className="site-parallax" aria-hidden="true">
          {resolvedParallaxBackgrounds.map((image, index) => (
            <span
              className={`site-parallax__layer site-parallax__layer--${index}${activeParallaxIndex === index ? ' is-active' : ''}`}
              style={{ backgroundImage: `url("${image}")` }}
              key={image}
            />
          ))}
        </div>

        {activeCatalogCategory ? (
          <CatalogCategoryPage category={activeCatalogCategory} />
        ) : (
          <>
        <section className="hero" data-parallax-bg="none">
          <div className="hero__content">
            <p className="eyebrow">Оригинальные запчасти / авто с аукционов / поставки для разборов</p>
            <h1>{site.name}</h1>
            <p className="hero__lead">
              Продаем качественные оригинальные запчасти с японских доноров для Mercedes-Benz и BMW.
              Занимаемся выбором, покупкой и доставкой в любую точку России автомобилей с японских
              аукционов, а также поставками для авторазборов — от одного машинокомплекта до целого
              контейнера.
            </p>

            <div className="hero__actions">
              {primaryMessengers.map((item) => (
                <ContactButton item={item} key={item.key} />
              ))}
              <a className="button button--ghost" href="#request" onClick={() => trackGoal('hero_request')}>
                Оставить заявку
              </a>
            </div>
            <p className="hero__notice">
              Сайт показывает направления работы и примеры ассортимента. Наличие и условия покупки
              подтверждаются при обращении.
            </p>
          </div>

          <div
            className="hero__visual"
            aria-label="MB Kuzbass — оригинальные запчасти с японских доноров"
          >
            <div className="hero-cover__content">
              <span>{site.name}</span>
              <h2>Mercedes-Benz / BMW / Аукционы Японии</h2>
              <p>Оригинальные запчасти, автомобили с аукционов и поставки для авторазборов.</p>
            </div>
          </div>

          <div className="stats">
            {currentStats.map((item) => (
              <div className="stats__item" key={item.key || item.value}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="about" data-parallax-bg="1">
          <SectionIntro
            index="01"
            eyebrow="О компании"
            title="Продаем оригинальные запчасти с японских доноров и привозим автомобили с аукционов."
            text="MB Kuzbass работает с владельцами Mercedes-Benz и BMW, частными клиентами, сервисами и авторазборами по всей России."
          />

          <div className="about-grid">
            <article className="about-card">
              <h3>Что делаем</h3>
              <p>
                Продаем оригинальные запчасти с японских доноров, занимаемся автомобилями с японских
                аукционов и поставками машинокомплектов для авторазборов.
              </p>
            </article>
            <article className="about-card">
              <h3>Как работаем</h3>
              <p>
                Уточняем задачу, модель, VIN или нужный объем поставки, показываем состояние товара,
                согласовываем покупку, доставку и передачу в транспортную компанию.
              </p>
            </article>
            <article className="about-card">
              <h3>Кому подходит</h3>
              <p>
                Владельцам Mercedes-Benz и BMW, автосервисам, мастерам, покупателям автомобилей с
                японских аукционов и авторазборам, которым нужны регулярные поставки.
              </p>
            </article>
          </div>
        </section>

        <section className="section section--dark" id="directions" data-parallax-bg="2">
          <SectionIntro
            index="02"
            eyebrow="Направления"
            title="Основные задачи, с которыми можно обратиться."
          />

          <div className="direction-grid">
            {directions.map((item, index) => (
              <article className="direction-card" key={item.title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="catalog" data-parallax-bg="3">
          <SectionIntro
            index="03"
            eyebrow="Каталог"
            title="Частые категории запчастей."
            text="Если нужной позиции нет на складе, ее можно проверить под заказ."
          />

          <div className="catalog">
            {catalog.map((item) => (
              <a href={item.href} onClick={(event) => handleCatalogOpen(event, item.slug)} key={item.label}>
                <span className="catalog__copy">
                  <strong>{item.label}</strong>
                  <small>{item.caption}</small>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="section" data-parallax-bg="4">
          <SectionIntro
            index="04"
            eyebrow="Преимущества"
            title="Что получает клиент перед покупкой."
          />

          <div className="benefits">
            {benefits.map((item) => (
              <article className="benefit-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <GarageCarousel />

        <section className="section section--reviews" id="reviews" data-parallax-bg="2">
          <SectionIntro
            index="06"
            eyebrow="Отзывы"
            title="Рейтинг и впечатления клиентов."
            text={reviewsIntroText}
          />

          <div className="review-summary">
            <strong>{currentReviewsMeta.rating}</strong>
            <span>
              {currentReviewsMeta.ratingCount}
              {reviewsStatusText && <small>{reviewsStatusText}</small>}
            </span>
            <div className="review-summary__links">
              {reviewSourceLinks.map((source) => (
                <a href={source.url} target="_blank" rel="noopener noreferrer" key={source.name}>
                  {source.name}: {source.label}
                </a>
              ))}
            </div>
          </div>

          <div className="reviews">
            {reviews.map((review, index) => (
              <ReviewCard review={review} key={`${review.author}-${review.date}-${review.source}-${index}`} />
            ))}
          </div>
        </section>

        <section className="section section--contacts" id="contacts" data-parallax-bg="none">
          <SectionIntro
            index="07"
            eyebrow="Контакты"
            title="Пришлите VIN, фото детали, ссылку на авто или объем поставки."
            text="Так проще быстро понять задачу, наличие, сроки и стоимость доставки."
          />

          <div className="contacts-layout">
            <div className="contact-card" id="request">
              <div className="contact-card__head">
                <span>Заявка</span>
                <h3>Быстрая заявка в Telegram</h3>
                <p>Заполните основные данные, текст заявки скопируется и откроется основной канал связи.</p>
              </div>
              <form className="ym-hide-content" onSubmit={handleRequestSubmit}>
                <div className="form-row">
                  <label>
                    Имя
                    <input
                      type="text"
                      name="name"
                      placeholder="Как к вам обращаться"
                      autoComplete="name"
                      maxLength="80"
                      className="ym-disable-keys"
                    />
                  </label>
                  <label>
                    Контакт
                    <input
                      type="text"
                      name="contact"
                      placeholder="Телефон, Telegram или VK"
                      autoComplete="tel"
                      maxLength="120"
                      className="ym-disable-keys"
                    />
                  </label>
                </div>
                <label>
                  Что нужно найти
                  <textarea
                    name="message"
                    rows="5"
                    placeholder={requestPlaceholderText}
                    maxLength="1500"
                    className="ym-disable-keys"
                  />
                </label>
                <label className="privacy-check">
                  <input type="checkbox" name="agree" required />
                  <span>
                    Согласен на обработку персональных данных по{' '}
                    <LegalLink doc={legalDocs.find((doc) => doc.id === 'privacy')} onOpen={setActiveLegalId} /> и{' '}
                    <LegalLink doc={legalDocs.find((doc) => doc.id === 'consent')} onOpen={setActiveLegalId} />.
                  </span>
                </label>
                <div className="form-actions">
                  <button className="button button--primary" type="submit">
                    Открыть Telegram
                  </button>
                  <a className="button button--ghost" href={contact.phoneHref} onClick={() => trackGoal('request_phone')}>
                    Позвонить
                  </a>
                </div>
                {formStatus && <p className="form-status">{formStatus}</p>}
                <p className="form-local-note">
                  Данные не отправляются на сервер сайта. Форма только копирует текст в вашем браузере;
                  сообщение отправляете вы сами в Telegram.
                </p>
              </form>
            </div>

            <aside className="contact-info">
              <div className="contact-info__head">
                <span>Связь</span>
                <h3>Контакты MB Kuzbass</h3>
                <p>Основной канал для заявок — Telegram. Для маршрута и отзывов можно открыть карточку 2ГИС.</p>
              </div>
              <div className="contact-info__item">
                <span>Основная связь</span>
                <a
                  href={contact.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackGoal('contacts_telegram')}
                >
                  Telegram
                </a>
              </div>
              <div className="contact-info__item">
                <span>Телефон</span>
                <a href={contact.phoneHref} onClick={() => trackGoal('contacts_phone')}>{contact.phone}</a>
              </div>
              <div className="contact-info__item">
                <span>Адрес</span>
                <p>
                  {contact.address}. Схема проезда и вход — в карточке 2ГИС.
                </p>
              </div>
              <div className="contact-info__item">
                <span>Режим</span>
                <p>{contact.workTime}</p>
              </div>
              <div className="contact-info__buttons">
                {messengers.map((item) => (
                  <ContactButton item={item} key={item.key} />
                ))}
              </div>
            </aside>
          </div>
        </section>
          </>
        )}
      </main>

      <Footer onOpenLegal={setActiveLegalId} onOpenPrivacySettings={() => setPrivacyPanelOpen(true)} />
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
