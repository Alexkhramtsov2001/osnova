import { expect, test } from "@playwright/test";

test("бургер-меню открывает разделы и закрывается после выбора", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");
  await page.locator(".home-popular").scrollIntoViewIfNeeded();
  const header = page.locator(".site-header");
  await expect
    .poll(() => header.evaluate((node) => Math.round(node.getBoundingClientRect().top)))
    .toBe(0);
  const toggle = page.getByRole("button", { name: "Открыть меню" });
  await toggle.click();
  const nav = page.getByRole("navigation", { name: "Мобильная навигация" });
  await expect(nav).toBeVisible();
  await expect(page.getByRole("button", { name: "Закрыть меню" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await nav.getByRole("link", { name: "Проекты" }).click();
  await expect(nav).toHaveCount(0);
  await expect(page).toHaveURL(/\/projects$/);
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.getByRole("button", { name: "Закрыть меню" }).press("Escape");
  await expect(nav).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const [width, height] of [
  [1024, 768],
  [768, 1024],
  [390, 844],
  [375, 812],
  [375, 500],
]) {
  test(`меню сохраняет положение и закрытие после десяти циклов при ${width}x${height}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images]
          .filter((img) => !img.loading || img.loading !== "lazy")
          .map((img) => img.decode().catch(() => {})),
      );
    });
    for (let cycle = 0; cycle < 10; cycle++) {
      if (cycle === 6) {
        await page.goto("/projects/02");
        await page
          .locator(".project-detail-image")
          .evaluate((img) => (img as HTMLImageElement).decode());
      }
      if (cycle === 3 || cycle === 8) {
        await page
          .getByRole("button", { name: "Открыть демонстрационный чат", exact: true })
          .click();
        await page.getByRole("button", { name: "Закрыть панель чата", exact: true }).click();
      }
      await page.evaluate(
        (top) => scrollTo({ top, behavior: "instant" }),
        cycle === 0 ? 0 : 900 + cycle * 70,
      );
      const saved = await page.evaluate(() => scrollY);
      const opener = (await page
        .getByRole("button", { name: "Открыть меню", exact: true })
        .boundingBox())!;
      // Click the visible control as a user would, without locator auto-scroll to root scroll-padding.
      await page.mouse.click(opener.x + opener.width / 2, opener.y + opener.height / 2);
      const close = page.getByRole("button", { name: "Закрыть меню", exact: true });
      await expect(close).toBeInViewport();
      const nav = page.getByRole("navigation", { name: "Мобильная навигация" });
      const header = (await page.locator(".site-header").boundingBox())!;
      expect(header.y).toBe(0);
      const locked = await page.evaluate(() => scrollY);
      await page.mouse.move(width / 2, height / 2);
      await page.mouse.wheel(0, 400);
      await nav.evaluate((node) => {
        node.scrollTop = node.scrollHeight;
      });
      await expect(close).toBeInViewport();
      await expect
        .poll(async () => (await nav.boundingBox())!.y)
        .toBeGreaterThanOrEqual(header.height);
      expect(await page.evaluate(() => scrollY)).toBe(locked);
      if (cycle === 0 || cycle === 9)
        await page.screenshot({
          path: info.outputPath(`menu-cycle-${cycle + 1}.png`),
          animations: "disabled",
        });
      if (cycle === 5) {
        await nav.getByRole("link", { name: "Проекты", exact: true }).click();
        await expect(page).toHaveURL(/\/projects$/);
        await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      } else {
        if (cycle % 2) await close.press("Escape");
        else await close.click();
        await expect(nav).toHaveCount(0);
        expect(await page.evaluate(() => scrollY)).toBeCloseTo(saved, 0);
      }
    }
  });
}
