import { trackGoal } from '../analytics.js';
import { Icon } from '../components/Icon.jsx';
import { contact, createMessengerUrl, dromListingsLabel, heroImages } from '../data.js';

// Нужна для блока контактов в виде мозаики: телефон и мессенджеры, фото площадки и площадки, где есть MB Kuzbass.
export function ContactsSection({ reviewsMeta }) {
  return (
    <section className="section" id="contacts" aria-labelledby="contacts-title">
      <div className="container contacts">
        <div className="tile tile--dark contacts__main">
          <h2 id="contacts-title" className="section-title">
            Приезжайте или напишите
          </h2>
          <dl className="contacts__facts">
            <div>
              <dt>Адрес склада</dt>
              <dd>{contact.address}</dd>
            </div>
            <div>
              <dt>Режим работы</dt>
              <dd>{contact.workTime}</dd>
            </div>
          </dl>
          <a className="contacts__phone" href={contact.phoneHref} onClick={() => trackGoal('contacts_phone')}>
            {contact.phone}
          </a>
          <div className="contacts__buttons">
            <a
              className="button button--accent"
              href={createMessengerUrl(contact.telegram)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGoal('contacts_telegram')}
            >
              <Icon name="send" size={18} />
              Telegram @MB_Kuzbass
            </a>
            <a
              className="button button--outline-light"
              href={createMessengerUrl(contact.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGoal('contacts_whatsapp')}
            >
              WhatsApp
            </a>
            <a
              className="button button--outline-light"
              href={contact.twoGis}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGoal('contacts_route')}
            >
              Маршрут в 2ГИС
            </a>
          </div>
        </div>

        <figure className="tile tile--photo contacts__photo">
          <img src={heroImages.yard} alt={heroImages.yardAlt} width="1280" height="960" loading="lazy" decoding="async" />
          <figcaption className="tile__chip">{contact.address}</figcaption>
        </figure>

        <div className="tile contacts__more">
          <h3>Где мы ещё есть</h3>
          <a href={contact.telegramGroup} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('contacts_telegram_group')}>
            <span>Группа в Telegram</span>
            <span>t.me/mbc_kuzbass</span>
          </a>
          <a href={contact.vk} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('contacts_vk')}>
            <span>ВКонтакте</span>
            <span>vk.ru/mb_kuzbass</span>
          </a>
          <a href={contact.drom} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('contacts_drom')}>
            <span>Drom</span>
            <span>{dromListingsLabel}</span>
          </a>
          <a href={contact.twoGis} target="_blank" rel="noopener noreferrer" onClick={() => trackGoal('contacts_2gis')}>
            <span>2ГИС</span>
            <span>
              {reviewsMeta.rating} · {reviewsMeta.ratingCount}
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
