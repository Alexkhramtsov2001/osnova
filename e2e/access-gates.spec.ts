import { expect, test } from "@playwright/test";
import { readDemoCode, submitDemoCode } from "./demo-auth";

test("избранное просит вход и позволяет продолжить выбор после демо-кода", async ({ page }) => {
  await page.goto("/projects");
  await page.getByRole("button", { name: "Добавить в избранное: Север" }).click();
  await expect(page).toHaveURL(/\/account\?mode=register&next=/);
  await expect(page.getByRole("tab", { name: "Регистрация" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByLabel("Как к вам обращаться").fill("Анна");
  await page.getByLabel("Учебный email").fill("anna@osnova.test");
  await page.getByRole("button", { name: "Продолжить регистрацию" }).click();
  await submitDemoCode(page, await readDemoCode(page));
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.getByRole("button", { name: "Избранное (1)" })).toBeVisible();
});

test("прямая ссылка на выбранный проект требует демо-вход", async ({ page }) => {
  await page.goto("/calculator?project=02");
  await expect(page.getByRole("heading", { name: /Войдите, чтобы выбрать «Север»/ })).toBeVisible();
  await expect(page.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveCount(0);
  await page.getByRole("link", { name: "Войти в кабинет" }).click();
  await expect(page.getByRole("tab", { name: "Повторный вход" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("button", { name: "Войти через Google" }).click();
  await submitDemoCode(page, await readDemoCode(page));
  await expect(page).toHaveURL(/\/calculator\?project=02$/);
  await expect(page.getByText("На основе проекта «Север»")).toBeVisible();
});

test("после расчёта оформление требует вход и возвращает к выбранной смете", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/calculator");
  await page.getByRole("spinbutton", { name: /Площадь дома/ }).fill("145");
  await page.getByRole("link", { name: "Оплатить (демо)" }).click();
  await expect(page.getByRole("heading", { name: "Войдите, чтобы оформить выбор" })).toBeVisible();
  await expect(page.locator(".payment-checkout")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: "Зарегистрироваться" }).click();
  await page.getByRole("button", { name: "Войти через Apple" }).click();
  await submitDemoCode(page, await readDemoCode(page));
  await expect(page).toHaveURL(/\/payment#payment-checkout$/);
  await expect(page.getByRole("radio", { name: /Наличными полностью/ })).toBeVisible();
  await expect(page.locator(".payment-configuration")).toContainText("145 м²");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("выбор способа со страницы условий тоже ведёт ко входу", async ({ page }) => {
  await page.goto("/payment/methods/cash-full");
  await page.getByRole("link", { name: "Выбрать этот способ" }).click();
  await expect(page).toHaveURL(/\/account\?mode=register&next=/);
  await page.getByRole("button", { name: "Войти через Google" }).click();
  await submitDemoCode(page, await readDemoCode(page));
  await expect(page).toHaveURL(/\/payment\?method=cashFull#payment-checkout$/);
  await expect(
    page.getByRole("heading", { name: "Пока нет выбранного объёма работ" }),
  ).toBeVisible();
});
