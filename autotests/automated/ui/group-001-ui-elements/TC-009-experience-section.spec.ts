import { test, expect } from '@playwright/test';

test.describe('Experience - Секция опыта работы', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8888');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Дополнительное ожидание для загрузки React
    
    // Навигация к секции Experience
    const experienceLink = page.locator('a[href="#experience"], nav a:has-text("Experience"), nav a:has-text("Опыт")').first();
    await experienceLink.click();
    await page.waitForTimeout(1000);
  });

  test('TC-009: Отображение секции Experience с timeline', async ({ page }) => {
    // Проверка наличия секции Experience
    const experienceSection = page.locator('section#experience').first();
    await expect(experienceSection).toBeVisible();

    // Проверка заголовка секции
    const heading = experienceSection.locator('h2, heading').first();
    await expect(heading).toContainText(/Experience|Опыт|Professional Journey/i);

    // Проверка наличия карточек опыта
    const experienceCards = experienceSection.locator('article, [class*="card"], [class*="experience"]');
    const cardCount = await experienceCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });
});

