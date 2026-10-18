import { expect, test } from "@playwright/test";
import { openDemoCabinetViaGoogle } from "./demo-auth";

test("мобильное меню закрывает экран, удерживает фокус и блокирует страницу", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator(".home-popular").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Открыть меню" }).click();
  const nav = page.getByRole("navigation", { name: "Мобильная навигация" });
  await expect(nav).toBeVisible();
  await expect
    .poll(async () => {
      const bounds = await nav.boundingBox();
      return (
        bounds &&
        Object.fromEntries(Object.entries(bounds).map(([key, value]) => [key, Math.round(value)]))
      );
    })
    .toEqual({ x: 0, y: 0, width: 390, height: 844 });
  await expect(page.locator("main")).toHaveAttribute("inert", "");
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe("hidden");
  await expect(nav.getByRole("link", { name: "Главная", exact: true })).toBeFocused();
  await nav.getByRole("link", { name: "Личный кабинет" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Закрыть меню" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(nav.getByRole("link", { name: "Личный кабинет" })).toBeFocused();
  const scrollBefore = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 500);
  expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
  await page.keyboard.press("Escape");
  await expect(nav).toHaveCount(0);
  await expect(page.locator("main")).not.toHaveAttribute("inert");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await expect(page.getByRole("button", { name: "Открыть меню" })).toBeFocused();
});

test("смена ширины закрывает мобильное меню и возвращает доступ к странице", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/projects/01");
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator(".mobile-nav")).toHaveCount(0);
  await expect(page.locator("main")).not.toHaveAttribute("inert");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("пустые состояния кабинета показывают акцентные действия, выход имеет явный цвет", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/account");
  await openDemoCabinetViaGoogle(page);
  for (const name of ["Посмотреть каталог", "Рассчитать стоимость"]) {
    const link = page.getByRole("link", { name, exact: true });
    await expect(link).toHaveClass(/button-primary/);
    await link.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await expect(link).toHaveCSS("background-color", "rgb(179, 87, 61)");
    await expect(link).toHaveCSS("color", "rgb(255, 255, 255)");
  }
  await expect(page.getByRole("button", { name: "Выйти из демо" })).toHaveCSS(
    "color",
    "rgb(37, 38, 33)",
  );
  await page.getByRole("link", { name: "Посмотреть каталог", exact: true }).click();
  await expect(page).toHaveURL(/\/projects$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
