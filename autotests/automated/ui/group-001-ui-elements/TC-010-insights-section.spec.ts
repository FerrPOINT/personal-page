import { test, expect } from '@playwright/test';

test.describe('Insights - Секция статей', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8888');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Дополнительное ожидание для загрузки React
    
    // Навигация к секции Insights
    const insightsLink = page.locator('a[href="#insights"], nav a:has-text("Insights"), nav a:has-text("Статьи")').first();
    await insightsLink.click();
    await page.waitForTimeout(1000);
  });

  test('TC-010: Отображение секции Insights', async ({ page }) => {
    // Проверка наличия секции Insights
    const insightsSection = page.locator('section#insights').first();
    await expect(insightsSection).toBeVisible();

    // Проверка заголовка секции
    const heading = insightsSection.locator('h2, heading').first();
    await expect(heading).toContainText(/Insights|Статьи/i);
  });
});

