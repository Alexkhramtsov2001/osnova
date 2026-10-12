import { expect, test } from "@playwright/test";

test("числа приводятся к границам после ввода, а комнаты согласуются с площадью", async ({
  page,
}) => {
  await page.goto("/");
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  const area = calculator.getByRole("spinbutton", { name: /Площадь дома/ });
  await area.fill("29");
  await expect(calculator.getByRole("alert")).toBeVisible();
  await area.blur();
  await expect(area).toHaveValue("30");
  await expect(calculator.getByRole("combobox", { name: /Спальни/ })).toHaveAttribute(
    "data-value",
    "1",
  );
  await expect(calculator.getByRole("combobox", { name: /Санузлы/ })).toHaveAttribute(
    "data-value",
    "1",
  );
  await expect(calculator.locator(".estimate-total-value")).toBeVisible();

  await area.fill("1001");
  await area.blur();
  await expect(area).toHaveValue("1000");
  await expect(calculator.getByRole("spinbutton", { name: /Периметр/ })).toHaveValue("126");
  await expect(calculator.locator(".estimate-total-value")).toBeVisible();

  await area.fill("30");
  await area.blur();
  await calculator.getByRole("button", { name: "2 этажа", exact: true }).click();
  await expect(area).toHaveValue("60");

  const height = calculator.getByRole("spinbutton", { name: /Высота стен/ });
  await height.fill("2.3");
  await height.blur();
  await expect(height).toHaveValue("2.4");
});
