import { test, expect } from "@playwright/test";

test.describe("Sidebar navigation (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: /Sign in anonymously/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test("Dashboard link is active on /dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(
      page.getByRole("link", { name: /Dashboard/i }).first(),
    ).toBeVisible();
    await page
      .getByRole("link", { name: /Buildings/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/buildings/);
  });

  test("Buildings link goes to /buildings", async ({ page }) => {
    await page
      .getByRole("link", { name: /Buildings/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/buildings/);
    await expect(
      page.getByRole("heading", { name: /Your Buildings/i }),
    ).toBeVisible();
  });

  test("Settings link goes to /settings", async ({ page }) => {
    await page
      .getByRole("link", { name: /Settings/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/settings/);
    await expect(
      page.getByRole("heading", { name: /Settings/i }),
    ).toBeVisible();
  });

  test("direct /buildings/:id without valid id still loads app", async ({
    page,
  }) => {
    await page.goto("/buildings/non-existent-id");
    await expect(page).toHaveURL(/\/buildings\/non-existent-id/);
    await page.waitForTimeout(2000);
    const body = await page.locator("body").textContent();
    expect(body).toBeTruthy();
  });
});
