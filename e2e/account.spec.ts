import { expect, test } from "@playwright/test";
import { openDemoCabinetViaGoogle, readDemoCode, submitDemoCode } from "./demo-auth";

const favoritesKey = "osnova.favorite-projects.v1";
const estimatesKey = "osnova.saved-estimates.v1";
const profileKey = "osnova.demo-profile.v1";

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
  await openDemoCabinetViaGoogle(page);

  await expect(page.getByRole("status")).toContainText("не синхронизируются между устройствами");
  await expect(page.getByRole("heading", { name: "Избранные дома" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Скандинавия" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Открыть проект" }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Сохранённые сметы" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Демо-расчёт Севера" })).toBeVisible();
  await expect(page).toHaveURL(/\/account$/);
});

test("каталог, калькулятор и способы оплаты доступны до входа", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Пространство");
  await expect(page.getByLabel("Фильтры проектов")).toBeVisible();
  await page.goto("/calculator");
  await expect(page.getByRole("region", { name: "Калькулятор сметы" })).toBeVisible();
  await page.goto("/payment");
  await expect(page.getByRole("heading", { name: "Какие есть варианты" })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("osnova.demo-session.v1"))).toBeNull();
});

test("регистрация принимает только учебный адрес и открывает кабинет после кода", async ({
  page,
}) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:")) externalRequests.push(request.url());
  });

  await expect(page.getByRole("tab", { name: "Регистрация" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByLabel("Как к вам обращаться").fill("Анна");
  await page.getByLabel("Учебный email").fill("anna@example.com");
  await page.getByRole("button", { name: "Продолжить регистрацию" }).click();
  await expect(page.getByRole("alert")).toContainText("учебный адрес");
  expect(await page.evaluate((key) => localStorage.getItem(key), profileKey)).toBeNull();

  await page.getByLabel("Учебный email").fill("Anna@osnova.test");
  await page.getByRole("button", { name: "Продолжить регистрацию" }).click();
  await expect(page.locator(".account-demo-mail")).toContainText("НИЧЕГО НЕ ОТПРАВЛЕНО");
  expect(await page.evaluate((key) => localStorage.getItem(key), profileKey)).toBeNull();
  await submitDemoCode(page, await readDemoCode(page));

  await expect(page.locator(".account-demo-banner")).toContainText(
    "не синхронизируются между устройствами",
  );
  await expect(page.locator(".account-demo-banner")).toContainText("Здравствуйте, Анна");
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), profileKey),
  ).toEqual({ name: "Анна", email: "anna@osnova.test" });
  expect(externalRequests).toEqual([]);
});

test("после выхода учебный профиль предлагает повторный вход, а избранное и сметы остаются", async ({
  page,
}) => {
  await page.getByLabel("Как к вам обращаться").fill("Мария");
  await page.getByLabel("Учебный email").fill("maria@osnova.test");
  await page.getByRole("button", { name: "Продолжить регистрацию" }).click();
  await submitDemoCode(page, await readDemoCode(page));
  await page.reload();
  await expect(page.getByRole("heading", { name: "Избранные дома" })).toBeVisible();
  await page.getByRole("button", { name: "Выйти из демо" }).click();
  await expect(page.getByRole("tab", { name: "Повторный вход" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByLabel("Учебный email")).toHaveValue("maria@osnova.test");
  await page.getByLabel("Учебный email").fill("unknown@osnova.test");
  await page.getByRole("button", { name: "Получить код для входа" }).click();
  await expect(page.getByRole("alert")).toContainText("нет профиля");
  await page.getByLabel("Учебный email").fill("maria@osnova.test");
  await page.getByRole("button", { name: "Получить код для входа" }).click();
  await submitDemoCode(page, await readDemoCode(page));
  await expect(page.getByRole("heading", { name: "Скандинавия" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Демо-расчёт Севера" })).toBeVisible();
});

for (const provider of ["Google", "Apple"]) {
  test(`макет входа через ${provider} требует код и не обращается к провайдеру`, async ({
    page,
  }) => {
    const externalRequests: string[] = [];
    page.on("request", (request) => {
      if (!request.url().startsWith("http://127.0.0.1:")) externalRequests.push(request.url());
    });
    await page.getByRole("button", { name: `Войти через ${provider}` }).click();
    await expect(page.locator(".account-code-view")).toContainText(`${provider} аккаунтом`);
    await expect(page.locator(".account-demo-mail")).toContainText("НИЧЕГО НЕ ОТПРАВЛЕНО");
    const originalCode = await readDemoCode(page);
    const wrongCode = originalCode === "000000" ? "111111" : "000000";
    await submitDemoCode(page, wrongCode);
    await expect(page.getByRole("alert")).toContainText("Код не совпал");

    await page.getByRole("button", { name: "Создать новый демо-код" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Старый больше не подходит" }),
    ).toBeVisible();
    let newCode = await readDemoCode(page);
    if (newCode === originalCode) {
      await page.getByRole("button", { name: "Создать новый демо-код" }).click();
      newCode = await readDemoCode(page);
    }
    expect(newCode).not.toBe(originalCode);
    await submitDemoCode(page, originalCode);
    await expect(page.getByRole("alert")).toContainText("Код не совпал");
    await submitDemoCode(page, newCode);
    await expect(page.getByRole("heading", { name: "Избранные дома" })).toBeVisible();
    await expect(page.locator(".account-demo-banner")).toContainText(
      `имитация входа через ${provider}`,
    );
    expect(externalRequests).toEqual([]);
  });
}

test("шесть цифр можно вставить целиком на узком экране без горизонтальной прокрутки", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.getByRole("button", { name: "Войти через Google" }).click();
  const code = await readDemoCode(page);
  await page.getByLabel("Цифра 1").evaluate((input, pasted) => {
    const clipboard = new DataTransfer();
    clipboard.setData("text", pasted);
    input.dispatchEvent(
      new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: clipboard }),
    );
  }, code);
  for (let index = 0; index < 6; index += 1) {
    await expect(page.getByLabel(`Цифра ${index + 1}`)).toHaveValue(code[index]);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Готово" }).click();
  await expect(page.getByRole("heading", { name: "Избранные дома" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("чат отвечает по выбранному дому локально и не отправляет сообщения", async ({ page }) => {
  let networkRequests = 0;
  page.on("request", (request) => {
    if (request.url().includes("supabase.co")) networkRequests += 1;
  });
  await openDemoCabinetViaGoogle(page);
  await page.getByLabel("О каком проекте спросить?").selectOption("01");
  await page.getByRole("button", { name: "Можно изменить планировку?" }).click();

  await expect(page.getByLabel("История демо-чата")).toContainText("Для проекта «Скандинавия»");
  await expect(page.getByLabel("История демо-чата")).toContainText(
    "Здесь это демонстрационный сценарий",
  );
  expect(networkRequests).toBe(0);
});

test("удаление дома и расчёта изменяет только локальный список", async ({ page }) => {
  await openDemoCabinetViaGoogle(page);
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
  await openDemoCabinetViaGoogle(page);
  await page.reload();
  await expect(page.getByRole("button", { name: "Выйти из демо" })).toBeVisible();
  await page.getByRole("button", { name: "Выйти из демо" }).click();
  await expect(page.getByRole("button", { name: "Войти через Google" })).toBeVisible();
});
