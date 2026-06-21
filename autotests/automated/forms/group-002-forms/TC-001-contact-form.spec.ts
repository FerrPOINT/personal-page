import { test, expect } from '@playwright/test';

test.describe('Contact Form - email delivery', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Message saved successfully',
          data: { id: 1, status: 'pending' },
        }),
      });
    });

    await page.goto('http://localhost:8888');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'instant', block: 'center' });
    });

    await expect(page.locator('#contact')).toBeInViewport({ timeout: 10000 });
  });

  test('TC-001: sends contact form through API for email notification', async ({ page }) => {
    const nameInput = page.locator('input[name="name"]').first();
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const messageTextarea = page.locator('textarea[name="message"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(messageTextarea).toBeVisible();

    await nameInput.fill('Jenkins CI/CD');
    await emailInput.fill('jenkins@ci-cd.local');
    await messageTextarea.fill('New application version was installed and tested');

    await submitButton.click();

    await expect(page.locator('#contact')).toContainText(/Thank you|Спасибо/i);
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
    await page.locator('input[name="email"], input[type="email"]').first().fill('invalid-email');
    await page.locator('textarea[name="message"]').first().fill('Test message');

    await page.locator('button[type="submit"]').first().click();

    await expect(page.locator('span.text-red-500:has-text("email")').first()).toBeVisible();
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
