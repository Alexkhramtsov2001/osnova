import { expect, test } from "@playwright/test";

test("бургер-меню открывает разделы и закрывается после выбора", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  await page.locator("#projects").scrollIntoViewIfNeeded();
  const header = page.locator(".site-header");
  await expect
    .poll(() => header.evaluate((node) => Math.round(node.getBoundingClientRect().top)))
    .toBe(0);
  const toggle = page.getByRole("button", { name: "Открыть меню" });
  await toggle.click();
  const nav = page.getByRole("navigation", { name: "Мобильная навигация" });
  await expect(nav).toBeVisible();
  await expect(page.getByRole("button", { name: "Закрыть меню" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await nav.getByRole("link", { name: "Проекты" }).click();
  await expect(nav).toHaveCount(0);
  await expect(page).toHaveURL(/#projects$/);
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("button", { name: "Закрыть меню" }).press("Escape");
  await expect(nav).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
