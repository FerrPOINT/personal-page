import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './autotests/automated',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 60000, // Увеличенный timeout для тестов
  reporter: [
    ['html', { outputFolder: './autotests/results/reports' }],
    ['json', { outputFile: './autotests/results/reports/results.json' }],
  ],
  use: {
    baseURL: process.env.FRONTEND_URL || process.env.PROD_URL || 'http://localhost:8888',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000, // Timeout для действий
    navigationTimeout: 30000, // Timeout для навигации
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: process.env.CI ? {
    // В CI окружении предполагаем, что сервер уже запущен
    command: 'echo "Server should be running at http://localhost:8888"',
    url: 'http://localhost:8888',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  } : {
    // В локальном окружении используем существующий сервер
    command: 'echo "Using existing server at http://localhost:8888"',
    url: 'http://localhost:8888',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});

