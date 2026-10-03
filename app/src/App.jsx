import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { disableAnalytics, enableAnalytics, trackGoal, trackPageView } from './analytics.js';
import { CatalogCategoryPage } from './components/CatalogCategoryPage.jsx';
import { CookieBanner } from './components/CookieBanner.jsx';
import { Footer } from './components/Footer.jsx';
import { Header } from './components/Header.jsx';
import { LegalModal } from './components/LegalModal.jsx';
import { MobileContactBar } from './components/MobileContactBar.jsx';
import { catalog, contact, legalDocs, reviewsMeta, reviewsProvider, site } from './data.js';
import { copyRequestText, createRequestText } from './lib/leadRequest.js';
import { getCatalogSlugFromHash, schedulePageAnchorScroll, schedulePageTopReset } from './lib/navigation.js';
import { isOnlineReviewsConfigured, loadOnlineReviewsMeta } from './onlineReviews.js';
import { readPrivacyPreferences, savePrivacyPreferences } from './privacyConsent.js';
import { CatalogSection } from './sections/CatalogSection.jsx';
import { ContactsSection } from './sections/ContactsSection.jsx';
import { DirectionsSection } from './sections/DirectionsSection.jsx';
import { DonorsSection } from './sections/DonorsSection.jsx';
import { FeaturedSection } from './sections/FeaturedSection.jsx';
import { HeroSection } from './sections/HeroSection.jsx';
import { JapanCarsSection } from './sections/JapanCarsSection.jsx';
import { StepsSection } from './sections/StepsSection.jsx';
import { TrustSection } from './sections/TrustSection.jsx';

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
  const activeLegalDoc = useMemo(
    () => legalDocs.find((doc) => doc.id === activeLegalId),
    [activeLegalId],
  );
  const activeCatalogCategory = useMemo(
    () => catalog.find((item) => item.slug === catalogSlug),
    [catalogSlug],
  );

  // Закрывает документ и убирает его hash из адреса, чтобы после обновления страницы окно не открылось снова.
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
            <HeroSection
              heroMode={heroMode}
              onHeroModeChange={setHeroMode}
              vehicleQuery={vehicleQuery}
              onVehicleQueryChange={setVehicleQuery}
              partInputRef={partInputRef}
              formStatus={formStatus}
              onLeadSubmit={handleLeadSubmit}
              onOpenLegal={setActiveLegalId}
              reviewsMeta={currentReviewsMeta}
              ratingDetails={ratingDetails}
            />
            <DonorsSection onDonorPick={handleDonorPick} onOtherModel={() => setHeroMode('parts')} />
            <CatalogSection onCatalogOpen={handleCatalogOpen} />
            <FeaturedSection onCatalogOpen={handleCatalogOpen} />
            <StepsSection />
            <DirectionsSection />
            <JapanCarsSection />
            <TrustSection
              reviewsMeta={currentReviewsMeta}
              ratingDetails={ratingDetails}
              reviewsStatusText={reviewsStatusText}
            />
            <ContactsSection reviewsMeta={currentReviewsMeta} />
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
