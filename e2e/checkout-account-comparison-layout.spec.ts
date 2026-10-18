import { expect, test } from "@playwright/test";

for (const width of [1440, 768, 390]) {
  test(`оплата: условия, график и оформление при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/payment");
    await expect(page.locator(".payment-empty")).toBeVisible();
    await expect(page.locator(".payment-reference")).toHaveAttribute("open", "");
    await page.evaluate(() => sessionStorage.setItem("osnova.demo-session.v1", "active:google"));
    await page.goto("/calculator");
    await page.getByRole("link", { name: "Оплатить (демо)", exact: true }).click();
    await expect(page.locator(".payment-reference")).not.toHaveAttribute("open");
    expect((await page.locator(".payment-checkout").boundingBox())!.y).toBeLessThan(
      (await page.locator(".payment-reference").boundingBox())!.y,
    );
    await page.locator(".payment-stage-details > summary").click();
    await expect(page.locator(".payment-stage-list li")).toHaveCount(8);
    await expect(page.locator(".payment-stage-list li").first()).toBeVisible();
    await page.locator(".payment-tax-details > summary").click();
    await expect(page.locator(".payment-tax-note")).toBeVisible();
    await page.getByRole("radio", { name: /Наличными по этапам/ }).check();
    await expect(page.locator(".payment-stage-schedule li")).toHaveCount(8);
    await expect(page.locator(".payment-stage-schedule li").last()).toBeVisible();
    await page.getByRole("radio", { name: /Наличными полностью/ }).check();
    await expect(page.getByRole("link", { name: "Условия выбранного способа" })).toHaveAttribute(
      "href",
      "/payment/methods/cash-full",
    );
    await page.getByRole("combobox", { name: "Удобный демо-офис", exact: true }).click();
    await page.getByRole("option", { name: /^Екатеринбург,/ }).click();
    const date = page.locator("#payment-appointment-date");
    await date.fill((await date.getAttribute("min"))!);
    await page.locator(".payment-time-slots label").filter({ hasText: "10:00" }).click();
    await page
      .getByRole("checkbox", { name: /Понимаю, что запись и оплата демонстрационные/ })
      .check();
    await expect(
      page.getByRole("button", { name: "Подтвердить демо-запись и скачать PDF", exact: true }),
    ).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

  test(`кабинет: сметы перед чатом при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/account");
    await expect(page.locator(".account-auth-panel")).toBeVisible();
    await page.evaluate(() => sessionStorage.setItem("osnova.demo-session.v1", "active:google"));
    await page.reload();
    const estimates = page.locator('[aria-labelledby="account-estimates-title"]');
    await expect(estimates).toContainText("Сохранённых расчётов пока нет");
    expect((await estimates.boundingBox())!.y).toBeLessThan(
      (await page.locator(".account-chat-section").boundingBox())!.y,
    );
    await page.goto("/calculator");
    await page.getByRole("button", { name: "Сохранить расчёт", exact: true }).click();
    await expect(page.locator(".estimate-saved-status")).toContainText("Расчёт сохранён");
    await page.goto("/account");
    await expect(
      estimates.getByRole("button", { name: "Продолжить расчёт", exact: true }),
    ).toBeVisible();
    await page.getByText("Показать сводку", { exact: true }).click();
    await expect(estimates.locator("pre")).toBeVisible();
    await estimates.getByRole("button", { name: "Продолжить расчёт", exact: true }).click();
    await expect(page).toHaveURL(/calculator$/);
  });

  test(`сравнение: 1–3 проекта и подробности при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const ids of ["01", "01,02", "01,02,03"]) {
      await page.goto(`/compare?projects=${ids}`);
      if (width === 390) {
        const cards = page.locator(".comparison-mobile-card");
        await expect(cards).toHaveCount(ids.split(",").length);
        const first = cards.first();
        await expect(first.locator(".comparison-mobile-facts")).toContainText("Газобетон");
        await expect(first.locator(".comparison-mobile-facts")).toContainText("нед.");
        await expect(first.locator("details")).not.toHaveAttribute("open");
        await first.locator("summary").click();
        await expect(first.locator(".project-pitch")).toBeVisible();
        await first.locator("summary").click();
        await first.getByRole("link", { name: "Скандинавия", exact: true }).click();
        await expect(page).toHaveURL(/projects\/01$/);
        await page.goBack();
      }
      if (width === 768 && ids === "01,02,03") {
        await expect(page.locator(".comparison-scroll-hint")).toBeVisible();
        await page.getByRole("button", { name: "Прокрутить таблицу вправо", exact: true }).click();
        await expect
          .poll(() => page.locator(".comparison-table-scroll").evaluate((e) => e.scrollLeft))
          .toBeGreaterThan(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.getByRole("button", { name: "Убрать из сравнения: Лесной", exact: true }).click();
    await expect(page).not.toHaveURL(/03/);
  });
}
