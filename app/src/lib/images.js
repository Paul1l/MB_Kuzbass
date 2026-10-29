import { brandBackdropImage } from '../data.js';

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
