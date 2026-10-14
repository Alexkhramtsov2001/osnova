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
  const perimeter = calculator.getByRole("spinbutton", { name: /Периметр/ });
  await expect(perimeter).toHaveValue("127");
  await expect(perimeter).toHaveAttribute("max", "159");
  await perimeter.fill("200");
  await perimeter.blur();
  await expect(perimeter).toHaveValue("159");
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

test("пересчитывает стоимость сразу после ввода площади и нормализует комнаты большого дома", async ({
  page,
}) => {
  await page.goto("/#calculator");
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  const area = calculator.getByRole("spinbutton", { name: /Площадь дома/ });
  await area.fill("500");
  await expect(area).toHaveValue("500");
  await expect(calculator.locator(".estimate-total-value")).toBeVisible();
  await expect(area).not.toHaveAttribute("aria-invalid", "true");

  await area.fill("1000");
  await expect(calculator.getByRole("combobox", { name: "Спальни" })).toHaveValue("6");
  await expect(calculator.getByRole("combobox", { name: "Санузлы" })).toHaveValue("4");
  await expect(calculator.locator(".estimate-total-value")).toBeVisible();
});
