import { expect, test } from "./authenticated-test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const routes = [
  ["home", "/"],
  ["projects", "/projects"],
  ["project", "/projects/01"],
  ["compare", "/compare?projects=01,02,03"],
  ["finder", "/find-home"],
  ["calculator", "/calculator"],
  ["account", "/account"],
  ["payment", "/payment"],
  ["payment-method", "/payment/methods/cash-full"],
  ["about", "/about"],
  ["partners", "/partners"],
  ["vacancies", "/vacancies"],
  ["contacts", "/contacts"],
];
for (const width of [1440, 768, 390]) {
  test(`заголовки и единый ритм 13 шаблонов при ${width}px`, async ({ page }, info) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    const folder = process.env.OSNOVA_LAYOUT_SCREENSHOTS;
    if (folder) await mkdir(folder, { recursive: true });
    const output = (name: string) => (folder ? join(folder, name) : info.outputPath(name));
    const inset = width <= 760 ? 16 : 24,
      pageSpace = width <= 760 ? 32 : 48;
    for (const [name, route] of routes) {
      await page.goto(route);
      await page.evaluate(() =>
        Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 3000))]),
      );
      await expect(page.locator("main h1")).toHaveCount(1);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(
        page.locator(
          "main .eyebrow:not(.hero-tagline), main .estimate-eyebrow, main .estimate-overline, main .payment-overline",
        ),
      ).toHaveCount(0);
      const sections = await page
        .locator("main:not(.project-detail):not(.comparison-page) > .section-wrap")
        .evaluateAll((nodes) =>
          nodes.map((n) => ({
            first: n.matches(":first-child"),
            last: n.matches(":last-child"),
            top: parseFloat(getComputedStyle(n).paddingTop),
            bottom: parseFloat(getComputedStyle(n).paddingBottom),
          })),
        );
      for (const section of sections) {
        expect(section.top, `${route}: section top`).toBe(section.first ? pageSpace : inset);
        expect(section.bottom, `${route}: section bottom`).toBe(section.last ? pageSpace : inset);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        route,
      ).toBe(true);
      await expect(page.locator(".footer-brand")).toHaveJSProperty("tagName", "DIV");
      await expect(page.locator(".footer-brand a, .footer-brand button")).toHaveCount(0);
      await page.screenshot({ path: output(`${name}-${width}.png`) });
      if (name === "projects") {
        await expect(page.locator(".catalog-account-link")).toHaveCount(0);
        await expect(page.getByRole("button", { name: /Избранное/ })).toBeVisible();
      }
      if (name === "about") {
        await expect(page.locator(".stat-grid, .team-achievement")).toHaveCount(0);
        await expect(page.locator(".company-principles .principle-number")).toHaveText([
          "01",
          "02",
          "03",
          "04",
        ]);
        if (width > 760) {
          const delta = await page
            .locator(".company-hero")
            .evaluate(
              (node) =>
                node.querySelector("h1")!.getBoundingClientRect().top -
                node.querySelector("img")!.getBoundingClientRect().top,
            );
          expect(delta).toBeCloseTo(0, 0);
        }
        const dividers = page.locator(".company-principles article");
        await expect(dividers.nth(1)).toHaveCSS(
          width > 560 ? "border-left-width" : "border-top-width",
          "1px",
        );
        await expect(page.locator(".team-bio").first()).toHaveCSS("margin-bottom", "0px");
        await page.screenshot({ path: output(`about-full-${width}.png`), fullPage: true });
        await page
          .locator(".company-principles")
          .screenshot({ path: output(`principles-${width}.png`) });
        await page
          .locator(".team-card")
          .first()
          .screenshot({ path: output(`team-card-${width}.png`) });
      }
      if (name === "home") {
        await expect(page.locator(".hero-tagline")).toHaveText("СТРОИТЕЛЬСТВО ЗАГОРОДНЫХ ДОМОВ");
        const ctaGap = await page
          .locator(".final-cta")
          .evaluate(
            (node) =>
              node.querySelector(".button")!.getBoundingClientRect().top -
              node.querySelector("h2")!.getBoundingClientRect().bottom,
          );
        expect(ctaGap).toBeCloseTo(32, 0);
        await page.locator(".final-cta").screenshot({ path: output(`final-cta-${width}.png`) });
        const reviews = page.locator(".testimonials");
        await expect(
          reviews.getByRole("heading", { name: "Отзывы о нашей компании" }),
        ).toBeVisible();
        const sizes = await reviews.getByRole("heading").evaluate((n) => ({
          font: parseFloat(getComputedStyle(n).fontSize),
          top: parseFloat(getComputedStyle(n).marginTop),
        }));
        expect(sizes.font).toBeGreaterThanOrEqual(30);
        expect(sizes.top).toBe(0);
        await expect(reviews).toContainText("Все отзывы демонстрационные и вымышленные");
        await expect(page.locator(".principle-grid small")).toHaveCount(0);
        await page.screenshot({ path: output(`home-full-${width}.png`), fullPage: true });
        await page
          .locator(".approach-section")
          .screenshot({ path: output(`approach-${width}.png`) });
        await reviews.screenshot({ path: output(`reviews-${width}.png`) });
      }
    }
  });
}

test("учебный вход и выбор проекта сохраняют пояснения и действия без надписей над заголовками", async ({
  browser,
  baseURL,
}, info) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  try {
    await page.goto("/calculator?project=01");
    await expect(page.getByRole("link", { name: "Зарегистрироваться", exact: true })).toBeVisible();
    await expect(page.locator(".demo-access-gate")).toContainText("Учебный вход");
    await expect(page.locator(".eyebrow")).toHaveCount(0);
    await page.goto("/account");
    await expect(page.locator(".account-auth-card")).toBeVisible();
    await expect(page.locator(".eyebrow")).toHaveCount(0);
    await page.screenshot({ path: info.outputPath("account-guest.png"), fullPage: true });
  } finally {
    await context.close();
  }
});
