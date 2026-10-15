import { expect, test } from "@playwright/test";

for (const width of [320, 390, 768, 1024, 1440]) {
  test(`хронология читается без пересечений при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/about");
    const result = await page.locator(".company-timeline").evaluate((timeline) => {
      const cards = Array.from(timeline.querySelectorAll("li"));
      const rects = cards.map((card) => card.getBoundingClientRect());
      const overlaps = rects.some((a, index) =>
        rects
          .slice(index + 1)
          .some(
            (b) =>
              Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
              Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1,
          ),
      );
      const textOutside = cards.some((card, index) =>
        Array.from(card.querySelectorAll("span,h3,dt,dd")).some((child) => {
          const rect = child.getBoundingClientRect();
          const parent = rects[index];
          return (
            rect.left < parent.left - 1 ||
            rect.right > parent.right + 1 ||
            rect.top < parent.top - 1 ||
            rect.bottom > parent.bottom + 1
          );
        }),
      );
      return {
        count: cards.length,
        overlaps,
        textOutside,
        oneColumn: rects.every((rect) => Math.abs(rect.left - rects[0].left) < 1),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    expect(result.count).toBe(6);
    expect(result.overlaps).toBe(false);
    expect(result.textOutside).toBe(false);
    expect(result.overflow).toBe(false);
    if (width <= 768) expect(result.oneColumn).toBe(true);
  });
}

for (const width of [1920, 2560, 3440]) {
  test(`подвал ограничен и читаем при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/partners");
    const result = await page.locator(".site-footer").evaluate((footer) => {
      const rect = footer.getBoundingClientRect();
      const nav = footer.querySelector("nav");
      const links = Array.from(nav?.querySelectorAll("a") ?? []);
      const boxes = links.map((link) => link.getBoundingClientRect());
      const overlap = boxes.some((a, index) =>
        boxes
          .slice(index + 1)
          .some(
            (b) =>
              Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
              Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1,
          ),
      );
      return {
        width: rect.width,
        centered: Math.abs(rect.left - (innerWidth - rect.width) / 2) < 1,
        navFont: Number.parseFloat(getComputedStyle(nav!).fontSize),
        captionFont: Number.parseFloat(getComputedStyle(footer.querySelector("p")!).fontSize),
        overlap,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    expect(result.width).toBeLessThanOrEqual(1440);
    expect(result.centered).toBe(true);
    expect(result.navFont).toBeGreaterThanOrEqual(14);
    expect(result.captionFont).toBeGreaterThanOrEqual(12);
    expect(result.overlap).toBe(false);
    expect(result.overflow).toBe(false);
  });
}

test("короткий мобильный экран позволяет прокрутить всё меню", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 520 });
  await page.goto("/about");
  await page.getByRole("button", { name: "Открыть меню" }).click();
  const nav = page.getByRole("navigation", { name: "Мобильная навигация" });
  await nav.getByRole("link", { name: "Личный кабинет" }).scrollIntoViewIfNeeded();
  await expect(nav.getByRole("link", { name: "Личный кабинет" })).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(nav).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});
