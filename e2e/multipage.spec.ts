import { expect, test } from "@playwright/test";
for (const width of [320, 375, 768, 1024, 1440])
  test(`новые страницы доступны и адаптивны при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const titles = new Set<string>();
    for (const route of [
      "/",
      "/projects",
      "/calculator",
      "/about",
      "/partners",
      "/contacts",
      "/compare?projects=01,02",
      "/find-home",
      "/account",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      titles.add(await page.title());
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{30}/);
    }
    expect(titles.size).toBe(9);
  });
test("главная компактна, корпоративные данные явно демонстрационные", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".project-card")).toHaveCount(3);
  await expect(page.locator(".project-filters,.estimate-calculator")).toHaveCount(0);
  await expect(page.locator(".review-card")).toHaveCount(3);
  await page.goto("/about");
  await expect(page.locator(".company-timeline li")).toHaveCount(6);
  await expect(page.locator(".stat-grid>div")).toHaveCount(4);
  await expect(page.locator(".team-card")).toHaveCount(6);
  await expect(page.locator(".site-footer")).toContainText(
    "Компания, сотрудники, партнёры, отзывы и показатели",
  );
  await page.goto("/partners");
  await expect(page.locator(".partner-card")).toHaveCount(6);
  await expect(page.locator(".partner-cases article")).toHaveCount(3);
});
test("контактная форма проверяет поля без отправки и хранения", async ({ page }) => {
  await page.goto("/contacts");
  const sent: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") sent.push(r.url());
  });
  const form = page.locator(".demo-contact-form");
  await form.getByRole("button").click();
  await expect(form.getByRole("status")).toHaveCount(0);
  await form.getByLabel("Имя", { exact: true }).fill("Тестовый посетитель");
  await form.getByLabel("Email", { exact: true }).fill("example@example.com");
  await form.getByLabel("Идея проекта").fill("Демонстрационная идея дома");
  await form.getByRole("button").click();
  await expect(form.getByRole("status")).toContainText("данные никуда не отправлены");
  expect(sent).toEqual([]);
  expect(
    await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage })),
  ).not.toContain("example@example.com");
});
test("старые ссылки перенаправляют к новым инструментам", async ({ page }) => {
  await page.goto("/#projects");
  await expect(page).toHaveURL(/\/projects#projects$/);
  await page.goto("/?project=02#calculator");
  await expect(page).toHaveURL(/\/calculator\?project=02$/);
  await expect(page.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("164");
  await page.goto("/#contacts");
  await expect(page).toHaveURL(/\/contacts#contacts$/);
});
test("активное меню и черновик переживают переходы между страницами", async ({ page }) => {
  await page.goto("/calculator");
  await page.getByRole("spinbutton", { name: /Площадь дома/ }).fill("180");
  const nav = page.getByRole("navigation", { name: "Основная навигация" });
  await expect(nav.getByRole("link", { name: "Калькулятор", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await nav.getByRole("link", { name: "О компании" }).click();
  await nav.getByRole("link", { name: "Калькулятор", exact: true }).click();
  await expect(page.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("180");
  await page.reload();
  await expect(page.getByRole("spinbutton", { name: /Площадь дома/ })).toHaveValue("180");
});
