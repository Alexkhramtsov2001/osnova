import { expect, test } from "@playwright/test";

test("демо-заявка отправляет параметры без контактов и показывает подтверждение", async ({
  page,
}) => {
  let payload: Record<string, unknown> | null = null;
  await page.route("**/rest/v1/rpc/submit_demo_request", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '"7f113886-dc5b-451a-9a79-d9a3a42dfe14"',
    });
  });

  await page.goto("/?project=01#calculator");
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  await calculator.getByRole("button", { name: "Отправить тестовую заявку" }).click();

  await expect(
    calculator.getByRole("status").filter({ hasText: "Тестовая заявка сохранена" }),
  ).toContainText("Номер: 7f113886");
  await expect(
    calculator.getByRole("button", { name: "Тестовая заявка отправлена" }),
  ).toBeDisabled();
  expect(payload).toMatchObject({
    p_project_number: "01",
    p_project_type: "standard",
    p_construction_mode: "turnkey",
    p_data_version: "demo-2026.10.14-2",
  });
  expect(Object.keys(payload!)).toEqual([
    "p_client_request_id",
    "p_project_number",
    "p_project_type",
    "p_region",
    "p_area",
    "p_construction_mode",
    "p_stage_ids",
    "p_estimate_total",
    "p_data_version",
  ]);
});

test("после ошибки демо-заявку можно повторить с тем же UUID", async ({ page }) => {
  const requestIds: string[] = [];
  await page.route("**/rest/v1/rpc/submit_demo_request", async (route) => {
    requestIds.push(route.request().postDataJSON().p_client_request_id);
    if (requestIds.length === 1) {
      await route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: '"7f113886-dc5b-451a-9a79-d9a3a42dfe14"',
      });
    }
  });

  await page.goto("/#calculator");
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  await calculator.getByRole("button", { name: "Отправить тестовую заявку" }).click();
  await expect(calculator.getByRole("alert")).toContainText("Не удалось сохранить");
  await calculator.getByRole("button", { name: "Отправить тестовую заявку" }).click();
  await expect(calculator.getByRole("status")).toContainText("Номер: 7f113886");
  expect(requestIds).toHaveLength(2);
  expect(requestIds[0]).toBe(requestIds[1]);
});
