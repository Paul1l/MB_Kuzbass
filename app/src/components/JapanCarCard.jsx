import { useState } from 'react';
import { trackGoal } from '../analytics.js';
import { contact, createMessengerUrl } from '../data.js';
import { Icon } from './Icon.jsx';

// Нужна для карточек «Уже заказали в Японии». Стрелки стоят под фото, чтобы не закрывать машину и табличку;
// на телефоне свайп листает сами карточки, как в «Примерах с нашего склада». Следующее фото грузится при листании.
export function JapanCarCard({ car }) {
  const [activePhoto, setActivePhoto] = useState(0);
  const totalPhotos = car.photos.length;
  const photo = car.photos[activePhoto];
  const showPhoto = (delta) => setActivePhoto((current) => (current + delta + totalPhotos) % totalPhotos);

  return (
    <article className="car-card">
      <div className="car-card__media">
        <img src={photo.src} alt={photo.alt} width="840" height="560" loading="lazy" decoding="async" />
        <span className="tag">Фото из Японии</span>
      </div>
      <div className="car-card__body">
        <div className="car-card__meta">
          <span className="car-card__code mono">Кузов {car.code}</span>
          {totalPhotos > 1 && (
            <div className="car-card__nav">
              <button
                type="button"
                onClick={() => showPhoto(-1)}
                aria-label={`Предыдущее фото: ${car.title}`}
                title="Предыдущее фото"
              >
                ‹
              </button>
              <span aria-live="polite">
                {activePhoto + 1} / {totalPhotos}
              </span>
              <button
                type="button"
                onClick={() => showPhoto(1)}
                aria-label={`Следующее фото: ${car.title}`}
                title="Следующее фото"
              >
                ›
              </button>
            </div>
          )}
        </div>
        <h3>{car.title}</h3>
        <a
          className="button button--dark"
          href={createMessengerUrl(
            contact.telegram,
            `Хочу похожий автомобиль из Японии: ${car.query}. Бюджет и годы выпуска:`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackGoal('japan_car_telegram')}
        >
          <Icon name="send" size={18} />
          Хочу похожий
        </a>
      </div>
    </article>
  );
}
