import { trackGoal } from '../analytics.js';
import { contact, createMessengerUrl, featuredProducts } from '../data.js';
import { handleImageError } from '../lib/images.js';

// Нужна для блока «Примеры с нашего склада»: реальные позиции и запрос цены в Telegram. Первая карточка крупная,
// остальные — плитки вокруг неё.
export function FeaturedSection({ onCatalogOpen }) {
  return (
    <section className="section" id="stock" aria-labelledby="featured-title">
      <div className="container">
        <div className="section-head">
          <h2 id="featured-title" className="section-title">
            Примеры с нашего склада
          </h2>
          <p>На фото — реальные детали с биркой MB KUZBASS. Наличие и цену подтверждаем перед продажей.</p>
        </div>
        <div className="product-grid">
          {featuredProducts.map((product, index) => (
            <article className={`product-card product-card--${index + 1}`} key={product.title}>
              <a
                className="product-card__media"
                href={`#catalog/${product.categorySlug}`}
                onClick={(event) => onCatalogOpen(event, product.categorySlug)}
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
                  className="button button--accent"
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
  );
}
