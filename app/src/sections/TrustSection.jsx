import { trackGoal } from '../analytics.js';
import { Icon } from '../components/Icon.jsx';
import { contact, dromListingsLabel, reviews, trustPoints } from '../data.js';

const flampReview = reviews.find((review) => review.source === 'Фламп');

// Нужна для блока «Почему нам доверяют» в виде мозаики: крупный рейтинг 2ГИС, причины доверять, отзыв с Флампа
// и профиль на Drom.
export function TrustSection({ reviewsMeta, ratingDetails, reviewsStatusText }) {
  return (
    <section className="section" id="reviews" aria-labelledby="trust-title">
      <div className="container">
        <div className="section-head">
          <h2 id="trust-title" className="section-title">
            Почему нам доверяют
          </h2>
          <p>Только то, что можно проверить: рейтинг, отзывы, профиль продавца и реквизиты.</p>
        </div>
        <div className="trust-grid">
          <div className="tile tile--accent trust-rating">
            <div className="trust-rating__score">
              <strong>{reviewsMeta.rating}</strong>
              <Icon name="star" size={40} />
            </div>
            <p>
              Рейтинг в 2ГИС · {ratingDetails}
              {reviewsStatusText && <small> · {reviewsStatusText}</small>}
            </p>
            <a
              className="button button--light button--arrow"
              href={contact.twoGis}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGoal('reviews_2gis')}
            >
              Читать отзывы в 2ГИС
              <span className="round-arrow round-arrow--small" aria-hidden="true">
                <Icon name="arrow" size={16} />
              </span>
            </a>
          </div>

          {trustPoints.map((point) => (
            <div className="tile trust-card" key={point.title}>
              <span className="trust-card__icon">
                <Icon name={point.icon} size={26} />
              </span>
              <h3>{point.title}</h3>
              <p>{point.text}</p>
            </div>
          ))}

          {flampReview && (
            <div className="tile review-card">
              <span className="review-card__source">
                {flampReview.source} · {flampReview.rating} · {flampReview.date}
              </span>
              <p>{flampReview.text}</p>
              <a href={flampReview.link} target="_blank" rel="noopener noreferrer">
                Открыть отзыв на Флампе →
              </a>
            </div>
          )}

          <div className="tile tile--dark review-card">
            <span className="review-card__source">Drom · профиль продавца MBKuzbass</span>
            <p>{dromListingsLabel}, история продавца и отзывы покупателей.</p>
            <a href={contact.drom} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('reviews_drom')}>
              Открыть профиль на Drom →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
