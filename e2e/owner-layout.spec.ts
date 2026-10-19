import { expect, test } from "@playwright/test";

for (const [width, height] of [
  [1440, 1000],
  [768, 1024],
  [390, 844],
]) {
  test(`композиция Hero, проектов, действий и оплаты при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/");
    const actions = (await page.locator(".hero-actions").boundingBox())!;
    const hero = (await page.locator(".hero").boundingBox())!;
    expect(hero.y + hero.height - actions.y - actions.height).toBeLessThanOrEqual(1);
    await expect(page.locator(".hero-note, .hero-bottom")).toHaveCount(0);
    expect(
      await page.locator(".hero-actions").evaluate((node) => node.nextElementSibling === null),
    ).toBe(true);
    for (const card of await page.locator(".home-popular .project-card").all()) {
      const image = (await card.locator(".project-image-link").boundingBox())!;
      const title = (await card.locator("h3").boundingBox())!;
      expect(title.y - image.y - image.height).toBeLessThanOrEqual(24);
      const children = await card
        .locator(".project-info")
        .evaluate((node) => [...node.children].map((child) => child.tagName));
      expect(children).toEqual(["H3", "P", "DIV", "A"]);
      await expect(card.getByRole("link", { name: "Изучить проект", exact: true })).toBeVisible();
    }
    await page.goto("/projects/01");
    const intro = page.locator(".project-detail-content > section").first();
    const guidance = page.locator(".project-detail-guidance");
    const introBox = (await intro.boundingBox())!;
    expect((await guidance.boundingBox())!.y).toBeGreaterThanOrEqual(introBox.y + introBox.height);
    await expect(guidance).toContainText("Кому подойдёт");
    await expect(guidance).toContainText("Что учесть");
    await page.goto("/calculator");
    const pay = page.getByRole("link", { name: "Оплатить (демо)", exact: true });
    const pdf = page.getByRole("button", { name: "Скачать расчёт в PDF", exact: true });
    expect((await pay.boundingBox())!.y).toBeLessThan((await pdf.boundingBox())!.y);
    await expect(pay).toHaveCSS("background-color", "rgb(179, 87, 61)");
    await expect(pdf).toHaveClass(/button-secondary/);
    await pay.click();
    const reference = page.locator(".payment-reference");
    await expect(
      reference.getByRole("heading", { name: "Какие есть варианты", exact: true }),
    ).toBeVisible();
    await expect(reference.locator(".payment-method-card")).toHaveCount(4);
    expect((await reference.boundingBox())!.y).toBeLessThan(
      (await page.locator(".payment-preview").boundingBox())!.y,
    );
    await page.goto("/vacancies");
    await expect(page.locator(".vacancy-card > button").first()).toHaveCSS(
      "border-bottom-width",
      "0px",
    );
    const buttons = page.locator(".vacancy-follow-actions .button");
    const first = (await buttons.nth(0).boundingBox())!;
    const second = (await buttons.nth(1).boundingBox())!;
    expect(first.height).toBe(second.height);
    if (width > 650) expect(first.width).toBeLessThan(260);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}

test("сводка оплаты не закрепляется под шапкой на низком планшете", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/calculator");
  await page.evaluate(() => sessionStorage.setItem("osnova.demo-session.v1", "active:google"));
  await page.reload();
  await page.getByRole("link", { name: "Оплатить (демо)", exact: true }).click();
  const panel = page.locator(".payment-confirm-panel");
  await expect(panel).toHaveCSS("position", "static");
  await expect(panel.locator(".payment-confirm-note")).toHaveCSS("font-size", "13px");
  await page.getByRole("radio", { name: /Наличными полностью/ }).check();
  const confirm = panel.getByRole("button", {
    name: "Подтвердить демо-запись и скачать PDF",
    exact: true,
  });
  await confirm.scrollIntoViewIfNeeded();
  const confirmBox = (await confirm.boundingBox())!;
  expect(confirmBox.y).toBeGreaterThanOrEqual(88);
  expect(confirmBox.y + confirmBox.height).toBeLessThanOrEqual(768);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(panel).toHaveCSS("position", "sticky");
  const top = await panel.evaluate((node) => parseFloat(getComputedStyle(node).top));
  const header = (await page.locator(".site-header").boundingBox())!;
  expect(top).toBeGreaterThan(header.height);
});
