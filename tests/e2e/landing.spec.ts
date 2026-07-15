import { test, expect } from '@playwright/test';

test.describe('Landing & discovery', () => {
  test('renders the public landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('exposes a link to start as a craftsman or client', async ({ page }) => {
    await page.goto('/login');
    // The login surface should present an OAuth entry point.
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });
});
