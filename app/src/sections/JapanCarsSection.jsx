import { useState } from 'react';
import { JapanCarCard } from '../components/JapanCarCard.jsx';
import { japanCars } from '../data.js';

// Нужна для блока «Уже заказали в Японии» в виде витрины: одна машина крупно, справа (на телефоне — под ней)
// кнопки выбора. Витрина перекрашивается в цвет выбранной машины, фото въезжает заново (как смена товара
// с фоном в его цвет). Если список машин в data.js пуст, блок не выводится.
export function JapanCarsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  if (!japanCars.length) return null;
  const car = japanCars[activeIndex];

  return (
    <section className="section section--dark section--band-end" id="japan-cars" aria-labelledby="japan-cars-title">
      <div className="container">
        <div className="section-head">
          <h2 id="japan-cars-title" className="section-title">
            Уже заказали в Японии
          </h2>
          <p>Фото сделаны в Японии. Подберём похожий автомобиль под ваш бюджет и доставим в любую точку России.</p>
        </div>
        <div className="car-stage" data-tone={car.stage.tone} style={{ '--stage-bg': car.stage.bg }}>
          <JapanCarCard car={car} key={car.query} />
          <div className="car-picker" role="group" aria-label="Выбрать автомобиль">
            {japanCars.map((item, index) => (
              <button
                type="button"
                className="car-pick"
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
                key={item.query}
              >
                <img src={item.photos[0].src} alt="" width="840" height="560" loading="lazy" decoding="async" />
                <span>
                  <strong>{item.title}</strong>
                  <small>Кузов {item.code}</small>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
