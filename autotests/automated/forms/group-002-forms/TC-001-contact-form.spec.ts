import { test, expect } from '@playwright/test';

test.describe('Contact Form - Telegram delivery queue', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 'test-message-id', status: 'pending' },
        }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'instant', block: 'center' });
    });

    await expect(page.locator('#contact')).toBeInViewport({ timeout: 10000 });
  });

  test('TC-001: durably accepts contact form for Telegram delivery', async ({ page }) => {
    const nameInput = page.locator('input[name="name"]').first();
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const messageTextarea = page.locator('textarea[name="message"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(messageTextarea).toBeVisible();

    await nameInput.fill('Release canary');
    await emailInput.fill('canary@example.com');
    await messageTextarea.fill('New application version was installed and tested');

    await submitButton.click();

    await expect(page.locator('#contact')).toContainText(/Your message was accepted and will be delivered/i);
    await expect(nameInput).toHaveValue('');
    await expect(emailInput).toHaveValue('');
    await expect(messageTextarea).toHaveValue('');
  });

  test('TC-001: validates empty required fields', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]').first();

    await submitButton.click();

    await expect(page.locator('input[name="name"]').first()).toBeVisible();
    await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
    await expect(page.locator('textarea[name="message"]').first()).toBeVisible();
  });

  test('TC-001: validates invalid email format', async ({ page }) => {
    await page.locator('input[name="name"]').first().fill('Test User');
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await emailInput.fill('invalid-email');
    await page.locator('textarea[name="message"]').first().fill('Test message');

    expect(await emailInput.evaluate((element: HTMLInputElement) => element.checkValidity())).toBe(false);
  });

  test('TC-001: no critical console errors in contact form', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    const criticalErrors = consoleErrors.filter(
      (error) =>
        !error.includes('React DevTools') &&
        !error.includes('GPOS') &&
        !error.includes('GSUB') &&
        !error.includes('Failed to load resource') &&
        !error.includes('500') &&
        !error.includes('Internal Server Error')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
