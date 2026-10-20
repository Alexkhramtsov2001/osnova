import { expect, test } from "@playwright/test";

for (const width of [1440, 768, 390]) {
  test(`каталог: фильтры, возврат и сброс при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/projects");
    const toggle = page.getByRole("button", { name: /^Фильтры/ });
    const area = page.getByRole("combobox", { name: "Площадь дома", exact: true });
    if (width === 390) {
      await expect(toggle).toHaveAttribute("aria-expanded", "false");
      await expect(area).toBeHidden();
      expect((await page.locator(".project-card").first().boundingBox())!.y).toBeLessThan(750);
      await toggle.click();
    }
    await area.click();
    await page.getByRole("option", { name: "До 100 м²", exact: true }).click();
    await expect(page.locator(".project-card")).toHaveCount(1);
    if (width === 390) {
      await expect(toggle).toHaveText(/Фильтры \(1\)/);
      await toggle.click();
      await expect(area).toBeHidden();
    }
    await page.getByRole("link", { name: "Открыть проект Компакт", exact: true }).click();
    await page.goBack();
    await expect(page.locator(".project-card")).toHaveCount(1);
    if (width === 390) await toggle.click();
    await expect(area).toHaveAttribute("data-value", "under100");
    await page.getByRole("button", { name: "Сбросить", exact: true }).click();
    await expect(page.locator(".project-card")).toHaveCount(8);
    if (width === 768) {
      const cards = page.locator(".project-card");
      const boxes = await Promise.all([0, 1, 2].map((i) => cards.nth(i).boundingBox()));
      expect(Math.abs(boxes[0]!.y - boxes[1]!.y)).toBeLessThan(1);
      expect(boxes[2]!.y).toBeGreaterThan(boxes[0]!.y);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

  test(`калькулятор: сводка и локальные ошибки при ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/calculator");
    await page.evaluate(() => document.fonts.ready);
    const summary = page.getByRole("status", { name: "Краткая сводка расчёта" });
    const area = page.getByRole("spinbutton", { name: /Площадь дома/ });
    if (width === 390) {
      await expect(summary).toBeVisible();
      await expect(summary.locator("strong")).toHaveText(
        await page.locator(".estimate-total-value").innerText(),
      );
    } else await expect(summary).toBeHidden();
    await area.fill("145");
    await page.getByRole("combobox", { name: "Материал стен", exact: true }).click();
    await page.getByRole("option", { name: "Каркас", exact: true }).click();
    if (width === 390) {
      await expect(summary).toContainText("145 м² · Каркас");
      await expect(summary.locator("strong")).toHaveText(
        await page.locator(".estimate-total-value").innerText(),
      );
    }
    for (const [name, value, errorId] of [
      [/Площадь дома/, "0", "estimate-area-error"],
      [/Высота стен/, "2.3", "estimate-wallHeight-error"],
      [/Периметр/, "9", "estimate-perimeter-error"],
    ] as const) {
      const input = page.getByRole("spinbutton", { name });
      const previous = await input.inputValue();
      await input.fill(value);
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(input).toHaveAttribute("aria-describedby", errorId);
      const error = page.locator(`#${errorId}`);
      await expect(error).toBeVisible();
      // Read both rectangles together: scrolling between separate calls changes viewport coordinates.
      const position = await input.evaluate((node, id) => {
        const message = document.getElementById(id)!;
        const inputRect = node.getBoundingClientRect();
        const errorRect = message.getBoundingClientRect();
        return {
          sameField: node.closest(".estimate-field")!.contains(message),
          topGap: errorRect.top - inputRect.top,
          bottomGap: errorRect.top - inputRect.bottom,
        };
      }, errorId);
      expect(position.sameField).toBe(true);
      expect(position.bottomGap).toBeGreaterThanOrEqual(0);
      expect(position.topGap).toBeLessThan(100);
      await expect(summary).toBeHidden();
      await input.fill(previous);
      await expect(error).toHaveCount(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
}
