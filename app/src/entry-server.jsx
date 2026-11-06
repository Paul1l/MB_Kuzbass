import { renderToString } from 'react-dom/server';
import App from './App.jsx';

// Тексты документов и контакты для scripts/generate-legal-pages.mjs: страницы /dokumenty/…/ собираются из тех же
// данных, что окна документов на главной.
export { contact, createMessengerUrl, legalDocs, owner, site } from './data.js';

// Нужна только при сборке: scripts/prerender-home.mjs вставляет эту разметку в #root готового dist/index.html,
// чтобы поисковики и браузер без JavaScript видели заголовок, тексты и ссылки главной. Окна, cookie и размера
// экрана здесь нет — всё, что от них зависит, компоненты читают в эффектах уже в браузере.
export function render() {
  return renderToString(<App />);
}
