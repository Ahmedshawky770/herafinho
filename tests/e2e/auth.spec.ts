import { test, expect } from '@playwright/test';

test.describe('Authentication gate', () => {
  test('redirects unauthenticated users from dashboard to login', async ({ page }) => {
    await page.goto('/dashboard/client');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/dashboard/admin');
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/dashboard/craftsman');
    await expect(page).toHaveURL(/\/login/);
  });

  test('renders the Google sign-in button on the login page', async ({ page }) => {
    await page.goto('/login');
    const googleButton = page.getByRole('button', { name: /google/i });
    await expect(googleButton).toBeVisible();
  });

  test('unauthorized role access is rejected', async ({ page }) => {
    await page.goto('/unauthorized');
    await expect(page.getByText(/unauthorized/i)).toBeVisible();
  });
});
