import { expect, test } from "@playwright/test";

test("слайд шоу показывает локальные экстерьеры и ведёт к выбранному дому", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const images = await page
    .locator(".project-image")
    .evaluateAll((nodes) => nodes.map((node) => (node as HTMLImageElement).getAttribute("src")));
  expect(new Set(images).size).toBe(3);
  for (const src of images) {
    expect(src).toMatch(/^\/images\/projects\/.+\.jpg$/);
    const response = await request.get(src!);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("image/jpeg");
  }
  await expect(page.locator(".hero-image")).toHaveAttribute("src", images[0]!);
  await expect(page.locator(".hero-slide-dots, .hero-slide-controls")).toHaveCount(0);
  await page.getByRole("button", { name: "Следующий проект" }).click();
  await expect(page.locator(".hero-slide-caption")).toContainText("Проект «Север»");
  await page.locator(".hero-slide-caption a").click();
  await expect(page).toHaveURL(/\/projects\/02$/);
  await expect(page.getByRole("heading", { level: 1, name: "Север" })).toBeVisible();
});

test("при уменьшенной анимации слайды не переключаются автоматически", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install();
  await page.goto("/");
  await page.clock.runFor(7000);
  await expect(page.locator(".hero-slide-caption")).toContainText("Проект «Скандинавия»");
  await page.getByRole("button", { name: "Следующий проект" }).click();
  await page.getByRole("button", { name: "Следующий проект" }).click();
  await expect(page.locator(".hero-slide-caption")).toContainText("Проект «Лесной»");
});

test("свайп меняет проект и не открывает ссылку с изображения", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Следующий проект" })).toBeVisible();
  await page.locator(".hero-image-link").evaluate((link) => {
    const start = new Touch({ identifier: 1, target: link, clientX: 300, clientY: 200 });
    const end = new Touch({ identifier: 1, target: link, clientX: 200, clientY: 205 });
    link.dispatchEvent(
      new TouchEvent("touchstart", { bubbles: true, touches: [start], changedTouches: [start] }),
    );
    link.dispatchEvent(new TouchEvent("touchend", { bubbles: true, changedTouches: [end] }));
    link.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await expect(page.locator(".hero-slide-caption")).toContainText("Проект «Север»");
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: "Предыдущий проект" }).click();
  await expect(page.locator(".hero-slide-caption")).toContainText("Проект «Скандинавия»");
  await page.getByRole("button", { name: "Следующий проект" }).click();
  await expect(page.locator(".hero-slide-caption")).toContainText("Проект «Север»");
  await expect(page).toHaveURL(/\/$/);
});

test("на телефоне фото занимает первый экран, а стрелки кнопок остаются видимыми", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const visual = page.locator(".hero-visual");
  const image = page.locator(".hero-image");
  await expect
    .poll(async () =>
      image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0),
    )
    .toBe(true);
  const visualBox = await visual.boundingBox();
  const imageBox = await image.boundingBox();
  expect(visualBox!.width).toBeGreaterThan(300);
  expect(visualBox!.height).toBeGreaterThan(300);
  expect(imageBox!.width).toBeGreaterThanOrEqual(visualBox!.width - 1);
  expect(imageBox!.height).toBeGreaterThanOrEqual(visualBox!.height - 1);

  const arrows = page.locator(".hero-actions .arrow-icon");
  await expect(arrows).toHaveCount(2);
  for (const arrow of await arrows.all()) {
    const box = await arrow.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(16);
    expect(box!.height).toBeGreaterThanOrEqual(16);
  }
});
