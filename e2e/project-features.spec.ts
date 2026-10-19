import { expect, test, type Page } from "@playwright/test";
import { projects } from "../src/features/projects/catalog";

test.use({ hasTouch: true });
async function swipe(page: Page, dx: number, dy = 0) {
  const box = (await page.locator(".floor-plan-stage").boundingBox())!;
  const client = await page.context().newCDPSession(page);
  const x = box.x + box.width * (dx < 0 ? 0.8 : 0.2);
  const y = Math.min(box.y + box.height / 2, page.viewportSize()!.height - 100);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 1; i <= 5; i++)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + (dx * i) / 5, y: y + (dy * i) / 5 }],
    });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await client.detach();
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

for (const [width, height] of [
  [1440, 1000],
  [1024, 768],
  [768, 1024],
  [390, 844],
  [375, 812],
]) {
  test(`все планировки, этажи и мобильный свайп при ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    for (const project of projects) {
      await page.goto(`/projects/${project.number}`);
      const section = page.locator(".project-floor-plans");
      await expect(
        section.getByRole("heading", { name: "Планировки этажей", exact: true }),
      ).toBeVisible();
      await expect(section).toContainText("Это не рабочая документация");
      const image = section.locator(".floor-plan-stage img");
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth))
        .toBeGreaterThan(0);
      if (project.floors === 1) {
        await expect(section.getByRole("status")).toHaveText("1 этаж");
        await expect(section.getByRole("button", { name: "Следующий этаж" })).toHaveCount(0);
      } else {
        const next = section.getByRole("button", { name: "Следующий этаж" });
        const previous = section.getByRole("button", { name: "Предыдущий этаж" });
        await expect(previous).toBeDisabled();
        await next.click();
        await expect(section.getByRole("status")).toHaveText("Этаж 2 из 2");
        await expect(next).toBeDisabled();
        await expect
          .poll(() => image.evaluate((node) => (node as HTMLImageElement).naturalWidth))
          .toBeGreaterThan(0);
        await page.locator(".floor-plan-stage").screenshot({
          path: info.outputPath(`${project.number}-floor-2.png`),
          animations: "disabled",
        });
        await previous.focus();
        await page.keyboard.press("Enter");
        await expect(section.getByRole("status")).toHaveText("Этаж 1 из 2");
      }
      await page.locator(".floor-plan-stage").screenshot({
        path: info.outputPath(`${project.number}-floor-1.png`),
        animations: "disabled",
      });
      await noOverflow(page);
    }
    await page.goto("/projects/02");
    await page.locator(".floor-plan-stage").scrollIntoViewIfNeeded();
    await swipe(page, -120);
    await expect(page.locator(".floor-plan-controls [role=status]")).toHaveText("Этаж 2 из 2");
    await swipe(page, -120);
    await expect(page.locator(".floor-plan-controls [role=status]")).toHaveText("Этаж 2 из 2");
    await swipe(page, 120);
    await expect(page.locator(".floor-plan-controls [role=status]")).toHaveText("Этаж 1 из 2");
    const before = await page.evaluate(() => scrollY);
    await swipe(page, 5, -110);
    await expect(page.locator(".floor-plan-controls [role=status]")).toHaveText("Этаж 1 из 2");
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 10);
    await page
      .locator(".project-floor-plans")
      .screenshot({ path: info.outputPath("plans-section.png") });
    await page.screenshot({ path: info.outputPath("project-full.png"), fullPage: true });
  });

  test(`полноэкранные фото, планы и возврат фокуса при ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    for (const project of projects) {
      await page.goto(`/projects/${project.number}`);
      const opener = page.getByRole("button", {
        name: `Увеличить фото проекта ${project.name}`,
        exact: true,
      });
      await opener.scrollIntoViewIfNeeded();
      await opener.focus();
      const y = await page.evaluate(() => scrollY);
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", { name: project.name, exact: true });
      await expect(dialog).toBeVisible();
      await expect(dialog.locator("img")).toHaveAttribute("src", project.image);
      await expect(dialog.locator("img")).toHaveCSS("object-fit", "contain");
      const close = dialog.getByRole("button", { name: "Закрыть просмотр изображения" });
      const box = (await close.boundingBox())!;
      expect(box.x).toBeLessThan(40);
      expect(box.y).toBeLessThan(40);
      await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
      await page.mouse.wheel(0, 400);
      expect(await page.evaluate(() => scrollY)).toBe(y);
      await noOverflow(page);
      if (project.number === "01")
        await page.screenshot({ path: info.outputPath("photo-viewer.png") });
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
      expect(await page.evaluate(() => scrollY)).toBe(y);
    }
    await page.getByRole("button", { name: /Увеличить фото проекта/ }).click();
    await page.mouse.click(width - 3, height / 2);
    await expect(page.locator(".image-viewer")).toHaveCount(0);
    const planOpener = page.getByRole("button", { name: "Увеличить план", exact: true });
    await planOpener.click();
    await expect(page.locator(".image-viewer img")).toHaveAttribute(
      "src",
      /floor-plans\/08-floor-1.svg$/,
    );
    await page.getByRole("button", { name: "Закрыть просмотр изображения" }).click();
    await expect(planOpener).toBeFocused();
  });

  test(`глобальный чат, контекст и локальная история при ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    const rpc: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/rpc/")) rpc.push(request.url());
    });
    const routes = [
      "/",
      "/projects",
      "/projects/02",
      "/compare",
      "/find-home",
      "/calculator",
      "/account",
      "/payment",
      "/payment/methods/mortgage",
      "/about",
      "/partners",
      "/vacancies",
      "/contacts",
    ];
    for (const route of routes) {
      await page.goto(route);
      await expect(
        page.getByRole("button", { name: "Открыть демонстрационный чат", exact: true }),
      ).toBeVisible();
      await noOverflow(page);
    }
    await page.goto("/");
    const launcher = page.getByRole("button", {
      name: "Открыть демонстрационный чат",
      exact: true,
    });
    await launcher.focus();
    await page.keyboard.press("Enter");
    const panel = page.getByRole("dialog", { name: "Менеджер ОСНОВА" });
    await expect(panel).toContainText("Демонстрационный чат");
    await expect(panel.locator("input,textarea")).toHaveCount(0);
    await expect(panel.getByRole("button", { name: "Закрыть панель чата" })).toBeFocused();
    await panel.getByRole("button", { name: "Как начать строительство?", exact: true }).click();
    await expect(panel.locator(".global-chat-answer")).toContainText("портфолио");
    await page.screenshot({ path: info.outputPath("chat-home.png") });
    await panel.getByRole("link", { name: "Открыть каталог", exact: true }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await page.getByRole("button", { name: "Открыть демонстрационный чат", exact: true }).click();
    await expect(
      panel.getByRole("button", { name: "Можно ли изменить планировку?", exact: true }),
    ).toBeVisible();
    await expect(panel.locator(".global-chat-question")).toHaveCount(1);
    await panel
      .getByRole("button", { name: "Что входит в стоимость проекта?", exact: true })
      .click();
    await panel.getByRole("link", { name: "Перейти к калькулятору", exact: true }).last().click();
    await page.getByRole("button", { name: "Открыть демонстрационный чат", exact: true }).click();
    await expect(
      panel.getByRole("button", { name: "Как сохранить расчёт?", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Открыть демонстрационный чат", exact: true }),
    ).toBeFocused();
    await page.reload();
    await page.getByRole("button", { name: "Открыть демонстрационный чат", exact: true }).click();
    await expect(panel.locator(".global-chat-question")).toHaveCount(2);
    await page.keyboard.press("Escape");
    await page.getByRole("link", { name: "Оплатить (демо)", exact: true }).click();
    await page.getByRole("button", { name: "Открыть демонстрационный чат", exact: true }).click();
    await panel
      .getByRole("button", { name: "Является ли оплата на сайте настоящей?", exact: true })
      .click();
    await expect(panel.locator(".global-chat-answer").last()).toContainText(
      "Деньги не списываются",
    );
    await page.screenshot({ path: info.outputPath("chat-payment.png") });
    const box = (await panel.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y + box.height).toBeLessThanOrEqual(height);
    await noOverflow(page);
    expect(rpc).toEqual([]);
    await page.keyboard.press("Escape");
    await page.goto("/calculator");
    const pay = page.getByRole("link", { name: "Оплатить (демо)", exact: true });
    await pay.scrollIntoViewIfNeeded();
    await expect
      .poll(async () =>
        page.locator(".global-chat-launcher").evaluate((node) => {
          const button = node.getBoundingClientRect();
          const pay = document.querySelector(".estimate-next-actions a")!.getBoundingClientRect();
          return (
            button.right <= pay.left ||
            button.left >= pay.right ||
            button.bottom <= pay.top ||
            button.top >= pay.bottom
          );
        }),
      )
      .toBe(true);
    await page.locator(".estimate-disclaimer").first().scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page.locator(".global-chat-launcher").evaluate((node) => {
          const button = node.getBoundingClientRect();
          return [...document.querySelectorAll(".estimate-disclaimer")].every((element) => {
            const note = element.getBoundingClientRect();
            return (
              button.right <= note.left ||
              button.left >= note.right ||
              button.bottom <= note.top ||
              button.top >= note.bottom
            );
          });
        }),
      )
      .toBe(true);
    await page.screenshot({
      path: info.outputPath("launcher-financial-note.png"),
      animations: "disabled",
    });
    await page.evaluate(() =>
      scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
    );
    await expect
      .poll(() =>
        page.locator(".global-chat-launcher").evaluate((node) => {
          const button = node.getBoundingClientRect();
          return [...document.querySelectorAll(".site-footer a, .site-footer > p")].every(
            (element) => {
              const box = element.getBoundingClientRect();
              return (
                button.right <= box.left ||
                button.left >= box.right ||
                button.bottom <= box.top ||
                button.top >= box.bottom
              );
            },
          );
        }),
      )
      .toBe(true);
    await page.screenshot({
      path: info.outputPath("chat-launcher-footer.png"),
      animations: "disabled",
    });
  });
}

test("маленькая высота, reduced motion и ограничение хранения не ломают новые панели", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 500 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/projects/02");
  await expect(page.locator(".floor-plan-stage img")).toHaveCSS("animation-name", "none");
  await page.getByRole("button", { name: "Открыть демонстрационный чат", exact: true }).click();
  const panel = page.locator(".global-chat-panel");
  await expect(panel).toHaveCSS("animation-name", "none");
  const box = (await panel.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(500);
  await page.getByRole("button", { name: "Закрыть панель чата", exact: true }).click();
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "osnova.global-demo-chat.v1")
        throw new DOMException("test storage full", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await page.getByRole("button", { name: "Открыть демонстрационный чат", exact: true }).click();
  await panel.getByRole("button", { name: "Что входит в стоимость проекта?", exact: true }).click();
  await expect(panel).toContainText("Хранилище недоступно");
  await expect(panel.locator(".global-chat-answer")).toContainText("Север");
});
