import { expect, test } from "@playwright/test";

test("варианты оплаты доступны до расчёта, а смета появляется после него", async ({ page }) => {
  await page.goto("/payment");
  await expect(
    page.getByRole("heading", { name: "Пока нет выбранного объёма работ" }),
  ).toBeVisible();
  await expect(page.locator(".payment-method-card")).toHaveCount(4);
  await expect(page.locator(".payment-bank-list a")).toHaveCount(3);
  await expect(page.locator(".payment-totals")).toHaveCount(0);

  await page.getByRole("link", { name: "Рассчитать стоимость" }).click();
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  const type = calculator.getByRole("combobox", { name: /Тип проекта/ });
  await type.click();
  await page.getByRole("option", { name: "Индивидуальный проект" }).click();
  await calculator.getByRole("spinbutton", { name: /Площадь дома/ }).fill("150");
  await calculator.getByRole("link", { name: "Посмотреть варианты оплаты" }).click();

  await expect(page).toHaveURL(/\/payment$/);
  await expect(page.locator(".payment-configuration h3")).toHaveText("Индивидуальный проект");
  await expect(page.locator(".payment-stage-list li")).toHaveCount(8);
  await expect(page.locator(".payment-totals")).toContainText("НДС");
  await expect(page.locator(".payment-totals")).toContainText("Не выделен в демо-модели");
  await expect(page.locator(".payment-exclusion")).toContainText(
    "Проектная и рабочая документация",
  );
  await page.reload();
  await expect(page.locator(".payment-configuration h3")).toHaveText("Индивидуальный проект");

  const discount = page.locator(".payment-cost-lines > div").filter({ hasText: "Условная скидка" });
  await expect(discount).toContainText("−");
  const fullPaymentTotal = await page.locator(".payment-final strong").innerText();
  await page.getByRole("radio", { name: "Ипотека на строительство" }).check();
  await expect(discount).toContainText("Не применяется");
  await expect(page.locator(".payment-final strong")).not.toHaveText(fullPaymentTotal);
  await page.getByRole("radio", { name: "Материнский капитал" }).check();
  await expect(page.locator(".payment-method-note")).toContainText("Сумма сертификата неизвестна");
});

test("пустой выбор этапов не показывает оплату нулевого проекта", async ({ page }) => {
  await page.goto("/calculator");
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  await calculator.getByRole("button", { name: "Отдельные этапы", exact: true }).click();
  for (const checkbox of await calculator
    .getByRole("group", { name: "Состав работ" })
    .getByRole("checkbox")
    .all())
    await checkbox.uncheck();
  await page
    .getByRole("navigation", { name: "Основная навигация" })
    .getByRole("link", { name: "Оплата" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Пока нет выбранного объёма работ" }),
  ).toBeVisible();
});

test("типовой проект из каталога переносится в сводку оплаты", async ({ page }) => {
  await page.goto("/projects/02");
  await page.getByRole("link", { name: "Рассчитать этот дом" }).click();
  await page.getByRole("link", { name: "Посмотреть варианты оплаты" }).click();
  await expect(page.locator(".payment-configuration h3")).toHaveText("Север");
  await expect(page.locator(".payment-project-facts")).toContainText("Типовой проект");
  await expect(page.locator(".payment-project-facts")).toContainText("164 м²");
});
