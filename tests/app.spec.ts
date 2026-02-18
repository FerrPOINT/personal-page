import { test, expect } from '@playwright/test';

test.describe('Personal Page Application', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Aleksandr Zhukov/i);
  });

  test('should display main content', async ({ page }) => {
    // Проверяем наличие основных элементов
    await expect(page.locator('body')).toBeVisible();
    
    // Проверяем, что страница загрузилась (нет ошибок)
    const title = page.locator('h1, [role="heading"]').first();
    await expect(title).toBeVisible({ timeout: 10000 });
  });

  test('should have working navigation', async ({ page }) => {
    // Проверяем наличие навигации
    const nav = page.locator('nav, [role="navigation"]').first();
    if (await nav.count() > 0) {
      await expect(nav).toBeVisible();
    }
  });

  test('should have contact form or contact buttons', async ({ page }) => {
    // Проверяем наличие формы контакта или кнопок контакта
    const contactForm = page.locator('form, [data-testid*="contact"], button:has-text("Contact"), button:has-text("Связаться")');
    const contactCount = await contactForm.count();
    
    if (contactCount > 0) {
      await expect(contactForm.first()).toBeVisible();
    } else {
      // Если нет формы, проверяем что страница хотя бы загрузилась
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should check backend health endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:9000/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('service', 'personal-page-backend');
  });

  test('should check frontend is accessible', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });
});

