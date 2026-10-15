import { expect, test } from "@playwright/test";

test("выбор дома переносит параметры, сохраняет комплектацию и поддерживает сброс", async ({
  page,
}) => {
  await page.goto("/calculator");
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  const area = calculator.getByRole("spinbutton", { name: /Площадь дома/ });
  const walls = calculator.getByRole("combobox", { name: /Материал стен/ });
  await walls.click();
  await page.getByRole("option", { name: "Керамический блок" }).click();
  await calculator.getByRole("button", { name: "Комфорт", exact: true }).click();
  const estimateBefore = await calculator.locator(".estimate-total-value").innerText();

  await page
    .getByRole("navigation", { name: "Основная навигация" })
    .getByRole("link", { name: "Проекты", exact: true })
    .click();
  await page.getByRole("link", { name: "Рассчитать стоимость проекта Север", exact: true }).click();
  await expect(area).toHaveValue("164");
  await expect(calculator.locator(".estimate-total-value")).not.toHaveText(estimateBefore);
  await expect(calculator.getByRole("button", { name: "2 этажа", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(calculator.getByRole("combobox", { name: /Спальни/ })).toHaveAttribute(
    "data-value",
    "4",
  );
  await expect(calculator.getByRole("spinbutton", { name: /Периметр/ })).toHaveValue("37");
  await expect(walls).toHaveAttribute("data-value", "ceramicBlock");
  await expect(calculator.getByRole("button", { name: "Комфорт", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(calculator.getByRole("status")).toContainText("На основе проекта «Север»");
  await expect(page.locator("#calculator")).toBeVisible();

  await area.fill("130");
  await page
    .getByRole("navigation", { name: "Основная навигация" })
    .getByRole("link", { name: "Проекты", exact: true })
    .click();
  await page
    .getByRole("link", { name: "Рассчитать стоимость проекта Скандинавия", exact: true })
    .click();
  await expect(area).toHaveValue("118");
  await expect(calculator.getByRole("button", { name: "1 этаж", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(calculator.getByRole("combobox", { name: /Спальни/ })).toHaveAttribute(
    "data-value",
    "3",
  );
  await expect(calculator.getByRole("spinbutton", { name: /Периметр/ })).toHaveValue("44");
  await expect(walls).toHaveAttribute("data-value", "ceramicBlock");
  await calculator.getByRole("button", { name: "Сбросить", exact: true }).click();
  await expect(area).toHaveValue("120");
  await expect(walls).toHaveAttribute("data-value", "aeratedConcrete");
  await expect(calculator.getByRole("button", { name: "Стандарт", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(calculator.getByRole("status")).toHaveCount(0);
});
