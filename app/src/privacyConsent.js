import { site } from './data.js';

export const PRIVACY_CONSENT_VERSION = '2026-07-22';
const PREFERENCES_COOKIE = 'mb_privacy_preferences';
const PREFERENCES_MAX_AGE = 60 * 60 * 24 * 180;

// Ограничивает cookie каталогом проекта на GitHub Pages и корнем сайта на собственном домене.
function getCookiePath() {
  if (typeof window === 'undefined') return '/';

  try {
    const publishedUrl = new URL(site.url);
    return window.location.hostname === publishedUrl.hostname ? publishedUrl.pathname || '/' : '/';
  } catch {
    return '/';
  }
}

// Возвращает значение cookie по имени без сторонней библиотеки.
function readCookie(name) {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const item = document.cookie.split('; ').find((cookie) => cookie.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

// Читает сохраненный выбор только для текущей версии документа о cookie.
export function readPrivacyPreferences() {
  const value = readCookie(PREFERENCES_COOKIE);
  if (!value) return null;

  const [version, analyticsValue] = value.split('.');
  if (version !== PRIVACY_CONSENT_VERSION) return null;

  return {
    necessary: true,
    analytics: analyticsValue === 'analytics',
    version,
  };
}

// Сохраняет выбор на 180 дней; обязательные cookie нельзя отключить через интерфейс.
export function savePrivacyPreferences(analytics) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  const value = `${PRIVACY_CONSENT_VERSION}.${analytics ? 'analytics' : 'necessary'}`;
  document.cookie = `${PREFERENCES_COOKIE}=${encodeURIComponent(value)}; Max-Age=${PREFERENCES_MAX_AGE}; Path=${getCookiePath()}; SameSite=Lax${secure}`;

  return {
    necessary: true,
    analytics: Boolean(analytics),
    version: PRIVACY_CONSENT_VERSION,
  };
}
