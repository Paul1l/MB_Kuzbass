import { trackGoal } from '../analytics.js';
import { Icon } from '../components/Icon.jsx';
import { contact, dromListingsLabel, reviews, trustPoints } from '../data.js';

const flampReview = reviews.find((review) => review.source === 'Фламп');

// Нужна для блока «Почему нам доверяют»: причины доверять, рейтинг 2ГИС, отзыв с Флампа и профиль на Drom.
export function TrustSection({ reviewsMeta, ratingDetails, reviewsStatusText }) {
  return (
    <section className="section section--paper" id="reviews" aria-labelledby="trust-title">
      <div className="container">
        <h2 id="trust-title" className="section-title">
          Почему нам доверяют
        </h2>
        <div className="trust-grid">
          {trustPoints.map((point) => (
            <div className="trust-card" key={point.title}>
              <Icon name={point.icon} size={30} />
              <h3>{point.title}</h3>
              <p>{point.text}</p>
            </div>
          ))}
        </div>
        <div className="review-grid">
          <div className="review-card review-card--rating">
            <div className="review-card__score">
              <strong>{reviewsMeta.rating}</strong>
              <Icon name="star" size={34} />
            </div>
            <p>
              Рейтинг в 2ГИС · {ratingDetails}
              {reviewsStatusText && <small> · {reviewsStatusText}</small>}
            </p>
            <a href={contact.twoGis} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('reviews_2gis')}>
              Читать отзывы в 2ГИС →
            </a>
          </div>
          {flampReview && (
            <div className="review-card">
              <span className="review-card__source">
                {flampReview.source} · {flampReview.rating} · {flampReview.date}
              </span>
              <p>{flampReview.text}</p>
              <a href={flampReview.link} target="_blank" rel="noopener noreferrer">
                Открыть отзыв на Флампе →
              </a>
            </div>
          )}
          <div className="review-card">
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
