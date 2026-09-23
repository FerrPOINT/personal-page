import { test, expect } from '@playwright/test';

test.describe('Header shell', () => {
  test('keeps the header in one row at desktop and narrow widths', async ({ page }) => {
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      const header = page.locator('header');
      await expect(header).toBeVisible();
      expect(await header.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    }
  });

  test('opens and closes the compact navigation with Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const menu = page.locator('header button[aria-controls="mobile-navigation"]');
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(page.locator('#mobile-navigation')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-navigation')).toBeHidden();
  });
});
