import { expect, test } from "@playwright/test";
import { projects } from "../src/features/projects/catalog";
import { formatPriceRange, getProjectEstimate } from "../src/features/projects/estimates";

test("сравнение объясняет выбор и ведёт к расчёту дома", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.locator(".project-price strong")).toHaveCount(8);
  for (const name of ["Компакт", "Простор"])
    await page.getByRole("button", { name: `Добавить в избранное: ${name}`, exact: true }).click();
  await page.getByRole("button", { name: "Избранное (2)" }).click();
  await page.getByRole("link", { name: "Сравнить 2 дома" }).click();
  const comparison = page.locator("#project-comparison");
  for (const name of [
    "Почему выбирают этот дом",
    "Ориентир под ключ",
    "Цена за м²",
    "Пятно застройки, примерно",
    "Кому подойдёт",
    "Что учесть",
  ])
    await expect(comparison.getByRole("rowheader", { name, exact: true })).toBeVisible();
  await expect(
    comparison
      .locator(".comparison-table-scroll")
      .getByText("Самый низкий бюджет среди выбранных в общей комплектации."),
  ).toBeVisible();
  const project = projects.find((item) => item.name === "Компакт")!;
  const estimate = getProjectEstimate(project);
  await expect(comparison.locator(".comparison-price-row")).toContainText(
    formatPriceRange(estimate.minTotal, estimate.maxTotal),
  );
  await comparison
    .getByRole("link", { name: "Рассчитать стоимость проекта Компакт", exact: true })
    .click();
  await expect(page).toHaveURL(/\/calculator\?project=04$/);
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  await expect(calculator.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("90");
  const money = new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  });
  await expect(calculator.locator(".estimate-grand-total strong")).toHaveText(
    money.format(estimate.total),
  );
});

test("концепции семейного дома и террасы объясняют их назначение и цену относительно выбора", async ({
  page,
}) => {
  await page.goto("/compare?projects=04,05,06");
  const characterRow = page.locator(".comparison-character-row");
  await expect(characterRow).toContainText("Дом, который даёт семье запас на будущее");
  await expect(characterRow).toContainText("Дом для длинных летних дней на открытом воздухе");
  await expect(characterRow).toContainText("тёплых регионов");
  await expect(characterRow).toContainText("По сравнению с «Компакт»");
  await expect(characterRow.locator(".comparison-selection-note")).toHaveCount(3);
});

test("мобильная ссылка на кабинет открывает внутреннюю страницу в текущей вкладке", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/projects");
  const button = page.getByRole("button", { name: "Открыть меню" });
  await button.click();
  const pagesBeforeClick = page.context().pages().length;
  await page
    .getByRole("navigation", { name: "Мобильная навигация" })
    .getByRole("link", { name: "Личный кабинет" })
    .click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "Ваши проекты" })).toBeVisible();
  expect(page.context().pages()).toHaveLength(pagesBeforeClick);
  await expect(page.getByRole("button", { name: "Открыть меню" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page
    .getByRole("navigation", { name: "Мобильная навигация" })
    .getByRole("link", { name: "Контакты" })
    .click();
  await expect(page).toHaveURL(/\/contacts$/);
  await expect(page.locator("#demo-chat")).toBeVisible();
});

test("кнопка кабинета выделена акцентным цветом, а favicon повторяет знак бренда", async ({
  page,
}) => {
  await page.goto("/projects");
  const accountLink = page.getByRole("link", { name: "Личный кабинет" }).first();
  await expect(accountLink).toHaveCSS("background-color", "rgb(185, 94, 67)");
  await expect(accountLink).not.toContainText("Демо");

  const faviconHref = await page.locator('link[rel="icon"]').getAttribute("href");
  expect(faviconHref).toContain("favicon.svg");
  const favicon = await page.request.get(new URL(faviconHref!, page.url()).toString());
  expect(favicon.ok()).toBeTruthy();
  expect(await favicon.text()).toContain("#b95e43");
});
