import { expect, test } from "./authenticated-test";

test("тип проекта поясняет границы сметы и выбор из каталога возвращает типовой сценарий", async ({
  page,
}) => {
  await page.goto("/calculator");
  const calculator = page.getByRole("region", { name: "Калькулятор сметы", exact: true });
  await calculator.locator(".estimate-breakdown-heading").click();
  const type = calculator.getByRole("combobox", { name: /Тип проекта/ });
  const total = calculator.locator(".estimate-grand-total strong");
  const original = await total.innerText();

  await type.click();
  await page.getByRole("option", { name: "Индивидуальный проект" }).click();
  await expect(calculator).toContainText(
    "Стоимость проектирования и уточнения конструкций будет рассчитываться отдельно",
  );
  await expect(total).toHaveText(original);
  await type.click();
  await page.getByRole("option", { name: "По чертежам заказчика" }).click();
  await expect(calculator).toContainText("специалист должен проверить их состав и пригодность");
  await expect(total).toHaveText(original);

  await page
    .getByRole("navigation", { name: "Основная навигация" })
    .getByRole("link", { name: "Проекты", exact: true })
    .click();
  await page.getByRole("link", { name: "Рассчитать стоимость проекта Север", exact: true }).click();
  await expect(type).toHaveAttribute("data-value", "standard");
  await expect(calculator).toContainText("На основе проекта «Север»");
  await type.click();
  await page.getByRole("option", { name: "Индивидуальный проект" }).click();
  await expect(calculator).not.toContainText("На основе проекта «Север»");
  await calculator.getByRole("button", { name: "Сбросить", exact: true }).click();
  await expect(type).toHaveAttribute("data-value", "standard");
  await expect(total).toHaveText(original);
});
