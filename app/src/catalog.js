import catalogProducts from '../catalog-products.json';
import { getAssetUrl } from './assetUrl.js';

// Преобразует имя подготовленного изображения в URL, совместимый с локальным запуском и GitHub Pages.
function catalogAsset(categorySlug, fileName) {
  return getAssetUrl(`assets/catalog/${categorySlug}/${fileName}`);
}

// Единый источник данных каталога находится в app/catalog-products.json.
// Поля sourceImages нужны только скрипту импорта и не передаются в компоненты сайта.
export const catalog = catalogProducts.categories.map((category) => ({
  slug: category.slug,
  label: category.label,
  caption: 'Открыть каталог',
  href: `#catalog/${category.slug}`,
  description: category.description,
  items: category.products.map((product) => ({
    title: product.title,
    meta: product.meta,
    description: product.description,
    images: product.images.map((image) => catalogAsset(category.slug, image)),
    alt: `${product.title} — фото товара МБ Кузбасс`,
  })),
}));
