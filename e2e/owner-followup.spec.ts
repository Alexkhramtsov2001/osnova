import { expect, test } from "@playwright/test";

for (const [width, height] of [
  [1440, 1000],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [375, 812],
]) {
  test(`ритм страниц и полные фотографии проектов при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const noOverflow = async () =>
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    await page.goto("/");
    const gap = await page.evaluate(() => {
      const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
      return box(".final-cta h2").top - box(".home-discover-card:last-child").bottom;
    });
    expect(gap).toBeLessThanOrEqual(41);
    expect(
      await page
        .locator(".hero-actions")
        .evaluate((node) => node.nextElementSibling?.classList.contains("hero-bottom")),
    ).toBe(true);
    if (width === 1440)
      expect(
        await page
          .locator(".home-popular .project-grid")
          .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length),
      ).toBe(3);
    await noOverflow();
    await page.goto("/projects");
    for (const card of await page.locator(".project-card").all()) {
      await expect(card.locator(".project-info")).toHaveCSS("row-gap", "12px");
      await expect(card.locator(".project-audience")).toHaveCSS("min-height", "0px");
      await expect(card.locator(".project-meta")).toHaveCSS("margin-top", "0px");
    }
    await noOverflow();
    for (const id of ["01", "02", "03", "04", "05", "06", "07", "08"]) {
      await page.goto(`/projects/${id}`);
      const image = page.locator(".project-detail-image");
      await expect(image).toHaveCSS("object-fit", "contain");
      await expect
        .poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
      const difference = await image.evaluate((node) => {
        const image = node as HTMLImageElement;
        return Math.abs(image.width / image.height - image.naturalWidth / image.naturalHeight);
      });
      expect(difference).toBeLessThan(0.01);
      await noOverflow();
    }
    await page.goto("/account");
    await expect(page.locator(".account-page")).toHaveCSS("padding-bottom", "32px");
    await noOverflow();
    await page.evaluate(() => sessionStorage.setItem("osnova.demo-session.v1", "active:google"));
    await page.reload();
    await expect(page.getByRole("button", { name: "Выйти из демо", exact: true })).toBeVisible();
    await expect(page.locator(".account-page")).toHaveCSS("padding-bottom", "32px");
    await noOverflow();
    await page.goto("/about");
    const offices = page.locator(".demo-offices");
    await expect(offices.locator(".demo-office-grid > li")).toHaveCount(11);
    await expect(offices).toHaveCSS("padding-top", "16px");
    await expect(page.locator(".content-section:has(+ .demo-offices)")).toHaveCSS(
      "padding-bottom",
      "16px",
    );
    await noOverflow();
    await page.goto("/vacancies");
    const count = await page.locator(".vacancy-card").count();
    const more = page.getByRole("button", { name: "Показать ещё", exact: true });
    await expect(page.locator(".vacancies-section")).toHaveCSS("padding-bottom", "16px");
    await expect(page.locator(".vacancy-follow")).toHaveCSS("padding-top", "24px");
    await more.click();
    await expect(page.locator(".vacancy-card")).toHaveCount(count + 10);
    const moreBox = (await more.boundingBox())!;
    const follow = (await page.locator(".vacancy-follow").boundingBox())!;
    expect(follow.y - moreBox.y - moreBox.height).toBeLessThanOrEqual(17);
    await noOverflow();
  });
}
