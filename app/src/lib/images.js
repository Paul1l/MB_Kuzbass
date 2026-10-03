import { brandBackdropImage } from '../data.js';

// Прозрачная точка вместо фото первого экрана на телефоне: там фото скрыто, и браузер не скачивает лишнее.
export const EMPTY_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Показывает фирменную заглушку вместо картинки, которая не загрузилась: например, страница из кеша ссылается
// на файл, который уже заменили при выкладке.
function createImageFallbackHandler(fallbackUrl) {
  return (event) => {
    const image = event.currentTarget;
    if (image.dataset.fallbackApplied === 'true') return;

    image.dataset.fallbackApplied = 'true';
    image.classList.add('is-fallback');
    image.src = fallbackUrl;
  };
}

export const handleImageError = createImageFallbackHandler(brandBackdropImage);
