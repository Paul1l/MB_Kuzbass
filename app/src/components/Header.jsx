import { trackGoal } from '../analytics.js';
import { brandAvatar, contact, createMessengerUrl, site } from '../data.js';
import { Icon } from './Icon.jsx';

// Нужна для шапки сайта: адрес и режим, бренд, меню, телефон и Telegram. На телефоне меню открывается кнопкой.
export function Header({ menuOpen, onToggleMenu, onCloseMenu }) {
  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <span>
            {contact.address} · {contact.workTime}
          </span>
          <span>Запчасти и автомобили из Японии · отправка по всей России</span>
        </div>
      </div>

      <header className="site-header">
        <div className="container site-header__inner">
          <a className="brand" href="#top" onClick={onCloseMenu}>
            <img className="brand__logo" src={brandAvatar} alt="Логотип MB Kuzbass" width="48" height="48" />
            <span className="brand__text">
              <strong>{site.shortName}</strong>
              <small>Запчасти и авто из Японии</small>
            </span>
          </a>

          <nav id="site-nav" className={`nav${menuOpen ? ' is-open' : ''}`} aria-label="Основное меню" onClick={onCloseMenu}>
            <a href="#catalog">Каталог</a>
            <a href="/avtomobili-iz-yaponii-barnaul/">Авто из Японии</a>
            <a href="/dvigateli-akpp-mercedes-bmw-barnaul/">Двигатели и АКПП</a>
            <a href="/postavki-dlya-avtorazborov-barnaul/">Для разборов</a>
            <a href="#contacts">Контакты</a>
          </nav>

          <div className="site-header__actions">
            <a className="header-phone" href={contact.phoneHref} onClick={() => trackGoal('header_phone')}>
              <Icon name="phone" />
              <span className="header-phone__text">
                <strong>{contact.phone}</strong>
                <small>пн–пт 9:00–18:00</small>
              </span>
            </a>
            <a
              className="button button--dark header-telegram"
              href={createMessengerUrl(contact.telegram)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackGoal('header_telegram')}
            >
              <Icon name="send" size={18} />
              Telegram
            </a>
            <button
              className="menu-toggle"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="site-nav"
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
              onClick={onToggleMenu}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} size={22} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
