import { useState } from 'react';
import { handleImageError } from '../lib/images.js';

// Нужна для карточек каталога. Показывает фото товара, а если файл недоступен — запасное изображение.
export function CatalogProductGallery({ product }) {
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
