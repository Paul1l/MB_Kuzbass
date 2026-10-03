import { directions } from '../data.js';

// Нужна для блока «Авто из Японии и поставки для разборов» со ссылками на посадочные страницы.
export function DirectionsSection() {
  return (
    <section className="section section--dark" id="directions" aria-labelledby="directions-title">
      <div className="container">
        <h2 id="directions-title" className="section-title">
          Авто из Японии и поставки для разборов
        </h2>
        <div className="direction-grid">
          {directions.map((item) => (
            <article className="direction-card" key={item.title}>
              <img src={item.image} alt={item.alt} width="1280" height="960" loading="lazy" decoding="async" />
              <div className="direction-card__body">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <a href={item.href}>{item.linkText} →</a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
