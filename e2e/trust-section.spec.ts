import { expect, test } from "@playwright/test";

for (const width of [390, 1440]) {
  test(`вымышленные отзывы доступны без анимации при ${width}px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const trust = page.locator(".trust-section");
    await expect(trust).toContainText("нет подтверждённой статистики клиентов");
    await expect(trust.locator(".trust-metric")).toHaveCount(2);
    const reviews = page.locator(".testimonials");
    await expect(reviews).toContainText("Все отзывы демонстрационные и вымышленные");
    await expect(reviews.getByRole("link")).toHaveCount(0);
    await expect(reviews.locator(".testimonials-track")).toHaveCSS("animation-name", "none");
    const cards = reviews.locator(".testimonials-group").first().locator(".testimonial-card");
    await expect(cards).toHaveCount(12);
    await expect(cards.getByRole("img", { name: "Пять из пяти звёзд" })).toHaveCount(12);
    const viewport = reviews.getByRole("region");
    await viewport.focus();
    for (let index = 0; index < 12; index++) {
      await page.keyboard.press("Tab");
      await expect(cards.nth(index)).toBeFocused();
    }
    await expect(cards.last()).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test("лента движется бесшовно, останавливается при наведении и фокусе", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  const viewport = page.locator(".testimonials-viewport");
  const track = page.locator(".testimonials-track");
  await viewport.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  const geometry = await track.evaluate((node) => {
    const groups = [...node.children] as HTMLElement[];
    const animation = node.getAnimations()[0];
    const timing = animation.effect!.getTiming();
    animation.pause();
    const duration = Number(timing.duration);
    animation.currentTime = duration - 1;
    const seamBefore = groups[1].getBoundingClientRect().left;
    animation.currentTime = duration + 1;
    const seamAfter = groups[0].getBoundingClientRect().left;
    animation.play();
    return {
      equalText: groups[0].textContent === groups[1].textContent,
      widths: groups.map((group) => group.getBoundingClientRect().width),
      seamDelta: Math.abs(seamAfter - seamBefore),
      iterations: timing.iterations,
      easing: timing.easing,
    };
  });
  expect(geometry.equalText).toBe(true);
  expect(Math.abs(geometry.widths[0] - geometry.widths[1])).toBeLessThan(0.01);
  expect(geometry.seamDelta).toBeLessThan(1);
  expect(geometry.iterations).toBe(Infinity);
  expect(geometry.easing).toBe("linear");
  const position = () => track.evaluate((node) => getComputedStyle(node).transform);
  const initial = await position();
  await expect.poll(position).not.toBe(initial);
  await viewport.hover();
  await expect(track).toHaveCSS("animation-play-state", "paused");
  await viewport.focus();
  await expect(track).toHaveCSS("animation-name", "none");
  await expect(page.locator('.testimonials-group[aria-hidden="true"]')).toBeHidden();
  for (let index = 0; index < 12; index++) await page.keyboard.press("Tab");
  const last = page.locator(".testimonials-group").first().locator(".testimonial-card").last();
  await expect(last).toBeFocused();
  await expect
    .poll(() =>
      last.evaluate((node) => {
        const card = node.getBoundingClientRect();
        const region = node.closest(".testimonials-viewport")!.getBoundingClientRect();
        return card.left >= region.left - 1 && card.right <= region.right + 1;
      }),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Пауза отзывов", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Продолжить движение", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});
