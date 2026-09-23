import { expect, test } from '@playwright/test';

test('mobile hero and contact form fit the viewport', async ({ page }) => {
  await page.route('**/api/contact', (route) => route.fulfill({
    status: 202,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: { id: 'mobile-smoke', status: 'pending' } }),
  }));
  await page.goto('/');
  await expect(page.locator('#hero')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.getByLabel(/Имя|Name/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
