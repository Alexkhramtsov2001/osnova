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
  [375, 500],
]) {
  test(`все планировки, этажи и мобильный свайп при ${width}x${height}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height });
    for (const project of projects) {
      await page.goto(`/projects/${project.number}`);
      const section = page.locator(".project-floor-plans");
      await expect(
        section.getByRole("heading", { name: "Планировки этажей", exact: true }),
      ).toBeVisible();
      await expect(section).toContainText("Это не рабочая документация");
      await expect(
        page.getByRole("heading", { name: "Кому подходит данный проект", exact: true }),
      ).toBeVisible();
      await expect(page.locator(".project-detail-scenarios")).toContainText(`${project.area} м²`);
      await expect(page.locator(".project-photo-hint")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Увеличить план", exact: true })).toHaveCount(
        0,
      );
      const gap = await page
        .locator(".project-detail-guidance h2")
        .first()
        .evaluate(
          (node) =>
            node.getBoundingClientRect().top -
            document.querySelector(".project-detail-content ul")!.getBoundingClientRect().bottom,
        );
      expect(gap).toBeLessThanOrEqual(72);
      expect(gap).toBeGreaterThanOrEqual(16);
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
      await page
        .locator(".project-detail-guidance")
        .screenshot({ path: info.outputPath(`${project.number}-guidance.png`) });
      await page
        .locator(".project-detail-scenarios")
        .screenshot({ path: info.outputPath(`${project.number}-audience.png`) });
      await page.screenshot({
        path: info.outputPath(`${project.number}-full.png`),
        fullPage: true,
      });
    }
    await page.goto("/projects/02");
    await page.locator(".floor-plan-stage").scrollIntoViewIfNeeded();
    await swipe(page, -120);
    await expect(page.locator(".image-viewer")).toHaveCount(0);
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

  test(`модальные панели, масштаб и стабильная кнопка при ${width}x${height}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height });
    await page.goto("/projects/02");
    const photo = page.locator(".project-photo-open");
    await photo.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath("photo-before.png") });
    await photo.click();
    await page.screenshot({ path: info.outputPath("photo-after.png") });
    await page.keyboard.press("Escape");
    const plan = page.locator(".floor-plan-stage");
    await plan.scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath("plan-before.png") });
    await plan.click();
    const image = page.locator(".image-viewer img");
    const before = (await plan.boundingBox())!;
    await page.getByRole("button", { name: "Увеличить изображение", exact: true }).click();
    await page.getByRole("button", { name: "Увеличить изображение", exact: true }).click();
    expect((await image.boundingBox())!.width).toBeGreaterThan(before.width * 1.1);
    const stage = (await page.locator(".image-viewer-stage").boundingBox())!;
    await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2);
    await page.mouse.down();
    await page.mouse.move(stage.x + stage.width / 2 + 40, stage.y + stage.height / 2 + 30, {
      steps: 5,
    });
    await page.mouse.up();
    await expect(image).not.toHaveCSS("transform", "matrix(2, 0, 0, 2, 0, 0)");
    await page.screenshot({ path: info.outputPath("plan-zoomed.png") });
    await page.keyboard.press("Escape");
    const saved = await page.evaluate(() => scrollY);
    await page.screenshot({ path: info.outputPath("chat-closed.png") });
    await page.getByRole("button", { name: "Открыть демонстрационный чат", exact: true }).click();
    const panel = page.locator(".global-chat-panel");
    const close = panel.getByRole("button", { name: "Закрыть панель чата", exact: true });
    await expect(close).toBeInViewport();
    if (width <= 600) {
      const box = (await panel.boundingBox())!;
      expect(box.x).toBe(0);
      expect(box.y).toBe(0);
      expect(box.width).toBe(width);
      expect(box.height).toBe(height);
      await expect(page.locator("body")).toHaveCSS("position", "fixed");
      const locked = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, 600);
      expect(await page.evaluate(() => scrollY)).toBe(locked);
      await page.setViewportSize({ width, height: height - 100 });
      await expect(close).toBeInViewport();
      expect((await panel.boundingBox())!.height).toBe(height - 100);
      await page.setViewportSize({ width, height });
    }
    await panel
      .getByRole("button", { name: "Что входит в стоимость проекта?", exact: true })
      .click();
    await page.screenshot({ path: info.outputPath("chat-open.png") });
    await close.click();
    if (width <= 600) expect(await page.evaluate(() => scrollY)).toBeCloseTo(saved, 0);
    await expect(page.locator(".global-chat-launcher")).toBeFocused();
    await noOverflow(page);
  });

  test(`полноэкранные фото, планы и возврат фокуса при ${width}x${height}`, async ({
    page,
  }, info) => {
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
      const beforeZoom = (await dialog.locator("img").boundingBox())!;
      await dialog.getByRole("button", { name: "Увеличить изображение", exact: true }).click();
      const zoomed = (await dialog.locator("img").boundingBox())!;
      expect(zoomed.width).toBeGreaterThan(beforeZoom.width * 1.4);
      await dialog.getByRole("button", { name: "Сбросить масштаб", exact: true }).click();
      const close = dialog.getByRole("button", { name: "Закрыть просмотр изображения" });
      const box = (await close.boundingBox())!;
      expect(box.x).toBeLessThan(40);
      expect(box.y).toBeLessThan(40);
      await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
      const locked = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, 400);
      expect(await page.evaluate(() => scrollY)).toBe(locked);
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
    const planOpener = page.getByRole("button", {
      name: "Увеличить планировку проекта Гармония, 1 этаж",
      exact: true,
    });
    await planOpener.click();
    await expect(page.locator(".image-viewer img")).toHaveAttribute(
      "src",
      /floor-plans\/08-floor-1.svg$/,
    );
    await page.getByRole("button", { name: "Закрыть просмотр изображения" }).click();
    await expect(planOpener).toBeFocused();
  });

  test(`глобальный чат, контекст и локальная история при ${width}x${height}`, async ({
    page,
  }, info) => {
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
    if (width > 600) expect(width - box.x - box.width).toBeCloseTo(16, 0);
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
    const fixed = await page.locator(".global-chat-launcher").boundingBox();
    for (const top of [0, 600, 1400, 2200]) {
      await page.evaluate((top) => scrollTo({ top, behavior: "instant" }), top);
      const current = (await page.locator(".global-chat-launcher").boundingBox())!;
      expect(current.x).toBeCloseTo(fixed!.x, 0);
      expect(current.y).toBeCloseTo(fixed!.y, 0);
    }
    await page.evaluate(() =>
      scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }),
    );
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

test("план увеличивается двумя пальцами, перемещается и не закрывается от жеста", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/projects/02");
  await page.locator(".floor-plan-stage").click();
  const stage = page.locator(".image-viewer-stage");
  const box = (await stage.boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const client = await page.context().newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: x - 30, y },
      { x: x + 30, y },
    ],
  });
  for (let i = 1; i <= 5; i++)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: x - 30 - i * 8, y },
        { x: x + 30 + i * 8, y },
      ],
    });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const reset = page.getByRole("button", { name: "Сбросить масштаб", exact: true });
  await expect(reset).not.toHaveText("100%");
  const initial = await page
    .locator(".image-viewer img")
    .evaluate((img) => getComputedStyle(img).transform);
  await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 1; i <= 5; i++)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: x + i * 8, y: y + i * 6 }],
    });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.locator(".image-viewer img")).not.toHaveCSS("transform", initial);
  await expect(page.locator(".image-viewer")).toBeVisible();
  await page.screenshot({ path: info.outputPath("pinch-and-pan.png") });
  await reset.click();
  await expect(reset).toHaveText("100%");
  await page.keyboard.press("Escape");
  await expect(page.locator(".floor-plan-stage")).toBeFocused();
  await client.detach();
});
