import { test, expect } from '@playwright/test';

test.describe('LanguageSwitcher - Переключение языка', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8888');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Дополнительное ожидание для загрузки React
  });

  test('TC-005: Переключение языка с EN на RU и обратно', async ({ page }) => {
    // Проверка начального состояния (EN)
    await expect(page.locator('nav')).toContainText(/A\. ZHUKOV|ZHUKOVARCHITECT/i);
    await expect(page.locator('h1, heading')).toContainText(/Aleksandr|Александр/i);
    
    // Поиск кнопки переключения языка (используем aria-label из компонента)
    const languageButton = page.locator('button[aria-label*="Switch"], button[aria-label*="Переключить"], button:has-text("EN"), button:has-text("RU")').first();
    await expect(languageButton).toBeVisible();
    
    // Клик на кнопку переключения языка
    await languageButton.click();
    await page.waitForTimeout(500); // Ожидание переключения
    
    // Проверка перевода на русский
    await expect(page.locator('nav')).toContainText(/А\. ЖУКОВ|ЖУКОВАРХИТЕКТОР/i);
    await expect(page.locator('h1, heading')).toContainText('Александр Жуков');
    // Проверяем наличие переведенных элементов (не обязательно все сразу)
    const hasRussianContent = await page.locator('text=/Посмотреть проекты|Связаться|О себе|Опыт|Проекты/i').count() > 0;
    expect(hasRussianContent).toBeTruthy();
    
    // Повторный клик для возврата на английский
    await languageButton.click();
    await page.waitForTimeout(500);
    
    // Проверка возврата на английский
    await expect(page.locator('nav')).toContainText(/A\. ZHUKOV|ZHUKOVARCHITECT/i);
    await expect(page.locator('h1, heading')).toContainText('Aleksandr Zhukov');
  });

  test('TC-005: Проверка отсутствия ошибок в консоли при переключении языка', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    const languageButton = page.locator('button[aria-label*="Switch"], button[aria-label*="Переключить"], button:has-text("EN"), button:has-text("RU")').first();
    await languageButton.click();
    await page.waitForTimeout(500);
    
    await languageButton.click();
    await page.waitForTimeout(500);

    // Фильтруем известные предупреждения (React DevTools, шрифты)
    const criticalErrors = consoleErrors.filter(
      (error) => !error.includes('React DevTools') && !error.includes('GPOS') && !error.includes('GSUB')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });
});

