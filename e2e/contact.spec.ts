import { expect, test } from "./authenticated-test";

for (const width of [1440, 768, 390]) {
  test(`контакты начинают страницу без лишнего вводного блока при ${width}px`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/contacts");
    await expect(page.locator("main > :first-child")).toHaveClass(/contact-section/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Контакты автора портфолио");
    await expect(page.locator(".contacts-page-intro")).toHaveCount(0);
    await expect(page.getByText("Начнём с разговора.")).toHaveCount(0);
    const gap = await page
      .locator("h1")
      .evaluate(
        (node) =>
          node.getBoundingClientRect().top -
          document.querySelector(".site-header")!.getBoundingClientRect().bottom,
      );
    expect(Math.abs(gap - (width <= 760 ? 32 : 48))).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.locator(".contact-options a")).toHaveCount(3);
    await expect(page.locator(".demo-chat")).toBeVisible();
    await expect(page.locator(".demo-contact-form")).toBeVisible();
    await page.screenshot({ path: info.outputPath(`contacts-${width}.png`) });
    await page.screenshot({ path: info.outputPath(`contacts-full-${width}.png`), fullPage: true });
  });
}

test("контакты доступны с главной страницы и в мобильном меню", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contacts");
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page
    .getByRole("navigation", { name: "Мобильная навигация" })
    .getByRole("link", { name: "Контакты" })
    .click();
  await expect(page).toHaveURL(/\/contacts$/);
  const section = page.getByRole("region", { name: "Контакты автора портфолио" });
  await expect(section).toBeInViewport();
  await expect(section.getByRole("link", { name: /vanya_silorov@mail.ru/ })).toHaveAttribute(
    "href",
    /^mailto:vanya_silorov@mail\.ru\?/,
  );
  await expect(section.getByRole("link", { name: /@AvitoTrader/ })).toHaveAttribute(
    "href",
    "https://t.me/AvitoTrader",
  );
  await expect(section.getByRole("link", { name: /khramtsov2001/ })).toHaveAttribute(
    "href",
    "https://vk.ru/khramtsov2001",
  );
});

test("сравнение подставляет выбранные дома в черновик письма и Telegram", async ({ page }) => {
  await page.goto("/compare?projects=01,02");
  const section = page.getByRole("region", { name: "Нужна помощь с выбором?" });
  const email = await section
    .getByRole("link", { name: /vanya_silorov@mail.ru/ })
    .getAttribute("href");
  const emailParams = new URLSearchParams(email!.split("?")[1]);
  expect(emailParams.get("subject")).toBe("ОСНОВА — помощь с выбором дома");
  expect(emailParams.get("body")).toContain("01 — «Скандинавия», 118 м²");
  expect(emailParams.get("body")).toContain("02 — «Север», 164 м²");
  const telegram = await section.getByRole("link", { name: /@AvitoTrader/ }).getAttribute("href");
  expect(new URL(telegram!).searchParams.get("text")).toContain("02 — «Север», 164 м²");
  await expect(section).toContainText("Сайт сам не отправляет сообщение");
});

test("калькулятор готовит письмо с текущей сводкой, не показывая отправку", async ({ page }) => {
  await page.goto("/?project=02#calculator");
  await page.getByRole("button", { name: "Подготовить сводку" }).click();
  const textarea = page.getByRole("textbox", { name: "Текст сводки" });
  const summary = await textarea.inputValue();
  const email = await page
    .getByRole("link", { name: "Открыть письмо с расчётом" })
    .getAttribute("href");
  expect(new URLSearchParams(email!.split("?")[1]).get("body")).toContain(summary);
  await expect(
    page.getByText("Сайт подготовит текст, но не отправит его.", { exact: false }),
  ).toBeVisible();
});
