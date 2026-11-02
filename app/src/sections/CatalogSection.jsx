import { trackGoal } from '../analytics.js';
import { categoryPath } from '../catalogPaths.js';
import { Icon } from '../components/Icon.jsx';
import { catalog, catalogCards, landingPages } from '../data.js';
import { handleImageError } from '../lib/images.js';

// Нужна для блока «Каталог запчастей» на главной: мозаика разделов с фото со склада. Каждая плитка ведет
// на отдельную страницу раздела /katalog/<раздел>/, которую видят поисковики.
export function CatalogSection() {
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
              href={categoryPath(item.slug)}
              onClick={() => trackGoal('catalog_open')}
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
          <a className="pill" href="katalog/">
            Весь каталог запчастей
          </a>
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
