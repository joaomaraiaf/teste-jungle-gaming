import { defineConfig, devices } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT ?? '3102';
export default defineConfig({
  testDir: './tests',
  testMatch: /.*\.visual\.ts/,
  fullyParallel: true,
  reporter: [['html', { outputFolder: 'playwright-visual-report' }]],
  snapshotPathTemplate: '{testDir}/visual-baselines/{projectName}/{arg}{ext}',
  expect: { toHaveScreenshot: { animations: 'disabled', maxDiffPixelRatio: 0.001 } },
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    ...devices['Desktop Chrome'],
    locale: 'pt-BR',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  projects: [390, 768, 1440].map((width) => ({
    name: `chromium-${width}`,
    use: { viewport: { width, height: 900 } },
  })),
  webServer: {
    command: `pnpm build:mock && pnpm preview:mock --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: process.env.PLAYWRIGHT_REUSE_SERVER === 'true',
    timeout: 120000,
  },
});
