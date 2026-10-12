import { expect, test } from "@playwright/test";

test("сводка обновляется и копируется без сообщения об отправке", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  await calculator.getByRole("button", { name: "Отдельные этапы", exact: true }).click();
  const scope = calculator.getByRole("group", { name: "Состав работ" });
  await scope.getByRole("checkbox", { name: "Кровля", exact: true }).uncheck();
  await calculator.getByRole("button", { name: "Подготовить сводку" }).click();
  const summary = calculator.getByRole("textbox", { name: "Текст сводки" });
  await expect(summary).toContainText("Формат: Отдельные этапы");
  await expect(summary).not.toContainText("Включённые этапы: Фундамент, Коробка дома, Кровля");
  await calculator.getByRole("button", { name: "Копировать текст" }).click();
  await expect(calculator.getByRole("status")).toContainText(
    "Сводка скопирована. Она никому не отправлена.",
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    await summary.inputValue(),
  );

  await calculator.getByRole("spinbutton", { name: /Площадь дома/ }).fill("118");
  await expect(summary).toContainText("Площадь: 118 м²");
  await expect(calculator.getByText("Сводка скопирована. Она никому не отправлена.")).toHaveCount(
    0,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await calculator.getByRole("spinbutton", { name: /Площадь дома/ }).fill("");
  await expect(calculator.getByRole("button", { name: "Подготовить сводку" })).toHaveCount(0);
  await expect(calculator.getByRole("alert")).toContainText("Исправьте параметры");
});
