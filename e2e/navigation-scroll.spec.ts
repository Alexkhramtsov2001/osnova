import { expect, test } from "@playwright/test";

test("дом открывается сразу сверху, а возврат ведёт на точную позицию каталога", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const card = page.locator("#project-06");
  await card.evaluate((node) => node.scrollIntoView({ behavior: "instant", block: "center" }));
  const link = card.getByRole("link", { name: "Открыть проект", exact: false });
  const box = await link.boundingBox();
  const originalPosition = await card.evaluate((node) => ({
    y: window.scrollY,
    top: node.getBoundingClientRect().top,
  }));
  expect(originalPosition.y).toBeGreaterThan(400);
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

  await expect(page).toHaveURL(/\/projects\/06$/);
  await expect(page.getByRole("heading", { level: 1, name: "Терраса" })).toBeInViewport();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.getByRole("link", { name: "К подборке проектов" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect
    .poll(async () =>
      Math.abs(
        (await card.evaluate((node) => node.getBoundingClientRect().top)) - originalPosition.top,
      ),
    )
    .toBeLessThan(3);
});

test("кнопка браузера назад возвращает точную позицию, а прямая ссылка ведёт к подборке", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page
    .getByRole("navigation", { name: "Основная навигация" })
    .getByRole("link", { name: "Проекты" })
    .click();
  await expect(page).toHaveURL(/\/#projects$/);
  await page.waitForTimeout(700);
  const card = page.locator("#project-05");
  await card.evaluate((node) => node.scrollIntoView({ behavior: "instant", block: "center" }));
  const originalTop = await card.evaluate((node) => node.getBoundingClientRect().top);
  await card.getByRole("link", { name: "Открыть проект", exact: false }).click();
  await expect(page).toHaveURL(/\/projects\/05$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/#projects$/);
  await expect
    .poll(async () =>
      Math.abs((await card.evaluate((node) => node.getBoundingClientRect().top)) - originalTop),
    )
    .toBeLessThan(3);

  await page.goto("/projects/02");
  await page.getByRole("link", { name: "К подборке проектов" }).click();
  await expect(page).toHaveURL(/\/#projects$/);
  await expect(page.locator("#projects")).toBeInViewport();
});

test("сравнение сохраняет место выбора, а навигация к расчёту открывает нужный раздел сразу", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Добавить в избранное: Скандинавия" }).click();
  await page.getByRole("button", { name: "Добавить в избранное: Север" }).click();
  await page.getByRole("button", { name: "Избранное (2)" }).click();
  const compare = page.getByRole("link", { name: "Сравнить 2 дома" });
  await compare.evaluate((node) => node.scrollIntoView({ behavior: "instant", block: "center" }));
  const originalTop = await compare.evaluate((node) => node.getBoundingClientRect().top);
  await compare.click();
  await expect(page).toHaveURL(/\/compare\?projects=01,02$/);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.getByRole("button", { name: "Убрать из сравнения: Север" }).click();
  await expect(page).toHaveURL(/\/compare\?projects=01$/);
  await page.getByRole("link", { name: "К подборке проектов" }).click();
  await expect
    .poll(async () =>
      Math.abs((await compare.evaluate((node) => node.getBoundingClientRect().top)) - originalTop),
    )
    .toBeLessThan(3);

  await page.goto("/projects/02");
  await page
    .getByRole("navigation", { name: "Основная навигация" })
    .getByRole("link", { name: "Расчёт стоимости" })
    .click();
  await expect(page).toHaveURL(/\/#calculator$/);
  await expect(page.locator("#calculator")).toBeInViewport();
});

test("после просмотра дома фильтры и положение карточки остаются прежними", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const area = page.getByRole("combobox", { name: "Площадь дома" });
  await area.click();
  await page.getByRole("option", { name: "100–150 м²" }).click();
  const floors = page.getByRole("combobox", { name: "Этажность" });
  await floors.click();
  await page.getByRole("option", { name: "1 этаж" }).click();
  const card = page.locator("#project-06");
  await card.evaluate((node) => node.scrollIntoView({ behavior: "instant", block: "center" }));
  const originalTop = await card.evaluate((node) => node.getBoundingClientRect().top);
  await card.getByRole("link", { name: "Открыть проект", exact: false }).click();
  await expect(page).toHaveURL(/\/projects\/06$/);
  await page.getByRole("link", { name: "К подборке проектов" }).click();
  await expect(area).toHaveAttribute("data-value", "100-150");
  await expect(floors).toHaveAttribute("data-value", "1");
  await expect(page.locator(".project-card")).toHaveCount(4);
  await expect
    .poll(async () =>
      Math.abs((await card.evaluate((node) => node.getBoundingClientRect().top)) - originalTop),
    )
    .toBeLessThan(3);
});

test("мобильное меню с внутренней страницы открывает нужный раздел главной", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/projects/02");
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page
    .getByRole("navigation", { name: "Мобильная навигация" })
    .getByRole("link", { name: "Контакты" })
    .click();
  await expect(page).toHaveURL(/\/#contacts$/);
  await expect(page.getByRole("heading", { name: "Есть вопрос о проекте?" })).toBeInViewport();
  await expect(page.getByRole("navigation", { name: "Мобильная навигация" })).toHaveCount(0);
});
