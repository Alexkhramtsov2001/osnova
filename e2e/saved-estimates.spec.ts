import { expect, test } from "@playwright/test";

test("сводка расчёта сохраняется между посещениями и удаляется пользователем", async ({ page }) => {
  await page.goto("/?project=02#calculator");
  const saved = page.getByRole("region", { name: "Сохранённые расчёты" });
  await expect(saved).toContainText("Пока ничего не сохранено");

  await page.getByRole("button", { name: "Сохранить расчёт" }).click();
  await expect(saved).toContainText("«Север»");
  await expect(saved).toContainText("1 из 8");
  await saved.getByText("Посмотреть сохранённую сводку").click();
  const summary = await saved.getByRole("textbox", { name: "Сводка расчёта «Север»" }).inputValue();
  expect(summary).toContain("164 м²");

  await page.reload();
  await expect(saved).toContainText("«Север»");
  await saved.getByText("Посмотреть сохранённую сводку").click();
  await expect(saved.getByRole("textbox", { name: "Сводка расчёта «Север»" })).toHaveValue(summary);

  await saved.getByRole("button", { name: "Удалить сохранённый расчёт «Север»" }).click();
  await expect(saved).toContainText("Пока ничего не сохранено");
  await page.reload();
  await expect(saved).toContainText("Пока ничего не сохранено");
});

test("сохранённые параметры и этапы можно загрузить для нового расчёта", async ({ page }) => {
  await page.goto("/?project=02#calculator");
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  const saved = page.getByRole("region", { name: "Сохранённые расчёты" });
  const walls = calculator.getByRole("combobox", { name: /Материал стен/ });
  await walls.click();
  await page.getByRole("option", { name: "Керамический блок" }).click();
  await calculator.getByRole("button", { name: "Отдельные этапы", exact: true }).click();
  const scope = calculator.getByRole("group", { name: "Состав работ" });
  for (const checkbox of (await scope.getByRole("checkbox").all()).slice(1))
    await checkbox.uncheck();
  await calculator.getByRole("button", { name: "Сохранить расчёт" }).click();
  await saved.getByText("Посмотреть сохранённую сводку").click();
  const savedSummary = await saved
    .getByRole("textbox", { name: "Сводка расчёта «Север»" })
    .inputValue();

  await page.reload();
  await calculator.getByRole("button", { name: "Сбросить", exact: true }).click();
  await saved.getByRole("button", { name: "Загрузить параметры расчёта «Север»" }).click();
  await expect(calculator.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("164");
  await expect(walls).toHaveAttribute("data-value", "ceramicBlock");
  await expect(
    calculator.getByRole("button", { name: "Отдельные этапы", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(scope.getByRole("checkbox", { checked: true })).toHaveCount(1);
  await expect(calculator.locator(".estimate-project-note")).toContainText(
    "На основе проекта «Север»",
  );
  await expect(saved).toContainText("Параметры восстановлены");
  await saved.getByText("Посмотреть сохранённую сводку").click();
  await expect(saved.getByRole("textbox", { name: "Сводка расчёта «Север»" })).toHaveValue(
    savedSummary,
  );
});
