import { expect, test } from "@playwright/test";

for (const width of [320, 1440]) {
  test(`демо-блок доверия прозрачен и ведёт к проверке выбора при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const trust = page.locator(".trust-section");
    await expect(trust).toContainText("нет подтверждённой статистики клиентов");
    await expect(trust.locator(".trust-metric")).toHaveCount(2);
    await expect(trust.locator(".trust-metric-tag")).toHaveText([
      "УЧЕБНЫЙ ПРИМЕР · НЕ ФАКТИЧЕСКИЙ РЕЗУЛЬТАТ",
      "УЧЕБНЫЙ ПРИМЕР · НЕ ФАКТИЧЕСКИЙ РЕЗУЛЬТАТ",
    ]);
    await expect(trust.locator(".review-card-top")).toContainText([
      "ВЫМЫШЛЕННЫЙ ОТЗЫВ",
      "ВЫМЫШЛЕННЫЙ ОТЗЫВ",
      "ВЫМЫШЛЕННЫЙ ОТЗЫВ",
    ]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );

    await trust.getByRole("link", { name: "Открыть калькулятор" }).click();
    await expect(page).toHaveURL(/\/calculator$/);
    await expect(page.getByRole("spinbutton", { name: /Площадь дома/ })).toBeVisible();
  });
}
