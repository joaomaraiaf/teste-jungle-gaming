import { defineConfig, devices } from '@playwright/test';
const baseURL = process.env.PUBLIC_BASE_URL;
if (!baseURL || !/^https?:\/\//.test(baseURL))
  throw new Error('Informe PUBLIC_BASE_URL com a URL real da publicação.');
export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.public\.ts/,
  reporter: [['html', { outputFolder: 'playwright-public-report' }]],
  use: { baseURL, trace: 'retain-on-failure' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
