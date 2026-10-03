import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Шрифты заголовка и основного текста нужны на первом экране. Без предзагрузки браузер находит их только
// после CSS, заголовок перерисовывается другим шрифтом и сдвигает формы (CLS).
const preloadedFonts = /^assets\/onest-(cyrillic|latin)-(400|800)-normal-[\w-]+\.woff2$/;

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

export default defineConfig({
  base: './',
  plugins: [react(), preloadCriticalFonts()],
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
