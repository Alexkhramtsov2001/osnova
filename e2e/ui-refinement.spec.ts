import { expect, test } from "./authenticated-test";
import { projects } from "../src/features/projects/catalog";
import { getProjectFloorPlans } from "../src/features/projects/floorPlans";

const sizes = [
  [1440, 1000],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [375, 812],
  [375, 500],
];
for (const [width, height] of sizes) {
  test(`помещения, этажи и ритм проектов при ${width}x${height}`, async ({ page }, info) => {
    test.setTimeout(90000);
    await page.setViewportSize({ width, height });
    for (const project of projects) {
      await page.goto(`/projects/${project.number}`);
      await page
        .locator(".project-detail-image")
        .evaluate((img) => (img as HTMLImageElement).decode());
      await page.evaluate(() => document.fonts.ready);
      const toggle = page.getByRole("button", { name: "Помещения на этаже", exact: true });
      const panel = page.locator("#floor-plan-rooms-panel");
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(panel).toHaveAttribute("inert", "");
      await toggle.scrollIntoViewIfNeeded();
      if (project.number === "02")
        await page.screenshot({ path: info.outputPath("rooms-closed.png") });
      await toggle.focus();
      await page.keyboard.press("Enter");
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(panel).not.toHaveAttribute("inert");
      for (const plan of getProjectFloorPlans(project)) {
        if (plan.floor > 1)
          await page.getByRole("button", { name: "Следующий этаж", exact: true }).click();
        await expect(panel.locator("li")).toHaveText([...plan.rooms]);
        if (project.number === "02")
          await page.locator(".floor-plan-disclosure").screenshot({
            path: info.outputPath(`rooms-floor-${plan.floor}.png`),
            animations: "disabled",
          });
      }
      const box = (await page.locator(".floor-plan-disclosure").boundingBox())!;
      expect(box.x + box.width / 2).toBeCloseTo(width / 2, 0);
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await page.locator(".floor-plan-stage").click();
      await expect(page.locator(".image-viewer")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator(".floor-plan-stage")).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const contactGap = await page
        .locator(".contact-section-head")
        .evaluate(
          (node) =>
            node.getBoundingClientRect().top -
            document.querySelector(".project-detail-price")!.getBoundingClientRect().bottom,
        );
      expect(contactGap).toBeGreaterThanOrEqual(32);
      expect(contactGap).toBeLessThanOrEqual(57);
      await page.screenshot({
        path: info.outputPath(`${project.number}-project-full.png`),
        fullPage: true,
        animations: "disabled",
      });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("button", { name: "Помещения на этаже", exact: true }).click();
    const duration = await page
      .locator(".floor-plan-rooms-panel")
      .evaluate((node) => parseFloat(getComputedStyle(node).transitionDuration));
    expect(duration).toBeLessThan(0.01);
  });

  test(`CTA, пять действий калькулятора и чат при ${width}x${height}`, async ({ page }, info) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height });
    await page.route("**/rest/v1/rpc/submit_demo_request", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: '"7f113886-dc5b-451a-9a79-d9a3a42dfe14"',
      }),
    );
    await page.goto("/projects");
    const finder = page.locator(".house-finder-link");
    await finder.scrollIntoViewIfNeeded();
    const box = (await finder.boundingBox())!;
    expect(box.x + box.width / 2).toBeCloseTo(width / 2, 0);
    expect(box.height).toBeGreaterThanOrEqual(56);
    if (width >= 1151) expect(box.width).toBeGreaterThanOrEqual(320);
    await page.screenshot({ path: info.outputPath("catalog-cta.png") });
    await finder.click();
    await expect(page).toHaveURL(/\/find-home$/);
    await page.goto("/");
    await page
      .locator(".home-project-actions")
      .screenshot({ path: info.outputPath("home-cta.png") });
    await page.goto("/calculator?project=02");
    const controls = [
      ".estimate-demo-submit",
      ".estimate-request-toggle",
      ".estimate-save-button",
      ".estimate-payment-link",
      ".estimate-pdf-actions > button",
    ];
    if (width <= 600) {
      const boxes = [];
      for (const selector of controls) {
        const button = page.locator(selector);
        await button.scrollIntoViewIfNeeded();
        const b = (await button.boundingBox())!;
        boxes.push(b);
        expect(b.x + b.width / 2).toBeCloseTo(width / 2, 0);
        expect(b.height).toBe(56);
      }
      for (const b of boxes) expect(b.width).toBeCloseTo(boxes[0].width, 0);
    }
    await page
      .locator(".estimate-request-card")
      .screenshot({ path: info.outputPath("calculator-request.png") });
    await page
      .locator(".estimate-next-actions")
      .screenshot({ path: info.outputPath("calculator-next.png") });
    await page.locator(".estimate-request-toggle").click();
    await expect(page.locator(".estimate-request-toggle")).toHaveAttribute("aria-expanded", "true");
    await page.locator(".estimate-save-button").click();
    await expect(
      page.getByRole("status").filter({ hasText: "Расчёт сохранён на этом устройстве" }),
    ).toBeVisible();
    await page.locator(".estimate-demo-submit").click();
    await expect(
      page.getByRole("button", { name: "Тестовая заявка отправлена", exact: true }),
    ).toBeDisabled();
    const download = page.waitForEvent("download");
    await page.locator(".estimate-pdf-actions > button").click();
    expect((await download).suggestedFilename()).toMatch(/\.pdf$/);
    await page.locator(".estimate-payment-link").click();
    await expect(page).toHaveURL(/\/payment/);
    await expect(page.locator("#payment-checkout")).toBeVisible();
    await page.goto("/projects/02");
    const launcher = page.getByRole("button", {
      name: "Открыть демонстрационный чат",
      exact: true,
    });
    const fixed = (await launcher.boundingBox())!;
    await page.evaluate(() => scrollTo({ top: 1500, behavior: "instant" }));
    expect((await launcher.boundingBox())!.y).toBe(fixed.y);
    await launcher.click();
    const chat = page.locator(".global-chat-panel");
    await chat
      .getByRole("button", { name: "Что входит в стоимость проекта?", exact: true })
      .click();
    const arrow = chat.locator(".global-chat-answer a .arrow-icon");
    await expect(arrow).toHaveAttribute("stroke-width", "1.8");
    await expect(arrow).toHaveCSS("width", "18px");
    await expect(page.locator(".global-chat-launcher svg")).toHaveAttribute(
      "stroke-linecap",
      "round",
    );
    await page.screenshot({ path: info.outputPath("chat-icons.png") });
    await page.keyboard.press("Escape");
    if (width < 1151) {
      await page.getByRole("button", { name: "Открыть меню", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Закрыть меню", exact: true }),
      ).toBeInViewport();
      await page.screenshot({ path: info.outputPath("menu.png"), animations: "disabled" });
      await page.keyboard.press("Escape");
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
