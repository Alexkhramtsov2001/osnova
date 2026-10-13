import { expect, test } from "@playwright/test";

test("подбор открывается в новой вкладке, сохраняет ответы при возврате и ведёт к конфигуратору", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const newTab = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Подобрать свой дом" }).click();
  const quiz = await newTab;
  await expect(quiz).toHaveURL(/\/find-home$/);
  await expect(quiz.getByRole("button", { name: "Продолжить" })).toBeDisabled();
  await quiz.getByRole("radio", { name: "Постоянно, круглый год" }).check();
  await quiz.getByRole("button", { name: "Продолжить" }).click();
  await quiz.getByRole("button", { name: "Назад", exact: true }).click();
  await expect(quiz.getByRole("radio", { name: "Постоянно, круглый год" })).toBeChecked();
  await quiz.getByRole("button", { name: "Продолжить" }).click();
  for (const name of [
    "Две",
    "Один этаж, без лестницы",
    "Компактный дом — до 120 м²",
    "Важно небольшое пятно застройки",
    "До 9 млн ₽",
  ]) {
    await quiz.getByRole("radio", { name, exact: true }).check();
    await quiz.getByRole("button", { name: "Продолжить" }).click();
  }
  await quiz.getByRole("radio", { name: "Умеренная стоимость и компактность" }).check();
  await quiz.getByRole("button", { name: "Показать мой дом" }).click();
  await expect(quiz.getByRole("heading", { name: "Компакт", exact: true })).toBeVisible();
  await expect(
    quiz.getByRole("heading", { name: "Дом, с которого стоит начать" }),
  ).toBeInViewport();
  expect(await quiz.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await quiz.getByRole("link", { name: "Настроить дом в конфигураторе" }).click();
  await expect(quiz).toHaveURL(/\?project=04#calculator$/);
  await expect(quiz.getByText("На основе проекта «Компакт»")).toBeVisible();
  await expect(page).not.toHaveURL(/find-home/);
});
