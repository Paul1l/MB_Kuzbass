import { JapanCarCard } from '../components/JapanCarCard.jsx';
import { japanCars } from '../data.js';

// Нужна для блока «Уже заказали в Японии». Если список машин в data.js пуст, блок не выводится.
export function JapanCarsSection() {
  if (!japanCars.length) return null;

  return (
    <section className="section section--white" id="japan-cars" aria-labelledby="japan-cars-title">
      <div className="container">
        <div className="section-head">
          <h2 id="japan-cars-title">Уже заказали в Японии</h2>
          <p>
            Фото сделаны в Японии. Подберём похожий автомобиль под ваш бюджет и доставим в любую точку России.
          </p>
        </div>
        <div className="car-grid">
          {japanCars.map((car) => (
            <JapanCarCard car={car} key={car.query} />
          ))}
        </div>
      </div>
    </section>
  );
}
