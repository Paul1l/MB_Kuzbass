import { ConsentCheckbox } from '../components/ConsentCheckbox.jsx';
import { FormStatus } from '../components/FormStatus.jsx';
import { Icon } from '../components/Icon.jsx';
import { LegalLink } from '../components/LegalLink.jsx';
import { dromListingsLabel, heroImages, legalDocs } from '../data.js';
import { EMPTY_IMAGE } from '../lib/images.js';

// Нужна для первого экрана: заголовок, две формы заявки («Нужна запчасть» и «Хочу авто из Японии») и короткие
// факты о компании. На телефоне видна одна форма, вторую открывает переключатель.
export function HeroSection({
  heroMode,
  onHeroModeChange,
  vehicleQuery,
  onVehicleQueryChange,
  partInputRef,
  formStatus,
  onLeadSubmit,
  onOpenLegal,
  reviewsMeta,
  ratingDetails,
}) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__inner">
        <div className="route" aria-label="Маршрут: Япония, Барнаул, вся Россия">
          <span className="route__point route__point--start">Япония</span>
          <span className="route__line" aria-hidden="true" />
          <span className="route__point">Барнаул</span>
          <span className="route__line" aria-hidden="true" />
          <span className="route__point">вся Россия</span>
        </div>

        <div className="hero__head">
          <h1 id="hero-title">Mercedes-Benz и BMW из Японии — по запчастям и целиком</h1>
          <p className="hero__lead">
            Контрактные запчасти с японских доноров и автомобили с аукционов Японии под заказ. Склад
            в Барнауле, отправка по всей России.
          </p>
        </div>

        <div className="hero-switch" role="group" aria-label="Что вы ищете">
          <button type="button" aria-pressed={heroMode === 'parts'} onClick={() => onHeroModeChange('parts')}>
            Нужна запчасть
          </button>
          <button type="button" aria-pressed={heroMode === 'car'} onClick={() => onHeroModeChange('car')}>
            Авто из Японии
          </button>
        </div>

        <div className="doors" id="request">
          <article className={`door${heroMode === 'parts' ? ' is-active' : ''}`} aria-labelledby="door-parts-title">
            <div className="door__media">
              <picture>
                <source media="(max-width: 820px)" srcSet={EMPTY_IMAGE} />
                <img src={heroImages.parts} alt={heroImages.partsAlt} width="1280" height="960" />
              </picture>
              <span className="tag">Запчасти</span>
            </div>
            <form className="door__form ym-hide-content" onSubmit={(event) => onLeadSubmit(event, 'parts')}>
              <h2 id="door-parts-title">Нужна запчасть</h2>
              <p>
                Двигатели, АКПП, оптика, кузов, подвеска с японских доноров. Проверим по VIN и пришлём
                фото до оплаты.
              </p>
              <div className="door__fields">
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
              </div>
              <ConsentCheckbox id="lead-parts-agree" onOpenLegal={onOpenLegal} />
              <button className="button button--accent button--wide" type="submit">
                <Icon name="send" />
                Подобрать запчасть
              </button>
              <FormStatus status={formStatus.parts} />
            </form>
          </article>

          <article className={`door${heroMode === 'car' ? ' is-active' : ''}`} aria-labelledby="door-car-title">
            <div className="door__media">
              <picture>
                <source media="(max-width: 820px)" srcSet={EMPTY_IMAGE} />
                <img src={heroImages.cars} alt={heroImages.carsAlt} width="960" height="1280" />
              </picture>
              <span className="tag tag--dark">Авто из Японии</span>
            </div>
            <form className="door__form ym-hide-content" onSubmit={(event) => onLeadSubmit(event, 'car')}>
              <h2 id="door-car-title">Хочу авто из Японии</h2>
              <p>Подберём и купим автомобиль на японском аукционе, доставим в любую точку России.</p>
              <div className="door__fields">
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
              </div>
              <ConsentCheckbox id="lead-car-agree" onOpenLegal={onOpenLegal} />
              <button className="button button--dark button--wide" type="submit">
                <Icon name="send" />
                Подобрать автомобиль
              </button>
              <FormStatus status={formStatus.car} />
            </form>
          </article>
        </div>

        <p className="hero__note">
          Данные не отправляются на сервер сайта: форма копирует текст заявки, а отправляете его вы сами
          в Telegram. Перед отправкой ознакомьтесь с документом{' '}
          <LegalLink doc={legalDocs.find((doc) => doc.id === 'privacy')} onOpen={onOpenLegal} />.
          Согласие на публикацию имени, фото или отзыва этой галочкой не предоставляется.
        </p>

        <ul className="facts" aria-label="Коротко о компании">
          <li>
            <Icon name="star" size={26} />
            <span>
              <strong>{reviewsMeta.rating} в 2ГИС</strong>
              <small>{ratingDetails}</small>
            </span>
          </li>
          <li>
            <Icon name="layers" size={26} />
            <span>
              <strong>{dromListingsLabel}</strong>
              <small>профиль MBKuzbass на Drom</small>
            </span>
          </li>
          <li>
            <Icon name="pin" size={26} />
            <span>
              <strong>Склад в Барнауле</strong>
              <small>самовывоз по адресу</small>
            </span>
          </li>
          <li>
            <Icon name="truck" size={26} />
            <span>
              <strong>Отправка по России</strong>
              <small>транспортными компаниями</small>
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
