import { expect, test, type Page } from "@playwright/test";
import { readDemoCode, submitDemoCode } from "./demo-auth";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", async (route) => {
    const { hostname } = new URL(route.request().url());
    if (hostname === "127.0.0.1" || hostname === "localhost") await route.continue();
    else await route.fulfill({ status: 200, contentType: "text/plain", body: "" });
  });
});

async function login(page: Page) {
  await page.getByRole("button", { name: "Войти через Google", exact: true }).click();
  await submitDemoCode(page, await readDemoCode(page));
}

async function navigate(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Основная навигация", exact: true })
    .getByRole("link", { name, exact: true })
    .click();
}

async function configure(page: Page) {
  await page.getByRole("spinbutton", { name: /Площадь дома/ }).fill("145");
  for (const [name, option] of [
    ["Материал стен", /^Каркас$/],
    ["Кровельное покрытие", /^Мягкая кровля$/],
    ["Регион строительства", /^Урал ·/],
    ["Доставка материалов", /^50–300 км ·/],
  ] as const) {
    await page.getByRole("combobox", { name, exact: true }).click();
    await page.getByRole("option", { name: option }).click();
  }
  await page.getByRole("button", { name: "Комфорт", exact: true }).click();
  await page.getByRole("button", { name: "Отдельные этапы", exact: true }).click();
  const scope = page.getByRole("group", { name: "Состав работ", exact: true });
  for (const checkbox of await scope.getByRole("checkbox").all()) {
    const label = (await checkbox.locator("..").innerText()).trim();
    await checkbox.setChecked(label === "Фундамент" || label === "Кровля");
  }
}

async function expectSettings(page: Page) {
  for (const [name, value] of [
    ["Материал стен", "frame"],
    ["Кровельное покрытие", "soft"],
    ["Регион строительства", "ural"],
    ["Доставка материалов", "regional"],
  ])
    await expect(page.getByRole("combobox", { name, exact: true })).toHaveAttribute(
      "data-value",
      value,
    );
  await expect(page.getByRole("button", { name: "Комфорт", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const scope = page.getByRole("group", { name: "Состав работ", exact: true });
  await expect(scope.getByRole("checkbox", { checked: true })).toHaveCount(2);
  await expect(scope.getByRole("checkbox", { name: "Фундамент", exact: true })).toBeChecked();
  await expect(scope.getByRole("checkbox", { name: "Кровля", exact: true })).toBeChecked();
}

test("каталог и страница другого дома одинаково сохраняют комплектацию", async ({ page }) => {
  await page.goto("/account");
  await login(page);
  await navigate(page, "Калькулятор");
  await configure(page);
  await navigate(page, "Проекты");
  await page.getByRole("link", { name: "Рассчитать стоимость проекта Север", exact: true }).click();
  await expect(page.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("164");
  await expectSettings(page);
  await navigate(page, "Проекты");
  await page.locator("#project-04 .project-image-link").click();
  await page.getByRole("link", { name: "Рассчитать этот дом", exact: true }).click();
  await expect(page).toHaveURL(/calculator\?project=04$/);
  await expect(page.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("90");
  await expectSettings(page);
});

test("выбор дома через учебный вход сохраняет комплектацию", async ({ page }) => {
  await page.goto("/calculator");
  await configure(page);
  await navigate(page, "Проекты");
  await page.getByRole("link", { name: "Рассчитать стоимость проекта Север", exact: true }).click();
  await expect(page).toHaveURL(/account\?mode=register&next=/);
  await login(page);
  await expect(page).toHaveURL(/calculator\?project=02$/);
  await expect(page.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("164");
  await expectSettings(page);
});

test("редактирование через оплату и возврат по истории сохраняют свежий проектный черновик", async ({
  page,
}) => {
  await page.goto("/account");
  await login(page);
  await navigate(page, "Проекты");
  await page.getByRole("link", { name: "Рассчитать стоимость проекта Север", exact: true }).click();
  await configure(page);
  await page.getByRole("link", { name: "Оплатить (демо)", exact: true }).click();
  await expect(page.locator(".payment-configuration")).toContainText("145 м²");
  await page.getByRole("link", { name: "Изменить расчёт", exact: true }).click();
  await expectSettings(page);
  await page.getByRole("spinbutton", { name: /Площадь дома/ }).fill("180");
  await page.getByRole("link", { name: "Оплатить (демо)", exact: true }).click();
  await expect(page.locator(".payment-configuration")).toContainText("180 м²");
  await page.goBack();
  await page.goBack();
  await page.goBack();
  await expect(page).toHaveURL(/calculator\?project=02$/);
  await expect(page.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("180");
  await expectSettings(page);
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(sessionStorage.getItem("osnova.calculator-draft.v1")!).sourceProjectNumber,
      ),
    )
    .toBe("02");
  await page.reload();
  await expect(page.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("180");
  await expectSettings(page);
});
