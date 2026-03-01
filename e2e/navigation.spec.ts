import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("landing page loads and shows hero + Sign In link", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Architect Haven/);
    await expect(
      page.getByRole("link", { name: /Sign In/i }).first(),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /3D Modeling Tool/,
    );
    await expect(
      page.getByRole("link", { name: /Start Building Models For Free/i }),
    ).toBeVisible();
  });

  test("Sign In link goes to /auth", async ({ page }) => {
    await page.goto("/");
    await page
      .getByRole("link", { name: /Sign In/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/auth/);
    await expect(
      page.getByRole("heading", { name: /Welcome to Architect Haven/i }),
    ).toBeVisible();
  });

  test("unauthenticated visit to /dashboard redirects to /auth", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("unauthenticated visit to /buildings redirects to /auth", async ({
    page,
  }) => {
    await page.goto("/buildings");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("unauthenticated visit to /settings redirects to /auth", async ({
    page,
  }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/auth/);
  });

  test("unknown path redirects to /", async ({ page }) => {
    await page.goto("/unknown-page-404");
    await expect(page).toHaveURL(/\/(\?.*)?$/);
  });

  test("auth page has Sign in / Sign up and Google / Anonymous", async ({
    page,
  }) => {
    await page.goto("/auth");
    await expect(page.getByRole("textbox", { name: /Email/i })).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: /Password/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign In", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Don't have an account\? Sign up/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Sign in with Google/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Sign in anonymously/i }),
    ).toBeVisible();
  });
});
