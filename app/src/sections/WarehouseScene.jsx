import { useEffect, useRef } from 'react';
import { contact, dromListingsCount, warehouseScene } from '../data.js';
import { initScene } from '../lib/motion.js';

// Нужна для сцены «склад» в духе примеров владельца BORING и ARGON 18. Сначала фото разбора на весь экран
// с огромной надписью MB KUZBASS, фото наклоняется за курсором, как вид в окне. При прокрутке фон светлеет,
// фото уменьшается в карточку справа, надпись уезжает вверх и становится заголовком, слева появляются
// цифры и кнопки — как переход с тёмной обложки к странице товара в ARGON 18. Прогресс прокрутки и
// положение курсора считает initScene (motion.js), остальное — CSS (_scene.scss).
export function WarehouseScene({ reviewsMeta }) {
  const ref = useRef(null);
  useEffect(() => initScene(ref.current), []);

  return (
    <section className="scene" aria-labelledby="scene-title" ref={ref}>
      <div className="scene__sticky">
        <div className="scene__photo">
          <img src={warehouseScene.image} alt={warehouseScene.alt} width="1280" height="960" loading="lazy" decoding="async" />
        </div>
        <div className="scene__shade" aria-hidden="true" />
        <p className="scene__word" aria-hidden="true">
          MB Kuzbass
        </p>
        <div className="scene__intro">
          <p>{warehouseScene.intro}</p>
          <a href="katalog/">Смотреть каталог →</a>
        </div>
        <div className="scene__info">
          <p className="scene__eyebrow">Разбор в Барнауле</p>
          <h2 id="scene-title">Свой склад и свой разбор</h2>
          <p className="scene__text">{warehouseScene.text}</p>
          <dl className="scene__specs">
            <div>
              <dt>Объявлений на Drom</dt>
              <dd>{dromListingsCount}</dd>
            </div>
            <div>
              <dt>Рейтинг в 2ГИС</dt>
              <dd>{reviewsMeta.rating}</dd>
            </div>
            <div>
              <dt>Адрес склада</dt>
              <dd>{contact.address.replace('Барнаул, ', '')}</dd>
            </div>
            <div>
              <dt>Режим работы</dt>
              <dd>Пн–пт 09:00–18:00</dd>
            </div>
          </dl>
          <div className="scene__actions">
            <a className="button button--accent" href="#request">
              Подобрать запчасть
            </a>
            <a className="button button--outline" href={contact.twoGis} target="_blank" rel="noopener noreferrer">
              Маршрут в 2ГИС
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
