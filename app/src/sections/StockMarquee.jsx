import { useState } from 'react';
import { trackGoal } from '../analytics.js';
import { productPath } from '../catalogPaths.js';
import { catalog } from '../data.js';

// Все детали каталога со ссылками на их страницы. Ссылки — те же, что в каталоге: лента заодно помогает
// поисковым роботам найти страницы деталей с главной.
const stockItems = catalog.flatMap((category) =>
  category.items.map((item) => ({ title: item.title, href: productPath(category.slug, item.title) })),
);

function StockList({ hidden = false }) {
  return (
    <ul className="marquee__list" aria-hidden={hidden || undefined}>
      {stockItems.map((item) => (
        <li key={item.href}>
          <a href={item.href} tabIndex={hidden ? -1 : undefined} onClick={() => trackGoal('catalog_open')}>
            {item.title}
          </a>
        </li>
      ))}
    </ul>
  );
}

// Нужна для бегущей ленты под первым экраном (как «marquee»): названия деталей с фото со склада. Лента
// останавливается под курсором, при фокусе с клавиатуры и кнопкой «пауза»; при «Уменьшить движение» в
// системе стоит на месте и листается пальцем. Вторая копия списка нужна для бесшовного круга и скрыта
// от программ чтения с экрана.
export function StockMarquee() {
  const [paused, setPaused] = useState(false);

  return (
    <section className="stock-marquee" aria-labelledby="stock-marquee-title">
      <div className="container">
        <div className="tile tile--dark stock-marquee__tile">
          <h2 className="stock-marquee__label" id="stock-marquee-title">
            С фото со склада
          </h2>
          <div className={`marquee${paused ? ' is-paused' : ''}`}>
            <div className="marquee__track">
              <StockList />
              <StockList hidden />
            </div>
          </div>
          <button
            type="button"
            className="marquee__toggle"
            aria-pressed={paused}
            onClick={() => setPaused((value) => !value)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              {paused ? <path d="M8 5v14l11-7z" fill="currentColor" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" />}
            </svg>
            <span className="visually-hidden">Остановить ленту</span>
          </button>
        </div>
      </div>
    </section>
  );
}
