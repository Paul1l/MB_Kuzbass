import { defineConfig, devices } from '@playwright/test';

const port = 4173;

// Тесты открывают собранный сайт из dist через `vite preview`, поэтому перед `npm test` нужен `npm run build`.
// Файлы *.desktop.spec.js идут только на компьютере, *.mobile.spec.js — только на телефоне, остальные — на обоих.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}/`,
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { viewport: { width: 1440, height: 900 } },
      testIgnore: /\.mobile\.spec\.js$/,
    },
    {
      name: 'mobile',
      // Размеры, тач и user agent iPhone 13, но в Chromium: WebKit в CI не ставим.
      use: { ...devices['iPhone 13'], browserName: 'chromium', defaultBrowserType: 'chromium' },
      testIgnore: /\.desktop\.spec\.js$/,
    },
  ],
  webServer: {
    command: `npx vite preview --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: !process.env.CI,
  },
});
