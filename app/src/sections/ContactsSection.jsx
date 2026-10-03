import { trackGoal } from '../analytics.js';
import { Icon } from '../components/Icon.jsx';
import { contact, createMessengerUrl, dromListingsLabel } from '../data.js';

// Нужна для блока контактов: адрес, режим, телефон, мессенджеры и площадки, где есть MB Kuzbass.
export function ContactsSection({ reviewsMeta }) {
  return (
    <section className="section section--dark" id="contacts" aria-labelledby="contacts-title">
      <div className="container contacts">
        <div className="contacts__main">
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

        <div className="contacts__more">
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
