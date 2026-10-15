import { expect, test } from "@playwright/test";

const calculator = (page: import("@playwright/test").Page) =>
  page.getByRole("region", { name: "Калькулятор сметы", exact: true });

test("назад к ссылке проекта сохраняет изменённый индивидуальный черновик", async ({ page }) => {
  await page.goto("/?project=02#calculator");
  const calc = calculator(page);
  await calc.getByRole("spinbutton", { name: /Площадь дома/ }).fill("180");
  await calc.getByRole("combobox", { name: "Тип проекта", exact: true }).click();
  await page.getByRole("option", { name: "Индивидуальный проект", exact: true }).click();
  await page.getByRole("link", { name: "Личный кабинет", exact: true }).first().click();
  await page.goBack();
  await expect(calc.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("180");
  await expect(calc.getByRole("combobox", { name: "Тип проекта", exact: true })).toHaveAttribute(
    "data-value",
    "custom",
  );
});

test("смена проекта нормализует санузлы в обоих направлениях", async ({ page }) => {
  await page.goto("/calculator");
  const calc = calculator(page);
  await calc.getByRole("spinbutton", { name: /Площадь дома/ }).fill("1000");
  await page
    .getByRole("navigation", { name: "Основная навигация" })
    .getByRole("link", { name: "Проекты", exact: true })
    .click();
  await page.locator("#project-04 .project-calculate-link").click();
  await expect(calc.getByRole("combobox", { name: "Санузлы", exact: true })).toHaveAttribute(
    "data-value",
    "2",
  );
  await expect(calc.locator(".estimate-total-value")).toBeVisible();
  const baths = calc.getByRole("combobox", { name: "Санузлы", exact: true });
  await baths.click();
  await page.getByRole("option", { name: "1", exact: true }).click();
  await page
    .getByRole("navigation", { name: "Основная навигация" })
    .getByRole("link", { name: "Проекты", exact: true })
    .click();
  await page.locator("#project-02 .project-calculate-link").click();
  await expect(baths).toHaveAttribute("data-value", "2");
  await expect(calc.locator(".estimate-total-value")).toBeVisible();
});

for (const fallback of [false, true])
  test(`параллельное сохранение в двух вкладках не теряет записи${fallback ? " без Web Locks" : ""}`, async ({
    page,
    context,
  }) => {
    if (fallback)
      await context.addInitScript(() =>
        Object.defineProperty(navigator, "locks", { value: undefined }),
      );
    await page.goto("/calculator");
    const second = await context.newPage();
    await second.goto("/calculator");
    await calculator(second)
      .getByRole("spinbutton", { name: /Площадь дома/ })
      .fill("200");
    await Promise.all([
      calculator(page).getByRole("button", { name: "Сохранить расчёт", exact: true }).click(),
      calculator(second).getByRole("button", { name: "Сохранить расчёт", exact: true }).click(),
    ]);
    const entries = () =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("osnova.saved-estimates.v1") ?? "[]") as {
            area: number;
          }[],
      );
    await expect
      .poll(async () => (await entries()).map((entry) => entry.area).sort((a, b) => a - b))
      .toEqual([120, 200]);
    await expect(page.getByRole("region", { name: "Сохранённые расчёты" })).toContainText("2 из 8");
    await expect(second.getByRole("region", { name: "Сохранённые расчёты" })).toContainText(
      "2 из 8",
    );
    await second.goto("/account");
    await second.getByRole("button", { name: "Открыть демо-кабинет" }).click();
    await second.getByRole("button", { name: "Удалить", exact: true }).first().click();
    await expect.poll(async () => (await entries()).length).toBe(1);
    await expect(page.getByRole("region", { name: "Сохранённые расчёты" })).toContainText("1 из 8");
  });

test("черновик и отдельные этапы сохраняются после перехода в кабинет и обновления", async ({
  page,
}) => {
  await page.goto("/calculator");
  const calc = calculator(page);
  await calc.getByRole("spinbutton", { name: /Площадь дома/ }).fill("160");
  await calc.getByRole("button", { name: "Отдельные этапы", exact: true }).click();
  const checks = calc.getByRole("group", { name: "Состав работ" }).getByRole("checkbox");
  for (const box of (await checks.all()).slice(1)) await box.uncheck();
  const total = await calc.locator(".estimate-total-value").innerText();
  await page.getByRole("link", { name: "Личный кабинет", exact: true }).first().click();
  await page
    .getByRole("navigation", { name: "Основная навигация" })
    .getByRole("link", { name: "Калькулятор" })
    .click();
  await page.reload();
  await expect(calc.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("160");
  await expect(calc.getByRole("button", { name: "Отдельные этапы", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(calc.getByRole("checkbox", { checked: true })).toHaveCount(1);
  await expect(calc.locator(".estimate-total-value")).toHaveText(total);
});

test("пустой состав работ сохраняется как черновик без ложной цены", async ({ page }) => {
  await page.goto("/calculator");
  const calc = calculator(page);
  await calc.getByRole("button", { name: "Отдельные этапы", exact: true }).click();
  for (const box of await calc.getByRole("checkbox").all()) await box.uncheck();
  await page.reload();
  await expect(calc.getByRole("checkbox", { checked: true })).toHaveCount(0);
  await expect(calc.locator(".estimate-total-card")).toContainText("Выберите хотя бы один этап");
  await expect(calc.getByRole("button", { name: "Скачать расчёт в PDF" })).toHaveCount(0);
});

test("лишние дробные знаки нормализуются и соответствуют валидности полей", async ({ page }) => {
  await page.goto("/calculator");
  const calc = calculator(page);
  for (const [name, input, expected] of [
    ["Площадь дома", "120.123", "120.1"],
    ["Высота стен", "3.333", "3.3"],
    ["Периметр", "44.444", "44.4"],
  ]) {
    const field = calc.getByRole("spinbutton", { name: new RegExp(name) });
    await field.fill(input);
    await field.blur();
    await expect(field).toHaveValue(expected);
    await expect(field).toHaveAttribute("aria-invalid", "false");
    expect(await field.evaluate((node: HTMLInputElement) => node.validity.valid)).toBe(true);
  }
  await expect(calc.locator(".estimate-total-value")).toBeVisible();
});

test("каркас и сваи показывают соответствующие работы, два этажа включают лестницу", async ({
  page,
}) => {
  await page.goto("/calculator");
  const calc = calculator(page);
  for (const [name, value] of [
    ["Материал стен", "Каркас"],
    ["Тип фундамента", "Свайный"],
  ]) {
    await calc.getByRole("combobox", { name, exact: true }).click();
    await page.getByRole("option", { name: value, exact: true }).click();
  }
  await calc.getByRole("button", { name: "2 этажа", exact: true }).click();
  await calc.getByRole("button", { name: /Из чего складывается цена/ }).click();
  await calc
    .locator(".estimate-stage")
    .filter({ hasText: "Коробка дома" })
    .getByRole("button")
    .first()
    .click();
  await expect(calc.locator(".estimate-breakdown")).toContainText("Сборка силового каркаса");
  await expect(calc.locator(".estimate-breakdown")).toContainText("Межэтажная лестница");
  await expect(calc.locator(".estimate-breakdown")).toContainText("Свайные опоры");
  await expect(calc.locator(".estimate-breakdown")).not.toContainText("Кладочный раствор");
});

test("старый ответ заявки не стирает подтверждение нового расчёта", async ({ page }) => {
  let first: import("@playwright/test").Route | undefined;
  let resolveFirst!: () => void;
  const firstReceived = new Promise<void>((resolve) => {
    resolveFirst = resolve;
  });
  let count = 0;
  await page.route("**/rest/v1/rpc/submit_demo_request", async (route) => {
    if (++count === 1) {
      first = route;
      resolveFirst();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"',
    });
  });
  await page.goto("/calculator");
  const calc = calculator(page);
  await calc.getByRole("button", { name: "Отправить тестовую заявку", exact: true }).click();
  await firstReceived;
  await calc.getByRole("spinbutton", { name: /Площадь дома/ }).fill("140");
  await calc.getByRole("button", { name: "Отправить тестовую заявку", exact: true }).click();
  await expect(calc.locator(".estimate-request-card")).toContainText("Номер: bbbbbbbb");
  const response = page.waitForResponse((result) => result.url().includes("submit_demo_request"));
  await first!.fulfill({
    status: 200,
    contentType: "application/json",
    body: '"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"',
  });
  await response;
  await expect(calc.locator(".estimate-request-card")).toContainText("Номер: bbbbbbbb");
  await expect(
    calc.getByRole("button", { name: "Тестовая заявка отправлена", exact: true }),
  ).toBeDisabled();
  await calc.getByRole("button", { name: "Сбросить", exact: true }).click();
  await expect(calc.locator(".estimate-request-card")).toContainText("Номер: aaaaaaaa");
});
