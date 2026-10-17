import { expect, test } from "@playwright/test";
import { openDemoCabinetViaGoogle } from "./demo-auth";

test("блок доверия ведёт к выбору проекта, а страницы компании и партнёров — к расчёту", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".review-card")
    .first()
    .getByRole("link", { name: "Сравнить проекты" })
    .click();
  await expect(page).toHaveURL(/\/projects$/);
  await page.goto("/about");
  await expect(page.locator(".stat-grid")).toContainText("Концепций для сравнения");
  await page.locator(".journey-next-step").getByRole("link", { name: "Смотреть проекты" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await page.goto("/partners");
  await page
    .locator(".journey-next-step")
    .getByRole("link", { name: "Сравнить стоимость" })
    .click();
  await expect(page).toHaveURL(/\/calculator$/);
});

test("сохранённый расчёт можно продолжить из кабинета с выбранными параметрами", async ({
  page,
}) => {
  await page.goto("/calculator");
  await page.getByRole("spinbutton", { name: /Площадь дома/ }).fill("145");
  await page.getByRole("button", { name: "Сохранить расчёт" }).click();
  await page.goto("/account");
  await openDemoCabinetViaGoogle(page);
  await page
    .locator(".account-estimate-card")
    .getByRole("button", { name: "Продолжить расчёт" })
    .click();
  await expect(page).toHaveURL(/\/calculator$/);
  await expect(page.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("145");
  await expect(page.getByRole("link", { name: /Оплатить/ })).toBeVisible();
});

test("проверенная контактная форма открывает письмо только по действию пользователя", async ({
  page,
}) => {
  await page.goto("/contacts");
  const form = page.locator(".demo-contact-form");
  await form.getByLabel("Имя", { exact: true }).fill("Тестовый посетитель");
  await form.getByLabel("Email", { exact: true }).fill("example@example.com");
  await form.getByLabel("Идея проекта").fill("Хочу обсудить проект дома 120 м²");
  await form.getByRole("button", { name: "Проверить заполнение" }).click();
  const link = form.getByRole("link", { name: "Открыть подготовленное письмо" });
  await expect(link).toHaveAttribute("href", /^mailto:/);
  expect(decodeURIComponent((await link.getAttribute("href")) ?? "")).toContain("120 м²");
  await form.getByLabel("Идея проекта").fill("Другая идея для расчёта");
  await expect(link).toHaveCount(0);
});

for (const width of [320, 768, 1440]) {
  test(`переходы и кнопки карточек остаются доступны при ширине ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/about", "/partners", "/account"]) {
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.goto("/");
    const cards = page.locator(".review-card");
    for (const card of await cards.all()) {
      const bounds = await card.boundingBox();
      const action = await card.getByRole("link").boundingBox();
      expect(
        bounds && action && Math.abs(bounds.y + bounds.height - action.y - action.height),
      ).toBeLessThan(32);
    }
  });
}
