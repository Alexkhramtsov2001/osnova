import { expect, test, type Locator } from "@playwright/test";

async function box(locator: Locator) {
  const dimensions = await locator.boundingBox();
  expect(dimensions).not.toBeNull();
  return dimensions!;
}

for (const width of [390, 1440]) {
  test(`кнопки главной находятся внизу своих секций при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const hero = await box(page.locator(".hero"));
    const heroImage = await box(page.locator(".hero-visual"));
    const heroHeading = await box(page.locator(".hero h1"));
    const heroActions = await box(page.locator(".hero-actions"));
    expect(heroActions.y).toBeGreaterThanOrEqual(heroImage.y + heroImage.height - 1);
    expect(heroActions.y).toBeGreaterThanOrEqual(heroHeading.y + heroHeading.height - 1);
    expect(heroActions.y + heroActions.height).toBeLessThanOrEqual(hero.y + hero.height + 1);

    const popularCards = await box(page.locator(".home-popular .project-grid"));
    const popularActions = await box(page.locator(".home-project-actions"));
    expect(popularActions.y).toBeGreaterThanOrEqual(popularCards.y + popularCards.height - 1);
    const popularLinks = page.locator(".home-project-actions a.button");
    await expect(popularLinks).toHaveCount(2);
    await expect(popularLinks.nth(0)).toHaveAttribute("href", "/projects");
    await expect(popularLinks.nth(1)).toHaveAttribute("href", "/find-home");

    for (const [sectionSelector, headingSelector] of [
      [".calculator-promo", ".calculator-promo h2"],
      [".final-cta", ".final-cta h2"],
    ]) {
      const section = await box(page.locator(sectionSelector));
      const heading = await box(page.locator(headingSelector));
      const button = await box(page.locator(`${sectionSelector} > a.button`));
      expect(button.y).toBeGreaterThanOrEqual(heading.y + heading.height - 1);
      expect(button.y + button.height).toBeLessThanOrEqual(section.y + section.height + 1);
      expect(button.x).toBeGreaterThanOrEqual(section.x - 1);
      expect(button.x + button.width).toBeLessThanOrEqual(section.x + section.width + 1);
    }
  });
}
