import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("детализация закрыта по умолчанию, а PDF скачивается с текущим расчётом", async ({ page }) => {
  await page.goto("/?project=02#calculator");
  const details = page.locator(".estimate-breakdown");
  await expect(details).not.toHaveAttribute("open");
  await details.locator("summary").click();
  await expect(page.locator(".estimate-stage-toggle").first()).toBeVisible();
  await details.locator("summary").click();
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Скачать расчёт в PDF" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("osnova-house-estimate.pdf");
  const data = await readFile((await download.path())!);
  expect(data.subarray(0, 5).toString()).toBe("%PDF-");
  expect(data.length).toBeGreaterThan(10000);
});

test("ошибка загрузки шрифта позволяет повторить скачивание", async ({ page }) => {
  await page.goto("/#calculator");
  await page.route("**/fonts/NotoSans-Regular.ttf", (route) => route.abort());
  await page.getByRole("button", { name: "Скачать расчёт в PDF" }).click();
  await expect(page.getByRole("alert")).toContainText("Не удалось подготовить PDF");
  await page.unroute("**/fonts/NotoSans-Regular.ttf");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Скачать расчёт в PDF" }).click();
  expect((await downloadEvent).suggestedFilename()).toBe("osnova-house-estimate.pdf");
});
