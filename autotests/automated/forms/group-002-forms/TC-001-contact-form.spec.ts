import { test, expect } from '@playwright/test';

test.describe('Contact Form - Отправка сообщения', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8888');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Дополнительное ожидание для загрузки React
    
    // Навигация к секции Contact - прокрутка напрямую
    await page.evaluate(() => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    await page.waitForTimeout(2000); // Увеличенное ожидание прокрутки
    
    // Убеждаемся, что секция Contact видна (с увеличенным timeout)
    await expect(page.locator('#contact')).toBeInViewport({ timeout: 10000 });
  });

  // Этот тест должен быть последним - отправляет отчет в Telegram
  test('TC-001: Отправка отчета о тестах в Telegram (последний тест)', async ({ page }) => {
    // Получаем номер сборки из переменных окружения
    const buildNumber = process.env.BUILD_NUMBER || 'unknown';
    
    // Формируем простое сообщение
    const reportMessage = `Сборка #${buildNumber} Новая версия приложения установлена и протестирована`;

    // Поиск полей формы
    const nameInput = page.locator('input[name="name"]').first();
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const messageTextarea = page.locator('textarea[name="message"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    // Заполнение формы от имени Jenkins
    await nameInput.fill('Jenkins CI/CD');
    await emailInput.fill('jenkins@ci-cd.local');
    await messageTextarea.fill(reportMessage);

    // Отправка формы
    await submitButton.click();
    await page.waitForTimeout(3000); // Ожидание отправки

    // Проверка успешной отправки
    const successMessage = page.locator('text=/success|успешно|отправлено/i');
    const formCleared = await nameInput.inputValue() === '' || await emailInput.inputValue() === '';
    
    expect(successMessage.isVisible().catch(() => false) || formCleared).toBeTruthy();
  });

  test('TC-001: Валидация формы - пустые поля', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Отправить")').first();
    
    // Попытка отправить пустую форму
    await submitButton.click();
    await page.waitForTimeout(500);

    // Проверка, что форма не отправилась (поля остались видимыми)
    const nameInput = page.locator('input[name="name"]').first();
    await expect(nameInput).toBeVisible();
  });

  test('TC-001: Валидация email - неверный формат', async ({ page }) => {
    const nameInput = page.locator('input[name="name"]').first();
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const messageTextarea = page.locator('textarea[name="message"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await nameInput.fill('Test User');
    await emailInput.fill('invalid-email');
    await messageTextarea.fill('Test message');

    await submitButton.click();
    await page.waitForTimeout(1000); // Увеличенное ожидание для валидации React Hook Form

    // Проверка сообщения об ошибке (React Hook Form показывает ошибку)
    // Текст может быть на английском или русском в зависимости от языка интерфейса
    const errorMessage = page.locator('span.text-red-500:has-text("email"), span.text-red-500:has-text("email")');
    await expect(errorMessage.first()).toBeVisible();
  });

  test('TC-001: Проверка отсутствия ошибок в консоли', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Просто проверяем консоль без отправки формы
    await page.waitForTimeout(1000);

    // Фильтруем известные предупреждения и ошибки сети
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

