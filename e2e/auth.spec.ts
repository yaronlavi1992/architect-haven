import { test, expect } from "@playwright/test";

test.describe("Auth", () => {
  test("toggle between Sign In and Sign Up", async ({ page }) => {
    await page.goto("/auth");
    await expect(
      page.getByRole("button", { name: "Sign In", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /Don't have an account\? Sign up/i })
      .click();
    await expect(
      page.getByRole("button", { name: "Sign Up", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /Already have an account\? Sign in/i })
      .click();
    await expect(
      page.getByRole("button", { name: "Sign In", exact: true }),
    ).toBeVisible();
  });

  test("invalid credentials keep user on auth page", async ({ page }) => {
    await page.goto("/auth");
    await page
      .getByRole("textbox", { name: /Email/i })
      .fill("nonexistent@test.com");
    await page
      .getByRole("textbox", { name: /Password/i })
      .fill("wrongpassword");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page).toHaveURL(/\/auth/, { timeout: 15000 });
  });

  test("anonymous sign-in redirects to dashboard", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("button", { name: /Sign in anonymously/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(
      page.getByText(/Dashboard|Your Buildings|Architect Haven/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
