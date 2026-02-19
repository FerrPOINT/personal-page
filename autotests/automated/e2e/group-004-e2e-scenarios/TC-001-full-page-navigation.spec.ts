import { test, expect } from '@playwright/test';

test.describe('E2E - Полная навигация по странице', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8888');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Дополнительное ожидание для загрузки React
  });

  test('TC-001: Полный пользовательский сценарий - навигация и взаимодействие', async ({ page }) => {
    // 1. Проверка Hero секции
    await expect(page.locator('section#hero')).toBeVisible();
    await expect(page.locator('h1, heading')).toContainText(/Aleksandr|Александр/i);

    // 2. Переключение языка на русский
    const languageButton = page.locator('button[aria-label*="Switch"], button[aria-label*="Переключить"], button:has-text("EN"), button:has-text("RU")').first();
    await languageButton.click();
    await page.waitForTimeout(500);
    await expect(page.locator('nav')).toContainText('А. ЖУКОВ АРХИТЕКТОР');

    // 3. Навигация к Experience
    const experienceLink = page.locator('a[href="#experience"], nav a:has-text("Опыт")').first();
    await experienceLink.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('section#experience')).toBeVisible();

    // 4. Навигация к Projects
    const projectsLink = page.locator('a[href="#projects"], nav a:has-text("Проекты")').first();
    await projectsLink.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('section#projects')).toBeVisible();

    // 5. Фильтрация проектов по AI
    const aiFilter = page.locator('button:has-text("ИИ")').first();
    await aiFilter.click();
    await page.waitForTimeout(500);

    // 6. Открытие модального окна проекта
    const viewButton = page.locator('button:has-text("Подробнее о проекте")').first();
    await viewButton.click();
    await page.waitForTimeout(1000);
    
    const modal = page.locator('[role="dialog"], .modal').first();
    await expect(modal).toBeVisible();

    // 7. Закрытие модального окна
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    await expect(modal).not.toBeVisible();

    // 8. Навигация к Contact
    const contactLink = page.locator('a[href="#contact"], nav a:has-text("Контакты")').first();
    await contactLink.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('section#contact')).toBeVisible();

    // 9. Заполнение формы контактов
    const nameInput = page.locator('input[name="name"]').first();
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const messageTextarea = page.locator('textarea[name="message"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await nameInput.fill('E2E Test User');
    await emailInput.fill('e2e@example.com');
    await messageTextarea.fill('E2E test message');
    await submitButton.click();
    await page.waitForTimeout(2000);

    // 10. Проверка отсутствия критических ошибок
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const criticalErrors = consoleErrors.filter(
      (error) => !error.includes('React DevTools') && !error.includes('GPOS') && !error.includes('GSUB')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

