import { expect, test } from "@playwright/test";

for (const width of [1440, 768, 390]) {
  test(`контентные страницы и общие компоненты при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/projects/01",
      "/find-home",
      "/about",
      "/partners",
      "/vacancies",
      "/contacts",
      ...["cash-full", "cash-stages", "credit", "mortgage"].map(
        (slug) => `/payment/methods/${slug}`,
      ),
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      expect(
        await page
          .locator(".site-footer > p")
          .evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
      ).toBeGreaterThanOrEqual(13);
    }
    if (width < 1150) {
      await page.getByRole("button", { name: "Открыть меню", exact: true }).click();
      const nav = page.getByRole("navigation", { name: "Мобильная навигация" });
      await expect(nav).toBeVisible();
      await nav.getByRole("link", { name: "Контакты", exact: true }).click();
      await expect(nav).toHaveCount(0);
    }
    await page.goto("/contacts");
    const input = page.getByLabel("Имя", { exact: true });
    await input.focus();
    await expect(input).toBeFocused();
    await expect(input).toHaveCSS("border-radius", "8px");
    await expect(input).toHaveCSS("outline-style", "solid");
  });
}

test("описания в таблице сравнения раскрываются с клавиатуры", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/compare?projects=01,02,03");
  const details = page.locator(".comparison-character-details").first();
  await expect(details).not.toHaveAttribute("open");
  await expect(details.locator(".project-pitch")).toBeHidden();
  await details.locator("summary").focus();
  await details.locator("summary").press("Enter");
  await expect(details.locator(".project-pitch")).toBeVisible();
  await details.locator("summary").press("Enter");
  await expect(details.locator(".project-pitch")).toBeHidden();
  await page.getByRole("button", { name: "Прокрутить таблицу вправо", exact: true }).click();
  await expect
    .poll(() => page.locator(".comparison-table-scroll").evaluate((e) => e.scrollLeft))
    .toBeGreaterThan(0);
});
