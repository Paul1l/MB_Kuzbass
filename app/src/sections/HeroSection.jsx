import { trackGoal } from '../analytics.js';
import { ConsentCheckbox } from '../components/ConsentCheckbox.jsx';
import { FormStatus } from '../components/FormStatus.jsx';
import { Icon } from '../components/Icon.jsx';
import { LegalLink } from '../components/LegalLink.jsx';
import { contact, createMessengerUrl, donorModels, dromListingsCount, heroImages, japanCars, legalDocs } from '../data.js';

const japanTeaser = japanCars[0]?.photos[0];

// Нужна для первого экрана в виде мозаики: заголовок, плитка с формой заявки, фото с площадки, авто из Японии,
// рейтинг 2ГИС и профиль на Drom. Формы «Нужна запчасть» и «Авто из Японии» переключаются кнопками над формой.
export function HeroSection({
  heroMode,
  onHeroModeChange,
  vehicleQuery,
  onVehicleQueryChange,
  partInputRef,
  formStatus,
  onLeadSubmit,
  onOpenLegal,
  onDonorPick,
  reviewsMeta,
  ratingDetails,
}) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__grid">
        <div className="hero__head">
          <div className="route" aria-label="Маршрут: Япония, Барнаул, вся Россия">
            <span className="route__point route__point--start">Япония</span>
            <span className="route__line" aria-hidden="true" />
            <span className="route__point">Барнаул</span>
            <span className="route__line" aria-hidden="true" />
            <span className="route__point">вся Россия</span>
          </div>
          <h1 id="hero-title">Mercedes-Benz и BMW из Японии — по запчастям и целиком</h1>
          <p className="hero__lead">
            Контрактные запчасти с японских доноров и автомобили с аукционов Японии под заказ. Склад
            в Барнауле, отправка по всей России.
          </p>
        </div>

        <div className="tile hero__form" id="request">
          <div className="hero-switch" role="group" aria-label="Что вы ищете">
            <button type="button" aria-pressed={heroMode === 'parts'} onClick={() => onHeroModeChange('parts')}>
              Нужна запчасть
            </button>
            <button type="button" aria-pressed={heroMode === 'car'} onClick={() => onHeroModeChange('car')}>
              Авто из Японии
            </button>
          </div>

          <form
            className={`door ym-hide-content${heroMode === 'parts' ? ' is-active' : ''}`}
            aria-labelledby="door-parts-title"
            onSubmit={(event) => onLeadSubmit(event, 'parts')}
          >
            <h2 id="door-parts-title">Подберём запчасть</h2>
            <p>Проверим по VIN и пришлём фото детали до оплаты.</p>
            <label htmlFor="lead-vehicle">
              VIN или марка, модель, год
              <input
                id="lead-vehicle"
                name="vehicle"
                type="text"
                placeholder="Например: W211 E300, 2007"
                maxLength="120"
                className="ym-disable-keys"
                value={vehicleQuery}
                onChange={(event) => onVehicleQueryChange(event.target.value)}
              />
            </label>
            <div className="donors" aria-label="Частые доноры">
              {donorModels.map((model) => (
                <button className="chip" type="button" onClick={() => onDonorPick(model)} key={model.query}>
                  {model.brand} <span className="mono">{model.code}</span>
                </button>
              ))}
            </div>
            <label htmlFor="lead-part">
              Какая деталь нужна
              <input
                id="lead-part"
                name="part"
                type="text"
                placeholder="Например: АКПП или левая фара"
                maxLength="300"
                className="ym-disable-keys"
                ref={partInputRef}
              />
            </label>
            <ConsentCheckbox id="lead-parts-agree" onOpenLegal={onOpenLegal} />
            <button className="button button--accent button--wide" type="submit">
              <Icon name="send" />
              Подобрать запчасть
            </button>
            <FormStatus status={formStatus.parts} />
          </form>

          <form
            className={`door ym-hide-content${heroMode === 'car' ? ' is-active' : ''}`}
            aria-labelledby="door-car-title"
            onSubmit={(event) => onLeadSubmit(event, 'car')}
          >
            <h2 id="door-car-title">Подберём авто из Японии</h2>
            <p>Подберём и купим автомобиль на японском аукционе, доставим в любую точку России.</p>
            <label htmlFor="lead-car">
              Марка, модель, годы выпуска
              <input
                id="lead-car"
                name="car"
                type="text"
                placeholder="Например: Mercedes-Benz E-Class, 2016–2019"
                maxLength="160"
                className="ym-disable-keys"
              />
            </label>
            <label htmlFor="lead-city">
              Куда доставить
              <input
                id="lead-city"
                name="city"
                type="text"
                placeholder="Например: Новосибирск"
                maxLength="80"
                className="ym-disable-keys"
              />
            </label>
            <ConsentCheckbox id="lead-car-agree" onOpenLegal={onOpenLegal} />
            <button className="button button--dark button--wide" type="submit">
              <Icon name="send" />
              Подобрать автомобиль
            </button>
            <FormStatus status={formStatus.car} />
          </form>

          <div className="hero__alt">
            <span>Удобнее написать самим?</span>
            <div className="hero__alt-links">
              <a
                className="pill"
                href={createMessengerUrl(contact.telegram)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackGoal('hero_telegram')}
              >
                Telegram
              </a>
              <a
                className="pill"
                href={createMessengerUrl(contact.whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackGoal('hero_whatsapp')}
              >
                WhatsApp
              </a>
              <a className="pill" href={contact.phoneHref} onClick={() => trackGoal('hero_phone')}>
                {contact.phone}
              </a>
            </div>
          </div>

          <p className="hero__note">
            Данные не отправляются на сервер сайта: форма копирует текст заявки, а отправляете его вы сами
            в Telegram. Перед отправкой ознакомьтесь с документом{' '}
            <LegalLink doc={legalDocs.find((doc) => doc.id === 'privacy')} onOpen={onOpenLegal} />.
            Согласие на публикацию имени, фото или отзыва этой галочкой не предоставляется.
          </p>
        </div>
        <figure className="tile tile--photo hero__main">
          <img
            src={heroImages.main}
            srcSet={`${heroImages.mainSmall} 480w, ${heroImages.main} 960w`}
            sizes="(max-width: 1100px) 50vw, 440px"
            alt={heroImages.mainAlt}
            width="960"
            height="1280"
            loading="lazy"
            decoding="async"
          />
          <figcaption className="tile__chip">Склад в Барнауле</figcaption>
          <div className="notch">
            <a className="notch__link" href="#catalog">
              <span className="notch__text">Каталог запчастей</span>
              <span className="round-arrow" aria-hidden="true">
                <Icon name="arrow" size={22} />
              </span>
            </a>
          </div>
        </figure>

        {japanTeaser && (
          <a className="tile tile--photo hero__japan" href="#japan-cars">
            <img src={japanTeaser.src} alt="" width="840" height="560" loading="lazy" decoding="async" />
            <span className="tile__caption">
              <strong>Авто из Японии под заказ</strong>
              <small>Что уже заказали →</small>
            </span>
          </a>
        )}

        <a
          className="tile tile--dark hero__stat hero__stat--rating"
          href={contact.twoGis}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackGoal('reviews_2gis')}
        >
          <span className="hero__stat-value">
            {reviewsMeta.rating}
            <Icon name="star" size={26} />
          </span>
          <span className="hero__stat-label">в 2ГИС · {ratingDetails}</span>
        </a>

        <a
          className="tile tile--accent hero__stat hero__stat--drom"
          href={contact.drom}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackGoal('reviews_drom')}
        >
          <span className="hero__stat-value">{dromListingsCount}</span>
          <span className="hero__stat-label">объявлений на Drom</span>
        </a>

      </div>
    </section>
  );
}
