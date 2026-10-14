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

test("пять спален ограничивают следующие вопросы, а возврат сбрасывает зависимые ответы", async ({
  page,
}) => {
  await page.goto("/find-home");
  await page.getByRole("radio", { name: "Постоянно, круглый год" }).check();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await page.getByRole("radio", { name: "Пять", exact: true }).check();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.getByRole("radio", { name: "Один этаж, без лестницы" })).toHaveCount(0);
  await page.getByRole("radio", { name: "Два этажа", exact: true }).check();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.getByRole("radio", { name: "Компактный дом — до 120 м²" })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Средний — от 121 до 160 м²" })).toHaveCount(0);
  await page.getByRole("radio", { name: "Просторный — больше 160 м²" }).check();
  await page.getByRole("button", { name: "Назад", exact: true }).click();
  await page.getByRole("button", { name: "Назад", exact: true }).click();
  await page.getByRole("radio", { name: "Две", exact: true }).check();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.getByRole("radio", { name: "Два этажа", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Продолжить" })).toBeDisabled();
  await page.getByRole("radio", { name: "Один этаж, без лестницы" }).check();
  await page.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.getByRole("radio", { name: "Просторный — больше 160 м²" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Продолжить" })).toBeDisabled();
});

test("если доступные варианты не подходят, результат предлагает только конфигуратор", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/find-home");
  for (const name of [
    "Постоянно, круглый год",
    "Пять",
    "Два этажа",
    "Просторный — больше 160 м²",
    "Места достаточно",
  ]) {
    await page.getByRole("radio", { name, exact: true }).check();
    await page.getByRole("button", { name: "Продолжить" }).click();
  }
  await expect(page.getByRole("radio", { name: "До 9 млн ₽" })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "До 12 млн ₽" })).toHaveCount(0);
  await page.getByRole("button", { name: "Ни один вариант не подходит" }).click();
  await expect(page.getByRole("heading", { name: "Создайте свой вариант дома" })).toBeInViewport();
  await expect(page.locator(".finder-result")).toHaveCount(0);
  await expect(page.locator(".finder-no-match").getByRole("link")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Посмотреть проект" })).toHaveCount(0);
  await page.getByRole("link", { name: "Перейти в калькулятор-конфигуратор" }).click();
  await expect(page).toHaveURL(/\/#calculator$/);
});
