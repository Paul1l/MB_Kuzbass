import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.scss';

createRoot(document.getElementById('root')).render(<App />);

// Регистрирует offline-страницу только в опубликованной версии. Локальная разработка не получает
// устаревший service worker и не кеширует промежуточные сборки.
if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Ошибка service worker не должна мешать загрузке основного сайта.
    });
  });
}
