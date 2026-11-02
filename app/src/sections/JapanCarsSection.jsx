import { useEffect, useRef, useState } from 'react';
import { trackGoal } from '../analytics.js';
import { Icon } from '../components/Icon.jsx';
import { contact, createMessengerUrl, japanCars } from '../data.js';
import { canAnimateOnView } from '../lib/motion.js';

const AUTOPLAY_MS = 4500;

// Место машины в карусели относительно выбранной: 0 — в центре крупно, 1 и 2 — справа поменьше,
// остальные спрятаны за правым краем и въезжают оттуда.
function slotOf(index, activeIndex, total) {
  return (index - activeIndex + total) % total;
}

// Нужна для блока «Уже заказали в Японии» в духе примера владельца с мороженым: весь блок окрашен в цвет
// машины в центре, машины стоят каруселью (в центре крупно, следующие справа меньше). При смене центральная
// уезжает вниз влево, следующая выезжает в центр, фон перекрашивается. Внизу — волна с миниатюрами, стрелками
// и точками. Карусель листается сама, пока блок на экране; останавливается под курсором, при фокусе и
// навсегда — после первого нажатия. При «Уменьшить движение» сама не листается.
export function JapanCarsSection() {
  const total = japanCars.length;
  // previous — какая машина была в центре до смены: нужна, чтобы проиграть уход вниз влево (вперёд)
  // или возвращение снизу (назад) только у той машины, которая действительно уезжает или возвращается.
  const [carousel, setCarousel] = useState({ active: 0, previous: null, direction: 'next' });
  const { active: activeIndex, previous: previousIndex, direction } = carousel;
  const [autoplay, setAutoplay] = useState(true);
  const [interacted, setInteracted] = useState(false);
  const sectionRef = useRef(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !autoplay || total < 2 || !canAnimateOnView()) return undefined;

    let timer = 0;
    let visible = false;
    const schedule = () => {
      window.clearInterval(timer);
      if (!visible) return;
      timer = window.setInterval(() => {
        if (pausedRef.current || document.visibilityState !== 'visible') return;
        setCarousel((current) => ({ active: (current.active + 1) % total, previous: current.active, direction: 'next' }));
      }, AUTOPLAY_MS);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    });
    observer.observe(section);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [autoplay, total]);

  if (!total) return null;
  const car = japanCars[activeIndex];

  const go = (nextIndex, nextDirection) => {
    setAutoplay(false);
    setInteracted(true);
    setCarousel((current) => ({ active: (nextIndex + total) % total, previous: current.active, direction: nextDirection }));
  };

  return (
    <section
      className="ice"
      id="japan-cars"
      aria-labelledby="japan-cars-title"
      style={{ '--stage-bg': car.stage.bg }}
      ref={sectionRef}
      onPointerEnter={() => {
        pausedRef.current = true;
      }}
      onPointerLeave={() => {
        pausedRef.current = false;
      }}
      onFocus={() => {
        pausedRef.current = true;
      }}
      onBlur={() => {
        pausedRef.current = false;
      }}
    >
      <div className="container ice__grid">
        <div className="ice__text">
          <p className="ice__eyebrow">Авто из Японии под заказ</p>
          <h2 id="japan-cars-title" className="ice__title">
            Уже заказали в Японии
          </h2>
          <p className="ice__lead">
            Фото сделаны в Японии. Подберём похожий автомобиль под ваш бюджет и доставим в любую точку России.
          </p>
          <p className="ice__car" aria-live={interacted ? 'polite' : 'off'} key={car.query}>
            <strong>{car.title}</strong>
            <span>Кузов {car.code}</span>
          </p>
          <div className="ice__actions">
            <a
              className="button button--light button--arrow"
              href={createMessengerUrl(contact.telegram, `Хочу похожий автомобиль из Японии: ${car.query}. Бюджет и годы выпуска:`)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGoal('japan_car_telegram')}
            >
              Хочу похожий
              <span className="round-arrow round-arrow--small" aria-hidden="true">
                <Icon name="arrow" size={16} />
              </span>
            </a>
            <a className="button button--outline-light" href="avtomobili-iz-yaponii-barnaul/">
              Как заказать
            </a>
          </div>
        </div>

        <div className="ice__stage" role="group" aria-roledescription="карусель" aria-label="Машины, которые уже заказали">
          {japanCars.map((item, index) => {
            const slot = slotOf(index, activeIndex, total);
            const isActive = slot === 0;
            const leaving = direction === 'next' && index === previousIndex && slot === total - 1;
            const returning = direction === 'prev' && isActive && previousIndex === (index + 1) % total;
            return (
              <button
                type="button"
                className="ice__item"
                data-slot={Math.min(slot, 3)}
                data-motion={leaving ? 'leave' : returning ? 'return' : undefined}
                aria-hidden={slot > 2 ? 'true' : undefined}
                tabIndex={isActive || slot > 2 ? -1 : 0}
                aria-label={isActive ? undefined : `Показать: ${item.title}`}
                onClick={() => !isActive && go(index, 'next')}
                key={item.query}
              >
                <img src={item.photos[0].src} alt={isActive ? item.photos[0].alt : ''} width="840" height="560" loading="lazy" decoding="async" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="ice__wave">
        <svg className="ice__wave-shape" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 64c96-38 182-52 268-22s150 66 252 58 140-70 250-78 166 54 268 60 168-42 250-52 112 6 152 18V120H0Z" />
        </svg>
        <div className="container ice__bar">
          <div className="ice__thumbs">
            <span className="ice__avatars" aria-hidden="true">
              {japanCars.slice(0, 3).map((item) => (
                <img src={item.photos[0].src} alt="" width="840" height="560" loading="lazy" decoding="async" key={item.query} />
              ))}
            </span>
            <span>
              <strong>{total} машины</strong>
              <small>уже заказали в Японии</small>
            </span>
          </div>
          <div className="ice__arrows">
            <button type="button" onClick={() => go(activeIndex - 1, 'prev')} aria-label="Предыдущая машина">
              <Icon name="chevron-left" />
            </button>
            <button type="button" onClick={() => go(activeIndex + 1, 'next')} aria-label="Следующая машина">
              <Icon name="chevron-right" />
            </button>
          </div>
          <div className="ice__dots" role="group" aria-label="Выбрать машину">
            {japanCars.map((item, index) => (
              <button
                type="button"
                aria-pressed={index === activeIndex}
                aria-label={`${item.title}, кузов ${item.code}`}
                onClick={() => go(index, index < activeIndex ? 'prev' : 'next')}
                key={item.query}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
