import { describe, expect, it } from "vitest";
import { calculateEstimateTotal, calculateItemTotal } from "./calculations";

describe("Расчёт позиции сметы", () => {
  it("умножает количество на цену", () => {
    expect(
      calculateItemTotal({
        name: "Газобетон",
        quantity: 10,
        unitPrice: 6500,
      }),
    ).toBe(65000);
  });

  it("округляет стоимость до копеек", () => {
    expect(
      calculateItemTotal({
        name: "Материал",
        quantity: 3,
        unitPrice: 10.333,
      }),
    ).toBe(31);
  });

  it("отклоняет отрицательное количество", () => {
    expect(() =>
      calculateItemTotal({
        name: "Материал",
        quantity: -1,
        unitPrice: 100,
      }),
    ).toThrow(RangeError);
  });
});

describe("Итоговая стоимость сметы", () => {
  it("суммирует несколько позиций", () => {
    expect(
      calculateEstimateTotal([
        { name: "Материал", quantity: 10, unitPrice: 100 },
        { name: "Работы", quantity: 5, unitPrice: 200 },
      ]),
    ).toBe(2000);
  });

  it("возвращает ноль для пустой сметы", () => {
    expect(calculateEstimateTotal([])).toBe(0);
  });
});
