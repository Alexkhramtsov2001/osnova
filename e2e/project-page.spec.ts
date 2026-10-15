import { expect, test } from "@playwright/test";

test("карточка открывает отдельный проект в текущей вкладке и переносит его в расчёт", async ({
  page,
}) => {
  await page.goto("/projects");
  const card = page.locator("#project-02");
  await card.scrollIntoViewIfNeeded();
  const priceBox = await card.locator(".project-price").boundingBox();
  await page.mouse.click(priceBox!.x + priceBox!.width / 2, priceBox!.y + priceBox!.height / 2);
  await expect(page).toHaveURL(/\/projects\/02$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole("heading", { level: 1, name: "Север" })).toBeInViewport();
  await expect(page.getByRole("heading", { level: 1, name: "Север" })).toBeVisible();
  await expect(
    page.getByText("Больше личного пространства на меньшем пятне застройки"),
  ).toBeVisible();
  await expect(page.locator(".project-detail-image")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Как можно использовать этот дом" }),
  ).toBeVisible();
  await expect(page.getByText("Ленточный", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Что входит в демонстрационный сценарий" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Условия определяются для реального строительства" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "У демонстрационного проекта нет утверждённого гарантийного срока или договора.",
      { exact: false },
    ),
  ).toBeVisible();
  const warrantyY = await page
    .locator(".project-detail-warranty")
    .evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
  const priceY = await page
    .locator(".project-detail-price")
    .evaluate((node) => node.getBoundingClientRect().top + window.scrollY);
  expect(priceY).toBeGreaterThan(warrantyY);
  await page.getByRole("link", { name: "Рассчитать этот дом" }).click();
  await expect(page).toHaveURL(/\/calculator\?project=02$/);
  await expect(page.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("164");
  await expect(page.getByText("На основе проекта «Север»")).toBeVisible();
});

test("прямая ссылка на проект и неизвестный id", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/projects/01");
  await expect(page.getByRole("heading", { level: 1, name: "Скандинавия" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("link", { name: "К подборке проектов" }).click();
  await expect(page).toHaveURL(/\/projects$/);
  await expect(page.locator("#projects")).toBeInViewport();
  await page.goto("/projects/999");
  await expect(page.getByText("Такого дома в подборке нет.")).toBeVisible();
});
