import { expect, test } from "@playwright/test";

test("избранные дома открываются на отдельной странице сравнения", async ({ page }) => {
  await page.goto("/");
  for (const name of ["Скандинавия", "Север", "Лесной"]) {
    await page.getByRole("button", { name: `Добавить в избранное: ${name}`, exact: true }).click();
  }
  await expect(
    page.getByRole("button", { name: "Сравнить проект Скандинавия", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Избранное (3)" }).click();
  await expect(page.locator(".project-card")).toHaveCount(3);
  await page.getByRole("link", { name: "Сравнить 3 дома" }).click();
  await expect(page).toHaveURL(/\/compare\?projects=01,02,03$/);
  const comparison = page.getByRole("region", { name: "Сравнение проектов", exact: true });
  await expect(comparison.getByRole("columnheader")).toHaveCount(4);
  const areaRow = comparison
    .getByRole("row")
    .filter({ has: page.getByRole("rowheader", { name: "Площадь", exact: true }) });
  await expect(areaRow).toContainText("118 м²");
  await expect(areaRow).toContainText("164 м²");
  await comparison.getByRole("button", { name: "Убрать из сравнения: Север" }).click();
  await expect(page).toHaveURL(/\/compare\?projects=01%2C03$/);
  await page.getByRole("link", { name: "К подборке проектов" }).click();
  await expect(page.getByRole("button", { name: "Избранное (3)" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".project-card")).toHaveCount(3);
});

test("из большого списка избранного можно выбрать три дома с клавиатуры", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const name of ["Скандинавия", "Север", "Лесной", "Компакт"]) {
    await page.getByRole("button", { name: `Добавить в избранное: ${name}`, exact: true }).click();
  }
  await page.getByRole("button", { name: "Избранное (4)" }).click();
  const first = page.getByRole("button", { name: "Сравнить проект Скандинавия", exact: true });
  await first.focus();
  await page.keyboard.press("Space");
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Сравнить проект Север", exact: true }).click();
  await page.getByRole("button", { name: "Сравнить проект Лесной", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Сравнить проект Компакт", exact: true }),
  ).toBeDisabled();
  await page.getByRole("link", { name: "Сравнить выбранные (3/3)" }).click();
  await expect(page).toHaveURL(/\/compare\?projects=01,02,03$/);
  const cards = page.locator(".comparison-mobile-card");
  await expect(cards).toHaveCount(3);
  await expect(cards.first()).toContainText("ХАРАКТЕР ПРОЕКТА");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Очистить сравнение" }).click();
  await expect(page.getByText("Пока нет домов для сравнения")).toBeVisible();
});

test("избранное сохраняется после обновления страницы на этом устройстве", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Добавить в избранное: Север", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "добавлен в избранное" })).toBeVisible();
  await expect(
    page.evaluate(() => JSON.parse(localStorage.getItem("osnova.favorite-projects.v1") || "[]")),
  ).resolves.toEqual(["02"]);
  await page.reload();
  await expect(page.getByRole("button", { name: "Избранное (1)" })).toBeVisible();
  await page.getByRole("button", { name: "Избранное (1)" }).click();
  await expect(page.locator(".project-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Убрать из избранного: Север" }).click();
  await expect(page.locator(".projects-empty")).toContainText("В избранном пока пусто");
  await page.reload();
  await expect(page.getByRole("button", { name: "Избранное (0)" })).toBeVisible();
});

test("прямая ссылка на сравнение показывает только известные проекты", async ({ page }) => {
  await page.goto("/compare?projects=04,999,07,04");
  await expect(page.getByRole("heading", { level: 1, name: "Сравнение домов" })).toBeVisible();
  await expect(page.getByRole("columnheader")).toHaveCount(3);
  await expect(page.getByRole("columnheader", { name: /Компакт/ })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: /Простор/ })).toBeVisible();
});
