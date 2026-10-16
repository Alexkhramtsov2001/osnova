import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("калькулятор передаёт смету в оформление, а полная демо-оплата выдаёт PDF", async ({
  page,
}) => {
  await page.goto("/payment");
  await expect(
    page.getByRole("heading", { name: "Пока нет выбранного объёма работ" }),
  ).toBeVisible();
  await expect(page.locator(".payment-method-card")).toHaveCount(4);
  await expect(page.locator(".payment-bank-list a")).toHaveCount(3);
  await expect(page.locator(".payment-checkout")).toHaveCount(0);

  await page.getByRole("link", { name: "Рассчитать стоимость" }).click();
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  await calculator.getByRole("combobox", { name: /Тип проекта/ }).click();
  await page.getByRole("option", { name: "Индивидуальный проект" }).click();
  await calculator.getByRole("spinbutton", { name: /Площадь дома/ }).fill("150");
  await calculator.getByRole("link", { name: "Оплатить (демо)" }).click();

  await expect(page).toHaveURL(/\/payment#payment-checkout$/);
  await expect(page.locator(".payment-configuration h3")).toHaveText("Индивидуальный проект");
  await expect(page.locator(".payment-stage-list li")).toHaveCount(8);
  await expect(page.locator(".payment-totals")).toContainText("Не выделен в демо-модели");
  await page.reload();
  await expect(page.locator(".payment-configuration h3")).toHaveText("Индивидуальный проект");

  const confirmButton = page.getByRole("button", { name: "Завершить демо и скачать PDF" });
  await expect(confirmButton).toBeDisabled();
  await page.getByRole("radio", { name: /Наличными полностью/ }).check();
  await expect(page.locator(".payment-cost-lines")).toContainText("−");
  await expect(confirmButton).toBeDisabled();
  await page.getByLabel("Удобный демо-офис").selectOption("Екатеринбург");
  await page.getByRole("checkbox", { name: /Понимаю, что это демонстрация/ }).check();
  const downloadPromise = page.waitForEvent("download");
  await confirmButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^osnova-payment-OSNOVA-DEMO-.*\.pdf$/);
  const path = await download.path();
  expect(path).toBeTruthy();
  expect((await readFile(path!)).subarray(0, 5).toString()).toBe("%PDF-");
  await expect(page.getByText("Спасибо за выбор ОСНОВЫ!")).toBeVisible();
  await expect(page.locator(".payment-success")).toContainText("Деньги не списаны");
});

test("поэтапная оплата показывает график, а банк не требует выбора офиса", async ({ page }) => {
  await page.goto("/calculator");
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  await calculator.getByRole("button", { name: "Отдельные этапы", exact: true }).click();
  const stageChoices = calculator
    .getByRole("group", { name: "Состав работ" })
    .getByRole("checkbox");
  for (const checkbox of await stageChoices.all()) await checkbox.uncheck();
  await stageChoices.nth(0).check();
  await stageChoices.nth(2).check();
  await calculator.getByRole("link", { name: "Оплатить (демо)" }).click();

  await page.getByRole("radio", { name: /Наличными по этапам/ }).check();
  await expect(page.locator(".payment-stage-schedule li")).toHaveCount(2);
  await expect(page.locator(".payment-cost-lines")).toContainText("Не применяется");
  await expect(page.getByRole("button", { name: "Завершить демо и скачать PDF" })).toBeDisabled();
  await page.getByLabel("Удобный демо-офис").selectOption("Москва и МО");
  await page.getByRole("checkbox", { name: /Понимаю, что это демонстрация/ }).check();
  await expect(page.getByRole("button", { name: "Завершить демо и скачать PDF" })).toBeEnabled();

  await page.getByRole("radio", { name: /Кредит/ }).check();
  await expect(page.getByLabel("Удобный демо-офис")).toHaveCount(0);
  await expect(page.locator(".payment-external-banks a")).toHaveCount(1);
  await page.getByRole("checkbox", { name: /Понимаю, что это демонстрация/ }).check();
  await expect(page.getByRole("button", { name: "Завершить демо и скачать PDF" })).toBeEnabled();

  await page.getByRole("radio", { name: /Ипотека/ }).check();
  await expect(page.locator(".payment-external-banks a")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Завершить демо и скачать PDF" })).toBeDisabled();
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
  await expect(page.locator(".payment-checkout")).toHaveCount(0);
});

test("типовой проект из каталога переносится в оформление оплаты", async ({ page }) => {
  await page.goto("/projects/02");
  await page.getByRole("link", { name: "Рассчитать этот дом" }).click();
  await page.getByRole("link", { name: "Оплатить (демо)" }).click();
  await expect(page.locator(".payment-configuration h3")).toHaveText("Север");
  await expect(page.locator(".payment-project-facts")).toContainText("Типовой проект");
  await expect(page.locator(".payment-project-facts")).toContainText("164 м²");
});

test("демо-оформление умещается на экране телефона 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/calculator");
  await page.getByRole("link", { name: "Оплатить (демо)" }).click();
  await page.getByRole("radio", { name: /Наличными по этапам/ }).check();
  await page.getByLabel("Удобный демо-офис").selectOption("Екатеринбург");
  await expect(page.locator(".payment-confirm-panel")).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});
