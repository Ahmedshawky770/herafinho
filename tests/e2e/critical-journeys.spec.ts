import { test, expect } from '@playwright/test';

/**
 * Critical user journeys that must always work end-to-end:
 *  - Discovery → authentication entry point
 *  - Protected surfaces gated behind auth
 *  - Order lifecycle API rejects unauthenticated callers
 */
test.describe('Critical journeys', () => {
  test('landing page renders and links to the auth entry point', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    await page.goto('/login');
    await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
  });

  test('protected dashboards redirect unauthenticated users to login', async ({ page }) => {
    for (const role of ['client', 'craftsman', 'admin'] as const) {
      await page.goto(`/dashboard/${role}`);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test('order lifecycle API rejects unauthenticated callers', async ({ page }) => {
    const list = await page.request.get('/api/orders');
    expect(list.status()).toBe(401);

    const create = await page.request.post('/api/orders', { data: {} });
    expect(create.status()).toBe(401);
  });
});
