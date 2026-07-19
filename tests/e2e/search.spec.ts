import { test, expect } from "@playwright/test";

/**
 * E2E coverage for the public discovery surface, including the text/nearby
 * search API that backs the craftsman search page. Unauthenticated users must
 * never receive craftsman data, and the public pages must render without error.
 */
test.describe("Craftsman discovery & search", () => {
  test("search API rejects unauthenticated callers", async ({ page }) => {
    const res = await page.request.get("/api/search?q=plumber");
    expect(res.status()).toBe(401);
  });

  test("search page renders and exposes the craft-type filter", async ({ page }) => {
    await page.goto("/search");
    await expect(page.getByText(/ابحث عن حرفي/)).toBeVisible();
    // The craft-type <select> should list multiple trade options.
    const options = page.locator("select option");
    await expect(options).not.toHaveCount(0);
  });

  test("craftsman profile route is reachable for a public id shape", async ({ page }) => {
    // A non-existent / malformed id should render a not-found/error state
    // rather than crashing the server.
    const res = await page.goto("/craftsmen/00000000-0000-0000-0000-000000000000");
    expect(res?.status()).toBeLessThan(500);
  });
});
