import { expect, test } from "@playwright/test";

test("кнопка подбора открывает опросник в текущей вкладке", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Подобрать свой дом" }).click();
  await expect(page).toHaveURL(/\/find-home$/);
  await expect(page.getByRole("heading", { name: "Найдём дом под ваш ритм жизни" })).toBeVisible();
});

test("опрос показывает семь шагов и ровно четыре ответа на каждом", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/find-home");
  for (let step = 0; step < 7; step += 1) {
    await expect(page.getByText(`Вопрос ${step + 1} из 7`)).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(4);
    await page.getByRole("radio").nth(0).check();
    await page
      .getByRole("button", { name: step === 6 ? "Показать мой дом" : "Продолжить" })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: /Дом, с которого стоит начать|Создайте свой вариант дома/ }),
  ).toBeVisible();
  if (await page.getByRole("heading", { name: "Создайте свой вариант дома" }).count()) {
    await expect(page.locator(".finder-no-match").getByRole("link")).toHaveCount(1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("при отсутствии совпадения после седьмого ответа доступен только конфигуратор", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/find-home");
  for (let step = 0; step < 7; step += 1) {
    await expect(page.getByRole("radio")).toHaveCount(4);
    if (step === 0) await page.getByRole("radio", { name: "Жить постоянно, круглый год" }).check();
    else if (step === 1) await page.getByRole("radio", { name: "Пять спален" }).check();
    else {
      const title = await page.locator("fieldset legend").innerText();
      if (title.includes("этажность")) await page.getByRole("radio", { name: "Один этаж" }).check();
      else if (title.includes("размер дома"))
        await page.getByRole("radio", { name: "Просторный — больше 160 м²" }).check();
      else if (title.includes("бюджет"))
        await page.getByRole("radio", { name: "До 9 млн ₽" }).check();
      else await page.getByRole("radio").nth(0).check();
    }
    await page
      .getByRole("button", { name: step === 6 ? "Показать мой дом" : "Продолжить" })
      .click();
  }
  await expect(page.getByRole("heading", { name: "Создайте свой вариант дома" })).toBeVisible();
  await expect(page.locator(".finder-result")).toHaveCount(0);
  await expect(page.locator(".finder-no-match").getByRole("link")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Посмотреть проект" })).toHaveCount(0);
});
