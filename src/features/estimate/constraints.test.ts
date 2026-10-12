import { describe, expect, it } from "vitest";
import { calculateHouseEstimate } from "./calculations";
import { DEFAULT_HOUSE_PARAMETERS } from "./catalog";
import {
  clampHouseNumber,
  maximumBathrooms,
  maximumBedrooms,
  minimumArea,
  minimumPerimeter,
  normalizeForArea,
} from "./constraints";

describe("ограничения демо-калькулятора", () => {
  it("приводит площадь и высоту к границам после завершения ввода", () => {
    expect(normalizeForArea({ ...DEFAULT_HOUSE_PARAMETERS, area: 29 }).area).toBe(30);
    expect(normalizeForArea({ ...DEFAULT_HOUSE_PARAMETERS, area: 1001 }).area).toBe(1000);
    expect(clampHouseNumber("wallHeight", 2.3, DEFAULT_HOUSE_PARAMETERS)).toBe(2.4);
    expect(clampHouseNumber("wallHeight", 5.1, DEFAULT_HOUSE_PARAMETERS)).toBe(5);
  });

  it("согласует комнаты и периметр с площадью, сохраняя валидный расчёт", () => {
    const parameters = normalizeForArea({
      ...DEFAULT_HOUSE_PARAMETERS,
      area: 30,
      bedrooms: 6,
      bathrooms: 4,
      perimeter: 10,
    });
    expect(parameters.bedrooms).toBe(1);
    expect(parameters.bathrooms).toBe(1);
    expect(parameters.perimeter).toBe(minimumPerimeter(30, 1));
    expect(calculateHouseEstimate(parameters).total).toBeGreaterThan(0);
    expect(maximumBedrooms(30)).toBe(1);
    expect(minimumArea(2)).toBe(60);
    expect(normalizeForArea({ ...DEFAULT_HOUSE_PARAMETERS, floors: 2, area: 30 }).area).toBe(60);
    expect(maximumBathrooms(30)).toBe(1);
    expect(minimumPerimeter(Number.NaN, 1)).toBe(10);
  });

  it("отклоняет несогласованные комбинации, если расчёт вызван без интерфейса", () => {
    for (const overrides of [
      { area: 30, bedrooms: 6 },
      { area: 30, bedrooms: 1, bathrooms: 4 },
      { area: 160, perimeter: 44 },
    ]) {
      expect(() => calculateHouseEstimate({ ...DEFAULT_HOUSE_PARAMETERS, ...overrides })).toThrow(
        RangeError,
      );
    }
  });
});
