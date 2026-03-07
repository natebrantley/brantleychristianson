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

  test("dashboard route redirects when unauthenticated", async ({ request }) => {
    const res = await request.get("/dashboard", { maxRedirects: 0 });
    expect([302, 307]).toContain(res.status());
    const location = res.headers()["location"] ?? "";
    expect(location).toMatch(/sign-in|dashboard/);
  });
});
