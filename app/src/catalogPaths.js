// Адреса страниц каталога: /katalog/, /katalog/<раздел>/ и /katalog/<раздел>/<деталь>/. Модуль общий для сайта
// (ссылки с главной, переадресация старых адресов #catalog/...) и для scripts/generate-catalog-pages.mjs,
// который создает эти страницы при сборке. Поменять адрес — значит потерять позиции в поиске: только с 301.

export const catalogRoot = 'katalog/';

// Русские адреса разделов вместо служебных slug из catalog-products.json.
export const categoryPathNames = {
  engines: 'dvigateli',
  transmission: 'akpp',
  chassis: 'diski-podveska-tormoza',
  body: 'kuzov',
  optics: 'optika',
  interior: 'salon',
};

const transliteration = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch',
  ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

// Нужна для адресов страниц деталей: «Двигатель BMW E39 M54» → «dvigatel-bmw-e39-m54».
export function slugify(text) {
  return [...String(text).toLowerCase()]
    .map((char) => transliteration[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Адрес раздела без ведущего слэша: главная ссылается относительно себя, чтобы работать и в подпапке.
export function categoryPath(categorySlug) {
  const pathName = categoryPathNames[categorySlug];
  if (!pathName) throw new Error(`Нет адреса для раздела каталога «${categorySlug}»`);
  return `${catalogRoot}${pathName}/`;
}

export function productPath(categorySlug, productTitle) {
  return `${categoryPath(categorySlug)}${slugify(productTitle)}/`;
}
