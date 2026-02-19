import { test, expect } from '@playwright/test';

test.describe('Footer - Футер страницы', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8888');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Дополнительное ожидание для загрузки React
    
    // Прокрутка до конца страницы
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
  });

  test('TC-011: Отображение футера', async ({ page }) => {
    // Проверка наличия футера
    const footer = page.locator('footer, [role="contentinfo"]').first();
    await expect(footer).toBeVisible();

    // Проверка наличия copyright информации
    const copyright = footer.locator('text=/©|Copyright/i').first();
    await expect(copyright).toBeVisible();
  });
});

