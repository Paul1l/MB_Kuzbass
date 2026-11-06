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

// Главная приходит готовым HTML (scripts/prerender-home.mjs), а React подхватывает его синхронно (main.jsx).
// Скрипт с blocking="render" придерживает первый кадр до конца подхвата: счётчики уже на нуле, плитки ниже
// первого экрана уже ждут прокрутки, плашка cookie показана только тем, кто ещё не выбирал. Без этого браузер
// успел бы нарисовать готовый HTML, и итоговые числа и плитки мелькнули бы до анимации. Плавный переход со
// страницы детали на главную тоже видит готовую страницу. Поисковики и браузер без JavaScript получают HTML
// сразу. Браузеры без поддержки blocking (Firefox, Safari) просто рисуют готовый HTML раньше скрипта.
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

// Сайт открывается и из корня домена, и из подпапки, поэтому адреса файлов относительные.
const base = './';

export default defineConfig(({ isSsrBuild }) => ({
  base,
  // В серверной сборке Vite заменяет относительный base на «/», и адреса картинок в готовом HTML разошлись бы
  // с браузерными («/assets/…» против «./assets/…»). src/assetUrl.js берёт base отсюда — одинаковый в обеих сборках.
  define: {
    'import.meta.env.MB_ASSET_BASE': JSON.stringify(base),
  },
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
    // `vite build --ssr` (isSsrBuild) собирает только src/entry-server.jsx в dist-ssr для prerender-home.mjs:
    // папка public уже скопирована обычной сборкой, второй раз её копировать не нужно.
    copyPublicDir: !isSsrBuild,
  },
}));
