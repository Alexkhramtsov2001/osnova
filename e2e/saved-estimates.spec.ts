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
