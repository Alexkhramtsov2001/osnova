import { expect, type Page } from "@playwright/test";

export async function readDemoCode(page: Page): Promise<string> {
  const code = (await page.locator(".account-demo-mail strong").innerText()).replace(/\D/g, "");
  expect(code).toMatch(/^\d{6}$/);
  return code;
}

export async function submitDemoCode(page: Page, code: string): Promise<void> {
  await page.getByLabel("Цифра 1").fill(code);
  await page.getByRole("button", { name: "Готово" }).click();
}

export async function openDemoCabinetViaGoogle(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Войти через Google" }).click();
  await submitDemoCode(page, await readDemoCode(page));
  await expect(page.locator(".account-demo-banner")).toBeVisible();
}
