import { test, expect } from '@playwright/test';

test.describe('Navbar - Навигация по секциям', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8888');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Дополнительное ожидание для загрузки React
  });

  test('TC-006: Навигация по всем секциям через Navbar', async ({ page }) => {
    // Проверка наличия Navbar
    const navbar = page.locator('nav').first();
    await expect(navbar).toBeVisible();

    // Навигация к секции Hero (About)
    const aboutLink = page.locator('a[href="#hero"], nav a:has-text("About"), nav a:has-text("О себе")').first();
    await aboutLink.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('section#hero, section:has(h1:has-text("Aleksandr")), section:has(heading:has-text("Александр"))')).toBeVisible();

    // Навигация к секции Experience
    const experienceLink = page.locator('a[href="#experience"], nav a:has-text("Experience"), nav a:has-text("Опыт")').first();
    await experienceLink.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('section#experience')).toBeVisible();

    // Навигация к секции Projects
    const projectsLink = page.locator('a[href="#projects"], nav a:has-text("Projects"), nav a:has-text("Проекты")').first();
    await projectsLink.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('section#projects')).toBeVisible();

    // Навигация к секции Skills (TechStack)
    const skillsLink = page.locator('a[href="#skills"], nav a:has-text("Skills"), nav a:has-text("Навыки")').first();
    await skillsLink.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('section#skills')).toBeVisible();

    // Навигация к секции Insights
    const insightsLink = page.locator('a[href="#insights"], nav a:has-text("Insights"), nav a:has-text("Статьи")').first();
    await insightsLink.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('section#insights')).toBeVisible();

    // Навигация к секции Contact
    const contactLink = page.locator('a[href="#contact"], nav a:has-text("Contact"), nav a:has-text("Контакты")').first();
    await contactLink.click();
    await page.waitForTimeout(1000);
    await expect(page.locator('section#contact')).toBeVisible();
  });

  test('TC-006: Клик на логотип возвращает к Hero секции', async ({ page }) => {
    // Прокрутка вниз
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Клик на логотип
    const logo = page.locator('a:has-text("ZHUKOV"), a:has-text("ЖУКОВ")').first();
    await logo.click();
    await page.waitForTimeout(1000);

    // Проверка, что мы на Hero секции
    await expect(page.locator('section#hero')).toBeVisible();
  });

  test('TC-006: Проверка плавной прокрутки при навигации', async ({ page }) => {
    const contactLink = page.locator('a[href="#contact"]').first();
    
    // Получаем начальную позицию скролла
    const initialScroll = await page.evaluate(() => window.scrollY);
    
    await contactLink.click();
    await page.waitForTimeout(1500); // Ожидание прокрутки
    
    // Проверка, что прокрутка произошла
    const finalScroll = await page.evaluate(() => window.scrollY);
    expect(finalScroll).toBeGreaterThan(initialScroll);
  });
});

