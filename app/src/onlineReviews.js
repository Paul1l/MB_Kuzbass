const apiKeyPlaceholders = ['YOUR_2GIS_API_KEY', 'PASTE_2GIS_API_KEY_HERE', ''];

// Нужна для гибкой настройки без пересборки. Читает конфиг отзывов из window.MBKUZBASS_REVIEWS_CONFIG.
function getRuntimeConfig() {
  if (typeof window === 'undefined') return {};
  return window.MBKUZBASS_REVIEWS_CONFIG || {};
}

// Нужна для безопасного чтения настроек. Приводит любое значение к строке и убирает лишние пробелы.
function cleanValue(value) {
  return String(value ?? '').trim();
}

// Нужна для проверки 2ГИС API-ключа. Отличает реальный ключ от пустого значения и шаблонных заглушек.
function isReadyApiKey(value) {
  const apiKey = cleanValue(value);
  return Boolean(apiKey) && !apiKeyPlaceholders.includes(apiKey);
}

// Нужна для рейтинга. Преобразует строку или число в Number, поддерживая запятую как десятичный разделитель.
function readNumber(value) {
  const number = Number(cleanValue(value).replace(',', '.'));
  return Number.isFinite(number) ? number : null;
}

// Нужна для количества оценок и отзывов. Преобразует значение в целое число или возвращает null.
function readInteger(value) {
  const number = Number.parseInt(cleanValue(value), 10);
  return Number.isFinite(number) ? number : null;
}

// Нужна для русского текста. Подбирает правильную форму слова: оценка, оценки, оценок.
function pluralizeRu(value, forms) {
  const abs = Math.abs(value) % 100;
  const last = abs % 10;

  if (abs > 10 && abs < 20) return `${value} ${forms[2]}`;
  if (last > 1 && last < 5) return `${value} ${forms[1]}`;
  if (last === 1) return `${value} ${forms[0]}`;
  return `${value} ${forms[2]}`;
}

// Нужна для прямого запроса в 2ГИС. Собирает URL API с id филиала, списком полей, локалью и ключом.
function buildDirectApiUrl(config) {
  const url = new URL(config.endpoint);

  url.searchParams.set('id', config.branchId);
  url.searchParams.set('fields', config.fields);
  url.searchParams.set('locale', config.locale);
  url.searchParams.set('key', config.apiKey);

  return url.toString();
}

// Нужна для выбора источника данных. Возвращает URL proxy, если он задан, иначе прямой URL 2ГИС API.
function buildReviewsUrl(config) {
  if (config.proxyUrl) {
    const baseUrl = typeof window !== 'undefined' && window.location?.href ? window.location.href : 'http://localhost/';
    return new URL(config.proxyUrl, baseUrl).toString();
  }

  return buildDirectApiUrl(config);
}

// Нужна для единой конфигурации отзывов. Объединяет дефолтные настройки, данные из data.js и runtime-конфиг.
function getConfig(provider) {
  return {
    endpoint: 'https://catalog.api.2gis.com/3.0/items/byid',
    fields: 'items.reviews',
    locale: 'ru_RU',
    timeout: 8000,
    apiKey: '',
    proxyUrl: '',
    ...provider,
    ...getRuntimeConfig(),
  };
}

// Нужна для совместимости с разными ответами API/proxy. Достает блок reviews из возможных структур JSON.
function getReviewsBlock(payload) {
  if (payload?.rating || payload?.reviewCount || payload?.ratingCount) return payload;

  const item = payload?.result?.items?.[0] || payload?.items?.[0] || payload?.result?.item;
  return item?.reviews || payload?.result?.reviews || null;
}

// Нужна для UI и SEO. Преобразует статистику 2ГИС в метаданные рейтинга, понятные компонентам сайта.
function createMetaFromStats(baseMeta, reviews) {
  const rating = readNumber(reviews.rating ?? reviews.general_rating ?? reviews.org_rating);
  const reviewCount = readInteger(
    reviews.reviewCount ?? reviews.review_count ?? reviews.general_review_count ?? reviews.org_review_count,
  );
  const ratingCount = readInteger(
    reviews.ratingCount ??
      reviews.general_review_count_with_stars ??
      reviews.org_review_count_with_stars ??
      reviews.review_count ??
      reviews.general_review_count,
  );

  if (rating === null && reviewCount === null && ratingCount === null) return null;

  const countForSummary = ratingCount ?? reviewCount;
  const separateReviewCount = reviewCount && reviewCount !== countForSummary ? reviewCount : null;
  const nextRating = rating === null ? baseMeta.rating : rating.toFixed(1);
  const nextRatingCount = countForSummary
    ? pluralizeRu(countForSummary, ['оценка', 'оценки', 'оценок'])
    : baseMeta.ratingCount;
  const nextReviewCount = separateReviewCount
    ? pluralizeRu(separateReviewCount, ['отзыв', 'отзыва', 'отзывов'])
    : '';
  const nextSources = Array.isArray(baseMeta.sources)
    ? baseMeta.sources.map((source) =>
        source.name === baseMeta.source
          ? {
              ...source,
              label: `${nextRating} / ${nextReviewCount || nextRatingCount}`,
            }
          : source,
      )
    : baseMeta.sources;

  return {
    ...baseMeta,
    rating: nextRating,
    ratingCount: nextRatingCount,
    reviewCount: nextReviewCount,
    ratingCountValue: countForSummary ?? null,
    reviewCountValue: reviewCount ?? null,
    sources: nextSources,
    isLive: true,
    updatedLabel: 'актуально из 2ГИС',
  };
}

// Нужна перед онлайн-запросом. Проверяет, можно ли загружать отзывы через proxy или прямой 2ГИС API.
export function isOnlineReviewsConfigured(provider) {
  const config = getConfig(provider);
  return Boolean(config.proxyUrl || (config.branchId && config.endpoint && isReadyApiKey(config.apiKey)));
}

// Нужна для актуализации отзывов на сайте. Загружает рейтинг из 2ГИС/proxy и возвращает обновленные метаданные
// либо базовые значения, если онлайн-данные недоступны.
export async function loadOnlineReviewsMeta(baseMeta, provider) {
  const config = getConfig(provider);

  if (!isOnlineReviewsConfigured(provider)) return baseMeta;

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(buildReviewsUrl(config), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) throw new Error('reviews request failed');

    const payload = await response.json();
    const reviews = getReviewsBlock(payload);
    const meta = reviews ? createMetaFromStats(baseMeta, reviews) : null;

    return meta || baseMeta;
  } finally {
    window.clearTimeout(timer);
  }
}
