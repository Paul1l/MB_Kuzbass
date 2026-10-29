import { Icon } from '../components/Icon.jsx';
import { catalog, catalogCards, landingPages } from '../data.js';
import { handleImageError } from '../lib/images.js';

// Нужна для блока «Каталог запчастей» на главной: мозаика категорий с фото со склада и ссылки на разделы сайта.
export function CatalogSection({ onCatalogOpen }) {
  return (
    <section className="section" id="catalog" aria-labelledby="catalog-title">
      <div className="container">
        <div className="section-head">
          <h2 id="catalog-title" className="section-title">
            Каталог запчастей
          </h2>
          <p>Наличие меняется каждый день. Пришлите VIN — скажем, что есть сейчас и сколько стоит.</p>
        </div>
        <div className="category-grid">
          {catalog.map((item) => (
            <a
              className={`category-card category-card--${item.slug}`}
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
                {catalogCards[item.slug] && <span className="category-card__codes">{catalogCards[item.slug].codes}</span>}
              </span>
              <span className="round-arrow category-card__arrow" aria-hidden="true">
                <Icon name="arrow" size={20} />
              </span>
            </a>
          ))}
        </div>
        <nav className="pill-row" aria-label="Подробнее о запчастях и услугах">
          {landingPages.map((page) => (
            <a className="pill" href={page.href} key={page.href}>
              {page.label}
            </a>
          ))}
        </nav>
      </div>
    </section>
  );
}
