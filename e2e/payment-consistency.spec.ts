import { expect, test } from "./authenticated-test";
import type { Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", async (route) => {
    const { hostname } = new URL(route.request().url());
    if (hostname === "127.0.0.1" || hostname === "localhost") await route.continue();
    else await route.fulfill({ status: 200, contentType: "text/plain", body: "" });
  });
});

test("ошибка записи актуальной сметы блокирует оформление старого черновика", async ({ page }) => {
  await page.goto("/calculator");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem("osnova.calculator-draft.v1") ?? "null")?.parameters
            .area,
      ),
    )
    .toBe(120);
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "osnova.calculator-draft.v1")
        throw new DOMException("Simulated quota", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.getByRole("spinbutton", { name: /Площадь дома/ }).fill("145");
  await page.getByRole("link", { name: "Оплатить (демо)", exact: true }).click();
  await expect(page).toHaveURL(/calculator$/);
  await expect(
    page.getByRole("alert").filter({ hasText: "Не удалось сохранить актуальный расчёт" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Основная навигация", exact: true })
    .getByRole("link", { name: "Оплата", exact: true })
    .click();
  await expect(page.locator(".payment-checkout")).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("Актуальная смета не сохранена");
  await page.reload();
  await expect(page.locator(".payment-configuration")).toHaveCount(0);
  await expect(page.locator(".payment-checkout")).toHaveCount(0);
});

async function openPayment(page: Page) {
  await page.goto("/calculator");
  await page.getByRole("link", { name: "Оплатить (демо)", exact: true }).click();
}
async function book(page: Page) {
  await page.getByRole("combobox", { name: "Удобный демо-офис", exact: true }).click();
  await page.getByRole("option", { name: /^Екатеринбург,/ }).click();
  const date = page.locator("#payment-appointment-date");
  await date.fill((await date.getAttribute("min"))!);
  await page.locator(".payment-time-slots label").filter({ hasText: "10:00" }).click();
  await page
    .getByRole("checkbox", { name: /Понимаю, что запись и оплата демонстрационные/ })
    .check();
  return date.inputValue();
}
const rubles = (value: string) => Number(value.replace(/−/g, "-").replace(/[^\d-]/g, ""));

test("последний способ оплаты согласован с URL и переживает обновление", async ({ page }) => {
  await openPayment(page);
  if (
    !(await page
      .locator(".payment-reference")
      .evaluate((node) => (node as HTMLDetailsElement).open))
  )
    await page.locator(".payment-reference > summary").click();
  await page.locator('.payment-method-card[href$="/cash-full"]').click();
  await page.getByRole("link", { name: "Выбрать этот способ", exact: true }).click();
  await page.getByRole("radio", { name: /Наличными по этапам/ }).check();
  await expect(page).toHaveURL(/method=cashStages/);
  await expect
    .poll(() => page.evaluate(() => sessionStorage.getItem("osnova-payment-method")))
    .toBe("cashStages");
  await page.reload();
  await expect(page.getByRole("radio", { name: /Наличными по этапам/ })).toBeChecked();
  await page.getByRole("radio", { name: /Кредит/ }).check();
  await expect(page).toHaveURL(/method=credit/);
  await page.reload();
  await expect(page.getByRole("radio", { name: /Кредит/ })).toBeChecked();
});

test("поля оформления восстанавливаются только для той же сметы и способа", async ({ page }) => {
  await openPayment(page);
  await page.getByRole("radio", { name: /Наличными полностью/ }).check();
  const date = await book(page);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Удобный демо-офис" })).toContainText(
    "Екатеринбург",
  );
  await expect(page.locator("#payment-appointment-date")).toHaveValue(date);
  await expect(page.getByRole("radio", { name: "10:00", exact: true })).toBeChecked();
  await expect(
    page.getByRole("button", { name: "Подтвердить демо-запись и скачать PDF", exact: true }),
  ).toBeEnabled();
  await page.getByRole("link", { name: "Изменить расчёт", exact: true }).click();
  await page.getByRole("spinbutton", { name: /Площадь дома/ }).fill("145");
  await page.getByRole("link", { name: "Оплатить (демо)", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Удобный демо-офис" })).toContainText(
    "Выберите город",
  );
  await book(page);
  await page.getByRole("radio", { name: /Наличными по этапам/ }).check();
  await expect(page.getByRole("combobox", { name: "Удобный демо-офис" })).toContainText(
    "Выберите город",
  );
  await expect(
    page.getByRole("checkbox", { name: /Понимаю, что запись и оплата демонстрационные/ }),
  ).not.toBeChecked();
});

test("повторное подтверждение и обновление скачивают PDF с прежним номером", async ({
  page,
}, testInfo) => {
  await openPayment(page);
  await page.getByRole("radio", { name: /Наличными полностью/ }).check();
  await book(page);
  const firstDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Подтвердить демо-запись и скачать PDF", exact: true })
    .click();
  const first = await firstDownload;
  await first.saveAs(testInfo.outputPath("confirmation.pdf"));
  const reference = await page.locator(".payment-success small").innerText();
  const secondDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Скачать существующее подтверждение", exact: true })
    .click();
  expect((await secondDownload).suggestedFilename()).toBe(first.suggestedFilename());
  await expect(page.locator(".payment-success small")).toHaveText(reference);
  await page.reload();
  await expect(page.locator(".payment-success small")).toHaveText(reference);
  const thirdDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Скачать подтверждение ещё раз", exact: true }).click();
  expect((await thirdDownload).suggestedFilename()).toBe(first.suggestedFilename());
  await expect(page.locator(".payment-success small")).toHaveText(reference);
});

test("дробная смета согласована в калькуляторе, оплате, графике и PDF", async ({
  page,
}, testInfo) => {
  await page.goto("/calculator");
  await page.getByRole("spinbutton", { name: /Площадь дома/ }).fill("120.1");
  await page.getByRole("button", { name: "Отдельные этапы", exact: true }).click();
  const scope = page.getByRole("group", { name: "Состав работ", exact: true });
  for (const checkbox of await scope.getByRole("checkbox").all()) {
    const label = (await checkbox.locator("..").innerText()).trim();
    await checkbox.setChecked(label === "Коробка дома" || label === "Кровля");
  }
  await page.locator(".estimate-breakdown-heading").click();
  const calcStages = (await page.locator(".estimate-stage-price").allInnerTexts())
    .filter((value) => value !== "Не включён")
    .map(rubles);
  const total = rubles(await page.locator(".estimate-grand-total strong").innerText());
  expect(calcStages.reduce((a, b) => a + b, 0)).toBe(total);
  const estimateDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Скачать расчёт в PDF", exact: true }).click();
  await (await estimateDownload).saveAs(testInfo.outputPath("estimate.pdf"));
  await page.getByRole("link", { name: "Оплатить (демо)", exact: true }).click();
  await page.locator(".payment-stage-details > summary").click();
  await expect(page.locator(".payment-stage-list li")).toHaveCount(2);
  const paymentStages = (await page.locator(".payment-stage-list strong").allInnerTexts()).map(
    rubles,
  );
  expect(paymentStages).toEqual(calcStages);
  expect(rubles(await page.locator(".payment-final strong").innerText())).toBe(total);
  await page.getByRole("radio", { name: /Наличными по этапам/ }).check();
  expect(
    (await page.locator(".payment-stage-schedule strong").allInnerTexts()).map(rubles),
  ).toEqual(calcStages);
  await page.getByRole("radio", { name: /Наличными полностью/ }).check();
  const discount = rubles(await page.locator(".payment-confirm-panel dd").last().innerText());
  expect(rubles(await page.locator(".payment-final strong").innerText())).toBe(total + discount);
  await book(page);
  const paymentDownload = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Подтвердить демо-запись и скачать PDF", exact: true })
    .click();
  await (await paymentDownload).saveAs(testInfo.outputPath("payment.pdf"));
});
