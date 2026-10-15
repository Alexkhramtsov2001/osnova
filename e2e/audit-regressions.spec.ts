import { expect, test } from "@playwright/test";

test("незавершённый и недопустимый числовой ввод не ломает страницу", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/calculator");
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  for (const field of [
    { name: /Площадь дома/, valid: "118", invalid: ["", "0", "29", "1001"] },
    { name: /Высота стен/, valid: "3.1", invalid: ["", "2.3", "5.1"] },
    { name: /Периметр/, valid: "44", invalid: ["", "9", "201"] },
  ]) {
    const input = calculator.getByRole("spinbutton", { name: field.name });
    for (const value of field.invalid) {
      await input.fill(value);
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(calculator.getByRole("alert")).toBeVisible();
      await expect(calculator.locator(".estimate-total-value")).toHaveCount(0);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await input.fill(field.valid);
      await expect(input).toHaveAttribute("aria-invalid", "false");
      await expect(calculator.getByRole("alert")).toHaveCount(0);
      await expect(calculator.locator(".estimate-total-value")).toBeVisible();
    }
  }
  await calculator.getByRole("spinbutton", { name: /Площадь дома/ }).fill("");
  await calculator.getByRole("button", { name: "Сбросить", exact: true }).click();
  await expect(calculator.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("120");
  expect(errors).toEqual([]);
});

test("избранное, пустая выдача и адаптивная компоновка", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  const favorite = page.getByRole("button", { name: "Добавить в избранное: Север", exact: true });
  const cardImage = page.locator("#project-02 .project-image-wrap");
  const favoriteBox = await favorite.boundingBox();
  const imageBox = await cardImage.boundingBox();
  expect(favoriteBox).not.toBeNull();
  expect(imageBox).not.toBeNull();
  expect(Math.abs(favoriteBox!.width - favoriteBox!.height)).toBeLessThan(1);
  expect(favoriteBox!.x).toBeGreaterThanOrEqual(imageBox!.x);
  expect(favoriteBox!.x + favoriteBox!.width).toBeLessThan(imageBox!.x + imageBox!.width);
  expect(favoriteBox!.y).toBeGreaterThanOrEqual(imageBox!.y);
  expect(favoriteBox!.y + favoriteBox!.height).toBeLessThan(imageBox!.y + imageBox!.height);
  await favorite.click();
  await page.getByRole("button", { name: "Избранное (1)" }).click();
  await expect(page.locator(".project-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Убрать из избранного: Север", exact: true }).click();
  await expect(page.locator(".projects-empty")).toContainText("В избранном пока пусто");
  await page.getByRole("button", { name: "Избранное (0)" }).click();
  await expect(page.locator(".project-card")).toHaveCount(8);
  await page
    .getByRole("link", { name: "Рассчитать стоимость проекта Скандинавия", exact: true })
    .click();
  const area = page.getByRole("spinbutton", { name: /Площадь дома/ });
  expect(await area.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(true);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    for (const selector of [".estimate-settings", ".estimate-results"]) {
      const box = await page.locator(selector).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1);
    }
    if (width === 1440) {
      const settings = await page.locator(".estimate-settings").boundingBox();
      const results = await page.locator(".estimate-results").boundingBox();
      expect(results!.x).toBeGreaterThan(settings!.x + settings!.width);
    }
  }
});
