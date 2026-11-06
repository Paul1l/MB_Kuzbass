import { flushSync } from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.scss';

// Главная приходит готовым HTML (scripts/prerender-home.mjs): React подхватывает эту разметку, а не рисует заново.
// Подхват синхронный: к концу скрипта страница уже живая, счётчики и плашка cookie в нужном состоянии, и первый
// кадр после отпускания отрисовки (renderBlockingEntry в vite.config.js) такой же, как раньше.
// Пустой #root бывает при `npm run dev` без готового HTML — тогда страница рисуется как раньше.
const container = document.getElementById('root');

if (container.firstElementChild) {
  flushSync(() => {
    hydrateRoot(container, <App />);
  });
} else {
  const root = createRoot(container);
  flushSync(() => root.render(<App />));
}

// Регистрирует offline-страницу только в опубликованной версии. Локальная разработка не получает
// устаревший service worker и не кеширует промежуточные сборки.
if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Ошибка service worker не должна мешать загрузке основного сайта.
    });
  });
}
