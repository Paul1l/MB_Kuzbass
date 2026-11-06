// Общее для генераторов статичных страниц (каталог, статьи): контакты, первое сообщение в мессенджер, экранирование.
// Те же контакты, что в src/data.js (contact); data.js сам импортирует JSON каталога, поэтому Node его напрямую не читает.

export const contact = {
  phone: '+7 923 536-27-77',
  phoneHref: 'tel:+79235362777',
  telegram: 'https://t.me/MB_Kuzbass',
  whatsapp: 'https://wa.me/79235362777',
};

export const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Первое сообщение в мессенджере: как createMessengerUrl в src/data.js.
export const messengerUrl = (baseUrl, topic = '') =>
  `${baseUrl}?text=${encodeURIComponent(['Здравствуйте! Пишу с сайта mb-kuzbass.ru.', topic].filter(Boolean).join(' '))}`;

// Кнопки связи, как на посадочных: Telegram с темой обращения, звонок, WhatsApp.
export function contactButtons(topic, primaryLabel) {
  return `<div class="seo-actions">
            <a class="seo-button seo-button--primary" href="${escapeHtml(messengerUrl(contact.telegram, topic))}">${primaryLabel}</a>
            <a class="seo-button" href="${contact.phoneHref}">Позвонить</a>
            <a class="seo-button" href="${escapeHtml(messengerUrl(contact.whatsapp, topic))}">WhatsApp</a>
          </div>`;
}

// Нижняя панель связи на телефоне.
export function mobileBar(topic) {
  return `<nav class="seo-mobile-bar" aria-label="Быстрая связь">
      <a class="seo-mobile-bar__phone" href="${contact.phoneHref}">Позвонить</a>
      <a href="${escapeHtml(messengerUrl(contact.telegram, topic))}">Telegram</a>
      <a href="${escapeHtml(messengerUrl(contact.whatsapp, topic))}">WhatsApp</a>
    </nav>`;
}
