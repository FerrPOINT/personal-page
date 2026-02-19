import { test, expect } from '@playwright/test';

test.describe('Hero - Главная секция', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8888');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Дополнительное ожидание для загрузки React
  });

  test('TC-012: Отображение Hero секции с 3D сценой', async ({ page }) => {
    // Проверка наличия Hero секции
    const heroSection = page.locator('section#hero').first();
    await expect(heroSection).toBeVisible();

    // Проверка заголовка Hero
    const heading = heroSection.locator('h1, heading').first();
    await expect(heading).toContainText(/Aleksandr|Александр/i);

    // Проверка описания
    const description = heroSection.locator('text=/Architect|Архитектор/i').first();
    await expect(description).toBeVisible();

    // Проверка наличия 3D сцены (canvas)
    const canvas = heroSection.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 }); // 3D сцена может загружаться
  });

  test('TC-012: Навигация через кнопку "View Projects"', async ({ page }) => {
    const viewProjectsButton = page.locator('a:has-text("View Projects"), a:has-text("Посмотреть проекты")').first();
    await expect(viewProjectsButton).toBeVisible();

    await viewProjectsButton.click();
    await page.waitForTimeout(1000);

    // Проверка, что прокрутилось к секции Projects
    const projectsSection = page.locator('section#projects').first();
    await expect(projectsSection).toBeVisible();
  });

  test('TC-012: Навигация через кнопку "Contact Me"', async ({ page }) => {
    const contactButton = page.locator('a:has-text("Contact Me"), a:has-text("Связаться")').first();
    await expect(contactButton).toBeVisible();

    await contactButton.click();
    await page.waitForTimeout(1000);

    // Проверка, что прокрутилось к секции Contact
    const contactSection = page.locator('section#contact').first();
    await expect(contactSection).toBeVisible();
  });
});

