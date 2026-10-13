import { expect, test } from "@playwright/test";

test("демо-чат сохраняет только код темы и показывает готовый ответ", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let payload: Record<string, unknown> | undefined;
  await page.route("**/rest/v1/rpc/submit_demo_chat_turn", async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: '"saved-turn"' });
  });

  await page.goto("/#contacts");
  const chat = page.getByRole("group", { name: "Чат о проекте" });
  await chat.getByRole("button", { name: "Как выбрать проект?" }).click();
  await expect(chat.getByText("Добавьте понравившиеся концепты", { exact: false })).toBeVisible();
  expect(payload?.p_topic_code).toBe("choose_project");
  expect(Object.keys(payload ?? {}).sort()).toEqual(["p_client_turn_id", "p_topic_code"]);
  expect(payload?.p_client_turn_id).toMatch(/^[0-9a-f-]{36}$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("после ошибки повторяет тот же запрос и не показывает ответ до сохранения", async ({
  page,
}) => {
  const requests: Record<string, unknown>[] = [];
  await page.route("**/rest/v1/rpc/submit_demo_chat_turn", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: requests.length === 1 ? 503 : 200,
      contentType: "application/json",
      body: requests.length === 1 ? "{}" : '"saved-turn"',
    });
  });
  await page.goto("/#contacts");
  const chat = page.getByRole("group", { name: "Чат о проекте" });
  await chat.getByRole("button", { name: "Что показывает калькулятор?" }).click();
  await expect(chat.getByRole("alert")).toContainText("Не удалось сохранить тему");
  await expect(chat.getByText("Калькулятор показывает примерный", { exact: false })).toHaveCount(0);
  await chat.getByRole("button", { name: "Повторить отправку" }).click();
  await expect(chat.getByText("Калькулятор показывает примерный", { exact: false })).toBeVisible();
  expect(requests[0]).toEqual(requests[1]);
});
