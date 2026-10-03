import { trackGoal } from '../analytics.js';
import { contact, createMessengerUrl } from '../data.js';

// Нужна для мобильной версии. Держит звонок и мессенджеры на экране, пока посетитель листает страницу.
export function MobileContactBar() {
  return (
    <nav className="mobile-contact-bar" aria-label="Быстрая связь">
      <a className="mobile-contact-bar__phone" href={contact.phoneHref} onClick={() => trackGoal('mobile_bar_phone')}>
        Позвонить
      </a>
      <a
        href={createMessengerUrl(contact.telegram)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackGoal('mobile_bar_telegram')}
      >
        Telegram
      </a>
      <a
        href={createMessengerUrl(contact.whatsapp)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackGoal('mobile_bar_whatsapp')}
      >
        WhatsApp
      </a>
    </nav>
  );
}
