import { defineConfig, devices } from '@playwright/test';

const useSystemChrome = process.env.PLAYWRIGHT_USE_SYSTEM_CHROME !== '0';

export default defineConfig({
  testDir: 'tests/browser',
  timeout: 30_000,
  expect: {
    timeout: 8_000
  },
  retries: process.env.CI ? 1 : 0,
  outputDir: '.test-results/playwright',
  reporter: [
    ['list'],
    ['html', { outputFolder: '.test-results/playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:4322',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'pnpm exec astro preview --host 127.0.0.1 --port 4322',
    url: 'http://127.0.0.1:4322',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        channel: useSystemChrome ? 'chrome' : undefined
      }
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        channel: useSystemChrome ? 'chrome' : undefined
      }
    }
  ]
});
