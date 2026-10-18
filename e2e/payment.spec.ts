import { readFile } from "node:fs/promises";
import { expect, test } from "./authenticated-test";

async function chooseDemoAppointment(page: import("@playwright/test").Page, city: string) {
  await page.getByRole("combobox", { name: "Удобный демо-офис" }).click();
  await page.getByRole("option", { name: new RegExp(city) }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  const date = page.locator("#payment-appointment-date");
  await expect(date).toBeVisible();
  const firstAvailableDate = await date.getAttribute("min");
  expect(firstAvailableDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await date.fill(firstAvailableDate!);
  await page.locator(".payment-time-slots label").filter({ hasText: "10:00" }).click();
}

test("каждый способ оплаты открывает подробности в текущей вкладке", async ({ page }) => {
  await page.goto("/payment");
  for (const [slug, title] of [
    ["cash-full", "Наличными полностью"],
    ["cash-stages", "Наличными по этапам"],
    ["credit", "Кредит на строительство"],
    ["mortgage", "Ипотека на строительство"],
  ]) {
    if (
      !(await page
        .locator(".payment-reference")
        .evaluate((node) => (node as HTMLDetailsElement).open))
    )
      await page.locator(".payment-reference > summary").click();
    await page.locator(`.payment-method-card[href$="/${slug}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/payment/methods/${slug}$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.locator(".payment-guide-summary > div")).toHaveCount(3);
    await expect(page.locator(".payment-guide-steps li")).toHaveCount(4);
    await expect(page.locator(".payment-guide-documents li")).not.toHaveCount(0);
    await page.getByRole("link", { name: "Все способы оплаты" }).click();
  }
  await expect(page.locator(".payment-bank-list img")).toHaveCount(3);
});

test("подробности способов доступны по прямой ссылке на телефоне", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  for (const slug of ["cash-full", "cash-stages", "credit", "mortgage"]) {
    await page.goto(`/payment/methods/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{30}/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});

test("выбор подробного сценария сохраняется при возвращении к расчёту", async ({ page }) => {
  await page.goto("/calculator");
  await page.getByRole("link", { name: "Оплатить (демо)" }).click();
  if (
    !(await page
      .locator(".payment-reference")
      .evaluate((node) => (node as HTMLDetailsElement).open))
  )
    await page.locator(".payment-reference > summary").click();
  await page.locator('.payment-method-card[href$="/cash-full"]').click();
  await page.getByRole("link", { name: "Выбрать этот способ" }).click();
  await expect(page).toHaveURL(/\/payment\?method=cashFull#payment-checkout$/);
  await expect(page.getByRole("radio", { name: /Наличными полностью/ })).toBeChecked();
  await expect(page.locator(".payment-cost-lines")).toContainText("−");
});

test("выбранный до расчёта способ сохраняется после калькулятора в этой вкладке", async ({
  page,
}) => {
  await page.goto("/payment/methods/cash-stages");
  await page.getByRole("link", { name: "Выбрать этот способ" }).click();
  await expect(
    page.getByRole("heading", { name: "Пока нет выбранного объёма работ" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Рассчитать стоимость" }).click();
  await page.getByRole("link", { name: "Оплатить (демо)" }).click();
  await expect(page.getByRole("radio", { name: /Наличными по этапам/ })).toBeChecked();
});

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

  await expect(
    page.getByRole("button", { name: "Подтвердить маршрут и скачать PDF" }),
  ).toBeDisabled();
  await expect(page.locator(".payment-progress li.is-current")).toContainText("Способ");
  await page.getByRole("radio", { name: /Наличными полностью/ }).check();
  await expect(page.locator(".payment-progress li.is-complete")).toHaveCount(1);
  await expect(page.locator(".payment-progress li.is-current")).toContainText("Условия");
  const confirmButton = page.getByRole("button", {
    name: "Подтвердить демо-запись и скачать PDF",
  });
  await expect(page.locator(".payment-cost-lines")).toContainText("−");
  await expect(confirmButton).toBeDisabled();
  await chooseDemoAppointment(page, "Екатеринбург");
  await expect(page.locator(".payment-confirm-panel")).toContainText("Екатеринбург");
  await page.getByRole("checkbox", { name: /Понимаю, что запись и оплата/ }).check();
  await expect(page.locator(".payment-progress li.is-current")).toContainText("Подтверждение");
  const downloadPromise = page.waitForEvent("download");
  await confirmButton.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^osnova-payment-OSNOVA-DEMO-.*\.pdf$/);
  const path = await download.path();
  expect(path).toBeTruthy();
  expect((await readFile(path!)).subarray(0, 5).toString()).toBe("%PDF-");
  await expect(page.getByText("Спасибо за выбор ОСНОВЫ!")).toBeVisible();
  await expect(page.locator(".payment-success")).toContainText("деньги не списаны");
  await expect(page.locator(".payment-success")).toContainText("Екатеринбург");
  await expect(page.locator(".payment-progress li.is-complete")).toHaveCount(3);
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
  const cashConfirm = page.getByRole("button", { name: "Подтвердить демо-запись и скачать PDF" });
  await expect(cashConfirm).toBeDisabled();
  await chooseDemoAppointment(page, "Москва");
  await page.getByRole("checkbox", { name: /Понимаю, что запись и оплата/ }).check();
  await expect(cashConfirm).toBeEnabled();

  await page.getByRole("radio", { name: /Кредит/ }).check();
  await expect(page.getByRole("combobox", { name: "Удобный демо-офис" })).toHaveCount(0);
  await expect(page.locator(".payment-external-banks a")).toHaveCount(1);
  await page.getByRole("checkbox", { name: /Понимаю, что запись и оплата/ }).check();
  const bankConfirm = page.getByRole("button", { name: "Подтвердить маршрут и скачать PDF" });
  await expect(bankConfirm).toBeEnabled();

  await page.getByRole("radio", { name: /Ипотека/ }).check();
  await expect(page.locator(".payment-external-banks a")).toHaveCount(2);
  await expect(bankConfirm).toBeDisabled();
});

test("демо-запись не подтверждается без рабочего дня и сбрасывается при смене офиса", async ({
  page,
}) => {
  await page.goto("/calculator");
  await page.getByRole("link", { name: "Оплатить (демо)" }).click();
  await page.getByRole("radio", { name: /Наличными полностью/ }).check();
  const confirmButton = page.getByRole("button", {
    name: "Подтвердить демо-запись и скачать PDF",
  });
  await page.getByRole("combobox", { name: "Удобный демо-офис" }).click();
  await page.getByRole("option", { name: /Казань/ }).click();
  await expect(confirmButton).toBeDisabled();

  const date = page.locator("#payment-appointment-date");
  const min = await date.getAttribute("min");
  expect(min).toBeTruthy();
  const saturday = new Date(`${min}T12:00:00Z`);
  while (saturday.getUTCDay() !== 6) saturday.setUTCDate(saturday.getUTCDate() + 1);
  await date.fill(saturday.toISOString().slice(0, 10));
  await expect(page.locator("#payment-date-help")).toContainText("понедельника по пятницу");
  await expect(confirmButton).toBeDisabled();

  await date.fill(min!);
  await page.locator(".payment-time-slots label").filter({ hasText: "11:00" }).click();
  await page.getByRole("checkbox", { name: /Понимаю, что запись и оплата/ }).check();
  await expect(confirmButton).toBeEnabled();
  await page.getByRole("combobox", { name: "Удобный демо-офис" }).click();
  await page.getByRole("option", { name: /Иркутск/ }).click();
  await expect(date).toHaveValue("");
  await expect(confirmButton).toBeDisabled();
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
  await chooseDemoAppointment(page, "Екатеринбург");
  await expect(page.locator(".payment-confirm-panel")).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});
