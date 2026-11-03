import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Шрифты заголовка (Unbounded 600) и основного текста (Onest 400) нужны на первом экране. Без предзагрузки
// браузер находит их только после CSS, заголовок перерисовывается другим шрифтом и сдвигает формы (CLS).
const preloadedFonts = /^assets\/(onest-(cyrillic|latin)-400|unbounded-(cyrillic|latin)-600)-normal-[\w-]+\.woff2$/;

function preloadCriticalFonts() {
  return {
    name: 'mb-preload-critical-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (!context.bundle) return html;

        return Object.keys(context.bundle)
          .filter((fileName) => preloadedFonts.test(fileName))
          .sort()
          .map((fileName) => ({
            tag: 'link',
            attrs: { rel: 'preload', href: `./${fileName}`, as: 'font', type: 'font/woff2', crossorigin: '' },
            injectTo: 'head',
          }));
      },
    },
  };
}

// Главная — SPA: пока не выполнен скрипт, страница пустая. Скрипт с blocking="render" придерживает первый кадр
// до готовой разметки (main.jsx рендерит синхронно), поэтому плавный переход со страницы детали обратно на
// главную показывает страницу, а не пустой фон. Заголовок и так рисует скрипт, поэтому скорость не меняется.
function renderBlockingEntry() {
  return {
    name: 'mb-render-blocking-entry',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        return html.replace('<script type="module" crossorigin src=', '<script type="module" crossorigin blocking="render" src=');
      },
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), preloadCriticalFonts(), renderBlockingEntry()],
  // Dev- и preview-серверы доступны только с этого компьютера. Это исключает случайную публикацию
  // исходников в локальную сеть во время обслуживания сайта.
  server: {
    host: '127.0.0.1',
    allowedHosts: ['localhost', '127.0.0.1'],
    cors: false,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    allowedHosts: ['localhost', '127.0.0.1'],
    cors: false,
    strictPort: true,
  },
  oxc: {
    legalComments: 'none',
  },
  build: {
    emptyOutDir: true,
    sourcemap: false,
  },
});
