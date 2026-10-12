import { expect, test } from "@playwright/test";

test("выбранные этапы управляют итогом, сохраняются при выборе дома и сбрасываются", async ({
  page,
}) => {
  await page.goto("/");
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  const total = calculator.locator(".estimate-grand-total strong");
  const fullTotal = await total.innerText();
  const foundationTotal = await calculator.locator(".estimate-stage-price").first().innerText();
  await calculator.getByRole("button", { name: "Отдельные этапы", exact: true }).click();
  const scope = calculator.getByRole("group", { name: "Состав работ" });
  for (const checkbox of (await scope.getByRole("checkbox").all()).slice(1))
    await checkbox.uncheck();
  await expect(total).toHaveText(foundationTotal);
  await expect(calculator.locator(".estimate-stage-count")).toHaveText("Включено: 1 из 8");
  await expect(calculator.getByText("Не включён", { exact: true })).toHaveCount(7);
  await calculator.getByRole("button", { name: "Комфорт", exact: true }).click();
  await expect(total).toHaveText(foundationTotal);

  await calculator.getByRole("button", { name: "Под ключ", exact: true }).click();
  await expect(calculator.locator(".estimate-stage-count")).toHaveText("Включено: 8 из 8");
  await expect(total).not.toHaveText(foundationTotal);
  await calculator.getByRole("button", { name: "Отдельные этапы", exact: true }).click();
  await expect(total).toHaveText(foundationTotal);
  await page.getByRole("link", { name: "Рассчитать стоимость проекта Север", exact: true }).click();
  await expect(scope.getByRole("checkbox", { checked: true })).toHaveCount(1);
  await expect(
    calculator.getByRole("button", { name: "Отдельные этапы", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(total).not.toHaveText(foundationTotal);

  await scope.getByRole("checkbox", { name: "Фундамент", exact: true }).uncheck();
  await expect(calculator.locator(".estimate-empty-scope")).toContainText(
    "Выберите хотя бы один этап",
  );
  await expect(calculator.locator(".estimate-total-value")).toHaveCount(0);
  await expect(total).toHaveCount(0);
  const roof = scope.getByRole("checkbox", { name: "Кровля", exact: true });
  await roof.focus();
  await page.keyboard.press("Space");
  await expect(roof).toBeChecked();
  await expect(calculator.locator(".estimate-total-value")).toBeVisible();
  await calculator.getByRole("button", { name: "Сбросить", exact: true }).click();
  await expect(total).toHaveText(fullTotal);
  await expect(calculator.getByRole("button", { name: "Под ключ", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(scope).toHaveCount(0);
});

test("выбор этапов помещается на мобильном экране", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  await calculator.getByRole("button", { name: "Отдельные этапы", exact: true }).click();
  await expect(
    calculator.getByRole("group", { name: "Состав работ" }).getByRole("checkbox"),
  ).toHaveCount(8);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = await calculator.getByRole("group", { name: "Состав работ" }).boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
});
