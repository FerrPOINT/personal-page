import { test, expect } from '@playwright/test';

test.describe('TechStack - Секция технологий', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8888');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Дополнительное ожидание для загрузки React
    
    // Навигация к секции TechStack
    const skillsLink = page.locator('a[href="#skills"], nav a:has-text("Skills"), nav a:has-text("Навыки")').first();
    await skillsLink.click();
    await page.waitForTimeout(1000);
  });

  test('TC-008: Отображение секции TechStack с графиком', async ({ page }) => {
    // Проверка наличия секции TechStack
    const techstackSection = page.locator('section#skills').first();
    await expect(techstackSection).toBeVisible();

    // Проверка заголовка секции
    const heading = techstackSection.locator('h2, heading').first();
    await expect(heading).toContainText(/Tech Stack|Навыки/i);

    // Проверка наличия графика (Recharts компонент)
    const chart = techstackSection.locator('[role="application"]').first();
    await expect(chart).toBeVisible({ timeout: 5000 });
  });
});

