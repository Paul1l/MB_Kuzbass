import { Icon } from '../components/Icon.jsx';
import { directions } from '../data.js';

// Нужна для блока «Авто из Японии и поставки для разборов»: две фото-плитки со ссылками на посадочные страницы.
export function DirectionsSection() {
  return (
    <section className="section section--dark section--band-start" id="directions" aria-labelledby="directions-title">
      <div className="container">
        <div className="section-head">
          <h2 id="directions-title" className="section-title">
            Авто из Японии и поставки для разборов
          </h2>
          <p>Кроме запчастей подбираем автомобили на аукционах Японии и собираем машинокомплекты для авторазборов.</p>
        </div>
        <div className="direction-grid">
          {directions.map((item) => (
            <article className="direction-card" key={item.title}>
              <img src={item.image} alt={item.alt} width="1280" height="960" loading="lazy" decoding="async" />
              <div className="direction-card__body">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
              <div className="notch notch--dark">
                <a className="notch__link" href={item.href}>
                  {item.linkText}
                  <span className="round-arrow round-arrow--light" aria-hidden="true">
                    <Icon name="arrow" size={20} />
                  </span>
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
