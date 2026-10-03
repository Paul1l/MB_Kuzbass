import { trackGoal } from '../analytics.js';
import { contact, createMessengerUrl } from '../data.js';
import { CatalogProductGallery } from './CatalogProductGallery.jsx';
import { Icon } from './Icon.jsx';

// Нужна для SPA-страниц каталога. Показывает выбранную категорию, карточки позиций и CTA для запроса в Telegram.
export function CatalogCategoryPage({ category }) {
  return (
    <section className="catalog-page">
      <div className="container catalog-page__inner">
        <a className="catalog-page__back" href="#catalog">
          ← Вернуться к категориям
        </a>

        <div className="catalog-page__hero">
          <span>Каталог запчастей</span>
          <h1>{category.label}</h1>
          <p>{category.description}</p>
          <div className="catalog-page__actions">
            <a
              className="button button--accent"
              href={createMessengerUrl(contact.telegram, `Интересует раздел «${category.label}».`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGoal('catalog_telegram')}
            >
              <Icon name="send" size={18} />
              Уточнить наличие в Telegram
            </a>
            <a className="button button--outline" href={contact.phoneHref} onClick={() => trackGoal('catalog_phone')}>
              Позвонить
            </a>
          </div>
          <p className="catalog-page__notice">
            Информационная витрина: наличие, состояние, комплектность и цена подтверждаются менеджером.
            Заказ и оплата на сайте не оформляются.
          </p>
        </div>

        <div className="catalog-products" aria-label={`Каталог: ${category.label}`}>
          {category.items.map((item) => (
            <article className="catalog-product-card" key={item.title}>
              <CatalogProductGallery product={item} />
              <div className="catalog-product-card__body">
                <span>{item.meta}</span>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                <a
                  className="button button--dark"
                  href={createMessengerUrl(contact.telegram, `Интересует: ${item.title}. Есть в наличии?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackGoal('catalog_item_telegram')}
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
