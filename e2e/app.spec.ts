import { expect, test } from "@playwright/test";

test("приложение открывается и отображает стартовую страницу", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("body")).toBeVisible();
  await expect(page.locator("body")).not.toBeEmpty();
});
