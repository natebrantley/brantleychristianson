import { test, expect } from "@playwright/test";

test.describe("Smoke", () => {
  test("homepage returns 200", async ({ request }) => {
    const res = await request.get("/");
    expect(res.status()).toBe(200);
  });

  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Pacific Northwest|Real Estate|brantley/i);
  });

  test("homepage has main content", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10_000 });
  });
});
