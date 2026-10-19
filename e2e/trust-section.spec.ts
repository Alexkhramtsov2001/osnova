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
    await expect(page.locator("main > :last-child .testimonials")).toHaveCount(1);
    await expect(reviews.getByRole("heading", { level: 2 })).toHaveText("О доме и работе команды");
    expect(
      await page
        .locator(".final-cta")
        .evaluate((node) => Boolean(node.nextElementSibling?.querySelector(".testimonials"))),
    ).toBe(true);
    await expect(reviews).toContainText("Все отзывы демонстрационные и вымышленные");
    await expect(reviews.getByRole("link")).toHaveCount(0);
    await expect(reviews.locator(".testimonials-track")).toHaveCSS("animation-name", "none");
    const cards = reviews.locator(".testimonials-group").first().locator(".testimonial-card");
    await expect(cards).toHaveCount(12);
    await expect(cards.getByRole("img", { name: "Пять из пяти звёзд" })).toHaveCount(12);
    await expect(reviews.getByRole("button")).toHaveCount(0);
    await expect(reviews.getByRole("region")).not.toHaveAttribute("tabindex");
    await expect(cards.locator('[tabindex="0"]')).toHaveCount(0);
    await cards.last().scrollIntoViewIfNeeded();
    await expect(cards.last()).toBeInViewport();
    await expect(reviews.locator('.testimonials-group[aria-hidden="true"]')).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

for (const width of [390, 768, 1440]) {
  test(`лента движется бесшовно без ручного управления при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
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
    await expect(track).toHaveCSS("animation-play-state", "running");
    const hovered = await position();
    await expect.poll(position).not.toBe(hovered);
    await expect(viewport).toHaveCSS("overflow-x", "clip");
    await expect(page.locator(".testimonials").getByRole("button")).toHaveCount(0);
    await expect(viewport.locator("[tabindex]")).toHaveCount(0);
    await viewport.evaluate((node) => {
      node.scrollLeft = 300;
    });
    await page.mouse.wheel(300, 0);
    expect(await viewport.evaluate((node) => node.scrollLeft)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
