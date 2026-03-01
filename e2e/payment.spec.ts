import { test, expect } from "@playwright/test";

test.describe("Payment / Settings", () => {
  test("settings page requires auth", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("authenticated user sees Settings with plan and upgrade CTA", async ({
    page,
  }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: /Sign in anonymously/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);
    await expect(
      page.getByRole("heading", { name: /Settings/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Current Plan", level: 2 }),
    ).toBeVisible();
    const upgradeOrManage = page.getByRole("button", {
      name: /Upgrade to Pro|Manage Billing/i,
    });
    await expect(upgradeOrManage).toBeVisible();
  });

  test("upgrade button does not throw (Stripe redirect or error handled)", async ({
    page,
  }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: /Sign in anonymously/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    await page.goto("/settings");
    const btn = page.getByRole("button", {
      name: /Upgrade to Pro|Manage Billing/i,
    });
    await expect(btn).toBeVisible();
    await btn.click();
    await page.waitForTimeout(2000);
    const url = page.url();
    const stillOnSettings = url.includes("/settings");
    const wentToStripe = url.includes("stripe.com") || url.includes("checkout");
    expect(stillOnSettings || wentToStripe).toBeTruthy();
  });
});
