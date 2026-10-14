import { describe, expect, it } from "vitest";
import { calculateHouseEstimate } from "./calculations";
import { DEFAULT_HOUSE_PARAMETERS } from "./catalog";
import {
  clampHouseNumber,
  maximumBathrooms,
  maximumBedrooms,
  maximumPerimeter,
  minimumBathrooms,
  minimumBedrooms,
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
    expect(maximumPerimeter(30, 1)).toBe(28);
    expect(minimumPerimeter(Number.NaN, 1)).toBe(10);
  });

  it("ограничивает периметр соразмерно площади и этажности", () => {
    expect(minimumPerimeter(1000, 1)).toBe(127);
    expect(maximumPerimeter(1000, 1)).toBe(159);
    expect(minimumPerimeter(1000, 2)).toBe(90);
    expect(maximumPerimeter(1000, 2)).toBe(112);
    expect(clampHouseNumber("perimeter", 200, { ...DEFAULT_HOUSE_PARAMETERS, area: 30 })).toBe(28);
    expect(
      normalizeForArea({ ...DEFAULT_HOUSE_PARAMETERS, area: 1000, perimeter: 10 }).perimeter,
    ).toBe(127);
  });

  it("отклоняет несогласованные комбинации, если расчёт вызван без интерфейса", () => {
    for (const overrides of [
      { area: 30, bedrooms: 6 },
      { area: 30, bedrooms: 1, bathrooms: 4 },
      { area: 160, perimeter: 44 },
      { area: 30, perimeter: 29 },
      { area: 200, bedrooms: 6, bathrooms: 1 },
    ]) {
      expect(() => calculateHouseEstimate({ ...DEFAULT_HOUSE_PARAMETERS, ...overrides })).toThrow(
        RangeError,
      );
    }
  });

  it("согласует спальни и санузлы с очень большой площадью", () => {
    const parameters = normalizeForArea({
      ...DEFAULT_HOUSE_PARAMETERS,
      area: 1000,
      bedrooms: 1,
      bathrooms: 1,
      perimeter: 126,
    });
    expect(parameters.bedrooms).toBe(6);
    expect(parameters.bathrooms).toBe(4);
    expect(minimumBedrooms(1000)).toBe(6);
    expect(minimumBathrooms(1000)).toBe(4);
    expect(() => calculateHouseEstimate({ ...parameters, bedrooms: 1, bathrooms: 1 })).toThrow(
      RangeError,
    );
    expect(calculateHouseEstimate(parameters).total).toBeGreaterThan(0);
  });

  it("согласует число санузлов с числом спален", () => {
    const parameters = normalizeForArea({
      ...DEFAULT_HOUSE_PARAMETERS,
      area: 200,
      bedrooms: 6,
      bathrooms: 1,
    });
    expect(parameters.bathrooms).toBe(2);
    expect(minimumBathrooms(200, 6)).toBe(2);
    expect(calculateHouseEstimate(parameters).total).toBeGreaterThan(0);
  });
});
