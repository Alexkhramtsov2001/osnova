import { expect, test } from "@playwright/test";

test("списки выглядят единообразно и доступны с клавиатуры", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/calculator");
  const material = page.getByRole("combobox", { name: "Материал стен" });
  await material.focus();
  await page.keyboard.press("Enter");
  const list = page.getByRole("listbox");
  await expect(list).toBeVisible();
  await expect(list).toHaveCSS("background-color", "rgb(251, 250, 247)");
  await page.keyboard.press("Escape");
  await expect(list).toHaveCount(0);
  await material.click();
  await page.getByRole("option", { name: "Керамический блок" }).click();
  await expect(material).toHaveAttribute("data-value", "ceramicBlock");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
