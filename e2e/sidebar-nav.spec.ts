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
      .getByRole("link", { name: /Arenas/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/arenas/);
  });

  test("Arenas link goes to /arenas", async ({ page }) => {
    await page
      .getByRole("link", { name: /Arenas/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/arenas/);
    await expect(
      page.getByRole("heading", { name: /Your arenas/i }),
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

  test("leaderboard is available to authenticated trainers", async ({
    page,
  }) => {
    await page.goto("/leaderboard");
    await expect(
      page.getByRole("heading", { name: /Hall of emergence/i }),
    ).toBeVisible();
  });
});
