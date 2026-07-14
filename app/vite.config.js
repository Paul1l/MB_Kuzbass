import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
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
