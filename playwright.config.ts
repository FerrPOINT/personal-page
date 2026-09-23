import { defineConfig, devices } from '@playwright/test';

const desktopProject = (name: string, device: (typeof devices)[keyof typeof devices]) => ({
  name,
  testIgnore: '**/mobile/**',
  use: { ...device },
});

export default defineConfig({
  testDir: './autotests/automated',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60_000,
  reporter: process.env.CI ? [['list']] : [
    ['html', { outputFolder: './autotests/results/reports' }],
    ['json', { outputFile: './autotests/results/reports/results.json' }],
  ],
  use: {
    baseURL: process.env.FRONTEND_URL || process.env.PROD_URL || 'http://127.0.0.1:8888',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    desktopProject('chromium', devices['Desktop Chrome']),
    desktopProject('firefox', devices['Desktop Firefox']),
    desktopProject('webkit', devices['Desktop Safari']),
    {
      name: 'mobile-chromium',
      testMatch: '**/mobile/**/*.spec.ts',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: 'npm --prefix frontend run dev -- --host 127.0.0.1 --port 8888',
    url: 'http://127.0.0.1:8888',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
