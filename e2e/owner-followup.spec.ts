import { expect, test } from "@playwright/test";

for (const [width, height] of [
  [1440, 1000],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [375, 812],
]) {
  // Approved shared rhythm: 48 px between sections/on page edges, 32 px on phones.
  const pageSpace = width <= 760 ? 32 : 48;
  const sectionInset = pageSpace / 2;
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
    expect(gap).toBeCloseTo(pageSpace, 0);
    const reviewsGap = await page.evaluate(() => {
      const reviews = document.querySelector(".testimonials")!.getBoundingClientRect();
      const footer = document.querySelector(".site-footer")!.getBoundingClientRect();
      return footer.top - reviews.bottom;
    });
    expect(reviewsGap).toBeCloseTo(pageSpace, 0);
    await expect(page.locator(".trust-section")).not.toContainText("Перед реальной оплатой");
    await expect(page.locator(".testimonials > p")).toHaveCount(1);
    await expect(page.locator(".hero-note, .hero-bottom")).toHaveCount(0);
    const trustGap = await page.evaluate(() => {
      const metrics = document.querySelector(".trust-metrics")!.getBoundingClientRect();
      const discover = document.querySelector(".home-discover-card")!.getBoundingClientRect();
      return discover.top - metrics.bottom;
    });
    expect(trustGap).toBeCloseTo(pageSpace, 0);
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
      const reframed = id === "01" || id === "07";
      await expect(image).toHaveCSS("object-fit", reframed ? "cover" : "contain");
      await expect
        .poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
      const difference = await image.evaluate((node, reframed) => {
        const image = node as HTMLImageElement;
        const ratio = reframed ? 3 / 2 : image.naturalWidth / image.naturalHeight;
        return Math.abs(image.width / image.height - ratio);
      }, reframed);
      expect(difference).toBeLessThan(0.01);
      await noOverflow();
    }
    await page.goto("/account");
    await expect(page.locator(".account-page")).toHaveCSS("padding-bottom", `${pageSpace}px`);
    await noOverflow();
    await page.evaluate(() => sessionStorage.setItem("osnova.demo-session.v1", "active:google"));
    await page.reload();
    await expect(page.getByRole("button", { name: "Выйти из демо", exact: true })).toBeVisible();
    await expect(page.locator(".account-page")).toHaveCSS("padding-bottom", `${pageSpace}px`);
    await noOverflow();
    await page.goto("/about");
    const offices = page.locator(".demo-offices");
    await expect(offices.locator(".demo-office-grid > li")).toHaveCount(11);
    await expect(offices).toHaveCSS("padding-top", `${sectionInset}px`);
    await expect(page.locator(".content-section:has(+ .demo-offices)")).toHaveCSS(
      "padding-bottom",
      `${sectionInset}px`,
    );
    await expect(page.locator(".demo-offices + .content-section")).toHaveCSS(
      "padding-top",
      `${sectionInset}px`,
    );
    await noOverflow();
    await page.goto("/vacancies");
    const count = await page.locator(".vacancy-card").count();
    const more = page.getByRole("button", { name: "Показать ещё", exact: true });
    await expect(page.locator(".vacancies-section")).toHaveCSS(
      "padding-bottom",
      `${sectionInset}px`,
    );
    await expect(page.locator(".vacancy-follow")).toHaveCSS("padding-top", `${sectionInset}px`);
    await more.click();
    await expect(page.locator(".vacancy-card")).toHaveCount(count + 10);
    const followGap = await page.evaluate(() => {
      const more = document.querySelector(".vacancy-more")!.getBoundingClientRect();
      const follow = document.querySelector(".vacancy-follow")!.getBoundingClientRect();
      return follow.top - more.bottom;
    });
    expect(followGap).toBeCloseTo(sectionInset, 0);
    await noOverflow();
  });

  test(`нижний отступ оплаты и соседних страниц при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const footerGap = async (selector: string) =>
      page.locator(selector).evaluate((node) => {
        const footer = document.querySelector(".site-footer")!.getBoundingClientRect();
        return footer.top - node.getBoundingClientRect().bottom;
      });
    const noOverflow = async () =>
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    await page.goto("/payment");
    expect(await footerGap(".payment-empty")).toBeCloseTo(pageSpace, 0);
    await noOverflow();
    await page.goto("/calculator");
    await page.getByRole("link", { name: "Оплатить (демо)", exact: true }).click();
    await expect(page.locator(".demo-access-gate")).toBeVisible();
    expect(await footerGap(".demo-access-actions")).toBeCloseTo(pageSpace, 0);
    await page.evaluate(() => sessionStorage.setItem("osnova.demo-session.v1", "active:google"));
    await page.reload();
    for (const name of [/Наличными полностью/, /^Ипотека/]) {
      await page.getByRole("radio", { name }).check();
      expect(await footerGap(".payment-checkout-layout")).toBeCloseTo(pageSpace, 0);
      await expect(page.locator(".payment-method-grid .payment-method-card")).toHaveCount(4);
      await noOverflow();
    }
    for (const route of ["/compare", "/compare?projects=01,07,08", "/find-home"]) {
      await page.goto(route);
      const padding = await page
        .locator("main")
        .evaluate((node) => getComputedStyle(node).paddingBottom);
      expect(padding).toBe(`${pageSpace}px`);
      await noOverflow();
    }
  });
}
