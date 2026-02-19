import { test, expect } from '@playwright/test';

test.describe('Projects - Модальное окно с деталями проекта', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8888');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Дополнительное ожидание для загрузки React
    
    // Навигация к секции Projects
    const projectsLink = page.locator('a[href="#projects"], nav a:has-text("Projects"), nav a:has-text("Проекты")').first();
    await projectsLink.click();
    await page.waitForTimeout(1000);
  });

  test('TC-002: Открытие модального окна при клике на кнопку "View Detailed Case Study"', async ({ page }) => {
    // Поиск кнопки "Подробнее о проекте"
    const viewButton = page.locator('button:has-text("View Detailed Case Study"), button:has-text("Подробнее о проекте")').first();
    await expect(viewButton).toBeVisible();

    // Клик на кнопку
    await viewButton.click();
    await page.waitForTimeout(1000);

    // Проверка, что модальное окно открылось
    const modal = page.locator('[role="dialog"], .modal, [class*="z-[100]"], [class*="fixed"][class*="inset-0"]').first();
    await expect(modal).toBeVisible();

    // Проверка содержимого модального окна
    const modalHeading = modal.locator('h2, h3, heading').first();
    await expect(modalHeading).toBeVisible();
  });

  test('TC-002: Закрытие модального окна через кнопку закрытия', async ({ page }) => {
    // Открытие модального окна
    const viewButton = page.locator('button:has-text("View Detailed Case Study"), button:has-text("Подробнее о проекте")').first();
    await viewButton.click();
    await page.waitForTimeout(1000);

    const modal = page.locator('[role="dialog"], .modal').first();
    await expect(modal).toBeVisible();

    // Поиск кнопки закрытия
    const closeButton = modal.locator('button:has-text("Close"), button[aria-label*="close"], button:has([aria-label*="close"])').first();
    
    // Если кнопка Close не найдена, пробуем Escape
    if (await closeButton.count() === 0) {
      await page.keyboard.press('Escape');
    } else {
      await closeButton.click();
    }
    
    await page.waitForTimeout(500);

    // Проверка, что модальное окно закрылось
    await expect(modal).not.toBeVisible();
  });

  test('TC-002: Закрытие модального окна через клавишу Escape', async ({ page }) => {
    // Открытие модального окна
    const viewButton = page.locator('button:has-text("View Detailed Case Study"), button:has-text("Подробнее о проекте")').first();
    await viewButton.click();
    await page.waitForTimeout(1000);

    const modal = page.locator('[role="dialog"], .modal').first();
    await expect(modal).toBeVisible();

    // Закрытие через Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // Проверка, что модальное окно закрылось
    await expect(modal).not.toBeVisible();
  });
});

