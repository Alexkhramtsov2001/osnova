import { expect, test } from "@playwright/test";

const favoritesKey = "osnova.favorite-projects.v1";
const estimatesKey = "osnova.saved-estimates.v1";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    ({ favoritesKey, estimatesKey }) => {
      localStorage.setItem(favoritesKey, JSON.stringify(["01", "04"]));
      localStorage.setItem(
        estimatesKey,
        JSON.stringify([
          {
            id: "saved-demo-estimate",
            savedAt: "2026-10-14T10:00:00.000Z",
            title: "Демо-расчёт Севера",
            area: 164,
            mode: "turnkey",
            dataVersion: "demo-2026.10.14-1",
            summary: "Проект: Север\nПлощадь: 164 м²\nДанные только для демонстрации.",
          },
        ]),
      );
    },
    { favoritesKey, estimatesKey },
  );
  await page.goto("/account");
});

test("демо-вход открывает локальные избранные дома и сохранённые расчёты", async ({ page }) => {
  await page.route("https://**.supabase.co/**", (route) => route.abort());
  await page.getByRole("button", { name: "Открыть демо-кабинет" }).click();

  await expect(page.getByRole("status")).toContainText("не синхронизируются между устройствами");
  await expect(page.getByRole("heading", { name: "Избранные дома" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Скандинавия" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Открыть проект" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Сохранённые сметы" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Демо-расчёт Севера" })).toBeVisible();
  await expect(page).toHaveURL(/\/account$/);
});

test("форма показывает только тестовые реквизиты и не обращается к серверу", async ({ page }) => {
  let networkRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("supabase.co")) networkRequests += 1;
  });
  await expect(page.getByLabel("Email для демонстрации")).toHaveValue("demo@osnova.test");
  await expect(page.getByLabel("Email для демонстрации")).toHaveAttribute("readonly", "");
  await expect(page.getByLabel("Тестовый пароль")).toHaveAttribute("readonly", "");
  await page.getByRole("button", { name: "Открыть демо-кабинет" }).click();
  await expect(page.locator(".account-demo-banner")).toContainText(
    "не синхронизируются между устройствами",
  );
  expect(networkRequests).toBe(0);
});

test("чат отвечает по выбранному дому локально и не отправляет сообщения", async ({ page }) => {
  let networkRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("supabase.co")) networkRequests += 1;
  });
  await page.getByRole("button", { name: "Открыть демо-кабинет" }).click();
  await page.getByLabel("О каком проекте спросить?").selectOption("01");
  await page.getByRole("button", { name: "Можно изменить планировку?" }).click();

  await expect(page.getByLabel("История демо-чата")).toContainText("Для проекта «Скандинавия»");
  await expect(page.getByLabel("История демо-чата")).toContainText(
    "Здесь это демонстрационный сценарий",
  );
  expect(networkRequests).toBe(0);
});

test("удаление дома и расчёта изменяет только локальный список", async ({ page }) => {
  await page.getByRole("button", { name: "Открыть демо-кабинет" }).click();
  await page.getByRole("button", { name: "Убрать из избранного" }).first().click();
  await page.getByRole("button", { name: "Удалить" }).click();

  await expect(page.getByRole("heading", { name: "Скандинавия" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Демо-расчёт Севера" })).toHaveCount(0);
  const data = await page.evaluate(
    ({ favoritesKey, estimatesKey }) => ({
      favorites: JSON.parse(localStorage.getItem(favoritesKey) ?? "[]"),
      estimates: JSON.parse(localStorage.getItem(estimatesKey) ?? "[]"),
    }),
    { favoritesKey, estimatesKey },
  );
  expect(data.favorites).toEqual(["04"]);
  expect(data.estimates).toEqual([]);
});

test("демо-сессия переживает обновление вкладки и завершается кнопкой выхода", async ({ page }) => {
  await page.getByRole("button", { name: "Открыть демо-кабинет" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Выйти из демо" })).toBeVisible();
  await page.getByRole("button", { name: "Выйти из демо" }).click();
  await expect(page.getByRole("button", { name: "Открыть демо-кабинет" })).toBeVisible();
});
