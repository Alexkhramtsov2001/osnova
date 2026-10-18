import { expect, test, type Page } from "@playwright/test";
import { readDemoCode, submitDemoCode } from "./demo-auth";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", async (route) => {
    const { hostname } = new URL(route.request().url());
    if (hostname === "127.0.0.1" || hostname === "localhost") await route.continue();
    else await route.fulfill({ status: 200, contentType: "text/plain", body: "" });
  });
});

async function navigate(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Основная навигация", exact: true })
    .getByRole("link", { name, exact: true })
    .click();
}

test("новый расчёт сбрасывает черновик и сохраняет сметы для продолжения", async ({ page }) => {
  await page.goto("/account");
  await page.getByRole("button", { name: "Войти через Google", exact: true }).click();
  await submitDemoCode(page, await readDemoCode(page));
  await navigate(page, "Калькулятор");
  await page.getByRole("spinbutton", { name: /Площадь дома/ }).fill("145");
  await page.getByRole("combobox", { name: "Материал стен", exact: true }).click();
  await page.getByRole("option", { name: "Каркас", exact: true }).click();
  await page.getByRole("button", { name: "Отдельные этапы", exact: true }).click();
  const scope = page.getByRole("group", { name: "Состав работ", exact: true });
  for (const checkbox of (await scope.getByRole("checkbox").all()).slice(1))
    await checkbox.uncheck();
  await page.getByRole("button", { name: "Сохранить расчёт", exact: true }).click();
  await expect(page.locator(".estimate-saved-status")).toContainText("Расчёт сохранён");
  const saved = await page.evaluate(() => localStorage.getItem("osnova.saved-estimates.v1"));
  await page.getByRole("link", { name: "Личный кабинет", exact: true }).first().click();
  await page.getByRole("link", { name: "Новый расчёт", exact: true }).click();
  await expect(page.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("120");
  await expect(page.getByRole("combobox", { name: "Материал стен", exact: true })).toHaveAttribute(
    "data-value",
    "aeratedConcrete",
  );
  await expect(page.getByRole("button", { name: "Под ключ", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(await page.evaluate(() => localStorage.getItem("osnova.saved-estimates.v1"))).toBe(saved);
  await page.getByRole("link", { name: "Личный кабинет", exact: true }).first().click();
  await page.getByRole("button", { name: "Продолжить расчёт", exact: true }).click();
  await expect(page.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("145");
  await expect(page.getByRole("combobox", { name: "Материал стен", exact: true })).toHaveAttribute(
    "data-value",
    "frame",
  );
  await expect(scope.getByRole("checkbox", { checked: true })).toHaveCount(1);
  expect(await page.evaluate(() => localStorage.getItem("osnova.saved-estimates.v1"))).toBe(saved);
});

test("прогресс подбора восстанавливается после обновления и возврата", async ({ page }) => {
  await page.goto("/find-home");
  await page.getByRole("radio", { name: "Приезжать на выходные", exact: true }).check();
  await page.getByRole("button", { name: "Продолжить", exact: true }).click();
  await page.getByRole("radio", { name: "Три спальни", exact: true }).check();
  await page.getByRole("button", { name: "Продолжить", exact: true }).click();
  const question = await page.locator("fieldset legend").innerText();
  await page.getByRole("radio").first().check();
  const answer = await page.getByRole("radio", { checked: true }).inputValue();
  await page.reload();
  await expect(page.getByText("Вопрос 3 из 7")).toBeVisible();
  await expect(page.locator("fieldset legend")).toHaveText(question);
  await expect(page.getByRole("radio", { checked: true })).toHaveValue(answer);
  await navigate(page, "Проекты");
  await page.goBack();
  await expect(page.getByText("Вопрос 3 из 7")).toBeVisible();
  await expect(page.getByRole("radio", { checked: true })).toHaveValue(answer);
});

test("рекомендация сохраняется после просмотра проекта и обновления", async ({ page }) => {
  await page.goto("/find-home");
  for (let step = 0; step < 7; step++) {
    const id = await page.getByRole("radio").first().getAttribute("name");
    const values: Record<string, string> = {
      purpose: "weekends",
      bedrooms: "3",
      floors: "any",
      area: "any",
      plot: "any",
      budget: "any",
    };
    if (id && values[id]) await page.locator(`input[type="radio"][value="${values[id]}"]`).check();
    else await page.getByRole("radio").first().check();
    await page
      .getByRole("button", { name: step === 6 ? "Показать мой дом" : "Продолжить", exact: true })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Дом, с которого стоит начать", exact: true }),
  ).toBeVisible();
  const project = await page.locator(".finder-result-copy h2").innerText();
  await page.getByRole("link", { name: "Посмотреть проект", exact: true }).click();
  await expect(page).toHaveURL(/projects\/0[1-8]$/);
  await page.goBack();
  await expect(page.locator(".finder-result-copy h2")).toHaveText(project);
  await page.reload();
  await expect(page.locator(".finder-result-copy h2")).toHaveText(project);
  await page.getByRole("button", { name: "Изменить ответы", exact: true }).click();
  await page.getByRole("button", { name: "Назад", exact: true }).click();
  await expect(page.getByText("Вопрос 6 из 7")).toBeVisible();
  await page.getByRole("button", { name: "Продолжить", exact: true }).click();
  await expect(page.getByText("Вопрос 7 из 7")).toBeVisible();
  await page.getByRole("button", { name: "Показать мой дом", exact: true }).click();
  await expect(page.locator(".finder-result-copy h2")).toHaveText(project);
});

test("условия оплаты доступны гостю, а текст входа объясняет оформление", async ({ page }) => {
  await page.goto("/payment");
  await expect(page.locator(".payment-method-card")).toHaveCount(4);
  await navigate(page, "Калькулятор");
  await page.getByRole("link", { name: "Оплатить (демо)", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Войдите, чтобы оформить выбор", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Зарегистрироваться", exact: true }).click();
  await expect(page.locator(".account-auth-context")).toContainText(
    "просмотр условий оплаты доступны без входа",
  );
  await expect(page.locator(".account-auth-context")).toContainText(
    "Демонстрационное оформление требует учебной авторизации",
  );
  await expect(page.locator(".account-auth-context")).not.toContainText(
    "демо-оплата доступны и без входа",
  );
});
