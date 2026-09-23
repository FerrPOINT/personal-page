import { test, expect } from '@playwright/test';

test.describe('Projects - Фильтрация проектов', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Дополнительное ожидание для загрузки React
    
    // Навигация к секции Projects
    const projectsLink = page.locator('a[href="#projects"], nav a:has-text("Projects"), nav a:has-text("Проекты")').first();
    await projectsLink.click();
    await page.waitForTimeout(1000);
  });

  test('TC-001: Фильтрация проектов по категории AI', async ({ page }) => {
    // Поиск кнопок фильтрации
    const allButton = page.locator('button:has-text("All"), button:has-text("Все")').first();
    const aiButton = page.locator('button:has-text("AI"), button:has-text("ИИ")').first();
    
    await expect(allButton).toBeVisible();
    await expect(aiButton).toBeVisible();

    // Клик на фильтр AI
    await aiButton.click();
    await page.waitForTimeout(500);

    await expect(page.locator('section#projects h3')).toHaveCount(5);
  });

  test('TC-001: Фильтрация проектов по категории DevOps', async ({ page }) => {
    const devopsButton = page.locator('button:has-text("DevOps"), button:has-text("DevOp")').first();
    await expect(devopsButton).toBeVisible();

    await devopsButton.click();
    await page.waitForTimeout(500);

    await expect(page.locator('section#projects h3')).toHaveCount(6);
  });

  test('TC-001: Фильтрация проектов по категории FullStack', async ({ page }) => {
    const fullstackButton = page.locator('button:has-text("FullStack")').first();
    await expect(fullstackButton).toBeVisible();

    await fullstackButton.click();
    await page.waitForTimeout(500);

    await expect(page.locator('section#projects h3')).toHaveCount(6);
  });

  test('TC-001: Возврат к фильтру All показывает все проекты', async ({ page }) => {
    const allButton = page.locator('button:has-text("All"), button:has-text("Все")').first();
    const aiButton = page.locator('button:has-text("AI"), button:has-text("ИИ")').first();

    // Сначала фильтруем по AI
    await aiButton.click();
    await page.waitForTimeout(500);

    // Затем возвращаемся к All
    await allButton.click();
    await page.waitForTimeout(500);

    // Проверка, что все проекты видны
    await expect(page.locator('section#projects h3')).toHaveCount(6);
  });
});

