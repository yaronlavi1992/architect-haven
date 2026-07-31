import { expect, test } from "@playwright/test";

test("complete Emergence experiment cycle", async ({ page }) => {
  await page.goto("/auth");
  await page.getByRole("button", { name: /Sign in anonymously/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

  await page.goto("/arenas");
  await page.getByRole("button", { name: /New arena/i }).click();
  await page.getByLabel("Arena name").fill("E2E Evolution Lab");
  await page
    .getByLabel("Mission briefing")
    .fill("Verify the full deterministic agent cycle.");
  await page.getByRole("button", { name: "Enter world" }).click();
  await expect(page).toHaveURL(/\/arenas\//);
  await expect(page.getByLabel("Arena title")).toHaveValue("E2E Evolution Lab");

  await page.getByRole("button", { name: "Simulate" }).click();
  await expect(page.getByText("Run telemetry")).toBeVisible();
  await page.getByRole("button", { name: "Play simulation" }).click();
  await expect(page.getByText(/SIMULATION LIVE/)).toBeVisible();
  await page.waitForTimeout(700);
  await expect(page.getByLabel("Replay timeline")).not.toHaveValue("0");
  await page.getByRole("button", { name: "Pause simulation" }).click();

  await page.getByRole("button", { name: "Evolve × 8" }).click();
  await expect(page.getByText(/Generation 2 evolved/)).toBeVisible({
    timeout: 15000,
  });
  await page.getByRole("button", { name: "Record run" }).click();
  await expect(page.getByText(/Run recorded/)).toBeVisible();
});
