import { catalog, catalogCards } from '../data.js';
import { handleImageError } from '../lib/images.js';

// Нужна для блока «Каталог запчастей» на главной: карточки категорий с фото и кодами агрегатов.
export function CatalogSection({ onCatalogOpen }) {
  return (
    <section className="section section--paper" id="catalog" aria-labelledby="catalog-title">
      <div className="container">
        <div className="section-head">
          <h2 id="catalog-title">Каталог запчастей</h2>
          <p>Наличие меняется каждый день. Пришлите VIN — скажем, что есть сейчас и сколько стоит.</p>
        </div>
        <div className="category-grid">
          {catalog.map((item) => (
            <a
              className="category-card"
              href={item.href}
              onClick={(event) => onCatalogOpen(event, item.slug)}
              key={item.slug}
            >
              <img
                src={catalogCards[item.slug]?.cover || item.items[0]?.images[0]}
                alt={`${item.label} — фото товара MB Kuzbass`}
                width="800"
                height="600"
                loading="lazy"
                decoding="async"
                onError={handleImageError}
              />
              <span className="category-card__body">
                <strong>{item.label}</strong>
                {catalogCards[item.slug] && <span className="mono">{catalogCards[item.slug].codes}</span>}
                <span className="category-card__more">Смотреть раздел →</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
