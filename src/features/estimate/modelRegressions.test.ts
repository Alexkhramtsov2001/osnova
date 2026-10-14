import { describe, expect, it } from "vitest";
import { calculateHouseEstimate, calculateItemTotal } from "./calculations";
import {
  DEFAULT_HOUSE_PARAMETERS as defaults,
  DEMO_DELIVERY,
  DEMO_REGIONS,
  PROJECT_TYPES,
  WALL_MATERIALS,
  DEMO_ESTIMATE_CATALOG,
} from "./catalog";
import {
  maximumBathrooms,
  maximumBedrooms,
  minimumArea,
  minimumBathrooms,
  minimumBedrooms,
  minimumPerimeter,
  maximumPerimeter,
  normalizeForArea,
  fitsRoomLayout,
} from "./constraints";
import type { EstimateResult, HouseParameters } from "./types";

const item = (result: EstimateResult, id: string) =>
  result.stages.flatMap((stage) => stage.items).find((position) => position.id === id)!;
function check(result: EstimateResult) {
  const included = result.stages.filter((stage) => stage.included);
  if (
    ![
      result.total,
      result.minTotal,
      result.maxTotal,
      result.durationWeeks.min,
      result.durationWeeks.max,
    ].every((value) => Number.isFinite(value) && value >= 0)
  )
    throw Error("Неконечный результат");
  if (
    result.minTotal > result.total ||
    result.total > result.maxTotal ||
    result.durationWeeks.min > result.durationWeeks.max
  )
    throw Error("Инвертированный диапазон");
  if (
    Math.abs(
      result.total - included.reduce((sum, stage) => sum + stage.total, result.deliveryCost),
    ) > 0.005
  )
    throw Error("Итог отличается от суммы этапов");
  for (const stage of result.stages) {
    if (
      stage.items.some(
        (position) =>
          !Number.isFinite(position.quantity) ||
          position.quantity < 0 ||
          !Number.isFinite(position.unitPrice) ||
          position.unitPrice < 0,
      )
    )
      throw Error("Некорректная позиция");
  }
}

describe("регрессии аудита модели", () => {
  it("не добавляет восемь недель при изменении площади на один метр", () => {
    for (const area of [120, 480]) {
      const a = calculateHouseEstimate(normalizeForArea({ ...defaults, area }));
      const b = calculateHouseEstimate(normalizeForArea({ ...defaults, area: area + 1 }));
      expect(b.durationWeeks.min - a.durationWeeks.min).toBeLessThanOrEqual(1);
      expect(b.durationWeeks.max - a.durationWeeks.max).toBeLessThanOrEqual(1);
    }
  });
  it("каркас включает обшивку и утепление вместо кладки и раствора", () => {
    const result = calculateHouseEstimate({ ...defaults, wallMaterial: "frame" });
    expect(item(result, "walls-frame")).toBeDefined();
    expect(item(result, "walls-insulation")).toBeDefined();
    expect(item(result, "interior-lining")).toBeDefined();
    for (const id of [
      "walls-blocks",
      "walls-mortar",
      "walls-armored-belt",
      "interior-plaster",
      "facade-insulation",
    ])
      expect(item(result, id)).toBeUndefined();
  });
  it("свайный фундамент содержит целые опоры и ростверк, лента отличается от плиты", () => {
    const piles = calculateHouseEstimate({ ...defaults, foundation: "piles" });
    expect(Number.isInteger(item(piles, "foundation-piles").quantity)).toBe(true);
    expect(item(piles, "foundation-grillage").quantity).toBe(defaults.perimeter);
    expect(item(piles, "foundation-concrete")).toBeUndefined();
    const strip = calculateHouseEstimate(defaults);
    const slab = calculateHouseEstimate({ ...defaults, foundation: "slab" });
    expect(item(strip, "foundation-concrete").quantity).not.toBe(
      item(slab, "foundation-concrete").quantity,
    );
  });
  it("перекрытие и лестница появляются только при двух этажах", () => {
    const one = calculateHouseEstimate(defaults);
    const two = calculateHouseEstimate(normalizeForArea({ ...defaults, floors: 2 }));
    expect(item(one, "walls-staircase")).toBeUndefined();
    expect(item(two, "walls-staircase").quantity).toBe(1);
    expect(item(two, "walls-intermediate-floor").quantity).toBe(defaults.area / 2);
  });
  it("перегородки и отделка реагируют на число комнат и высоту", () => {
    const a = calculateHouseEstimate({ ...defaults, bedrooms: 1 });
    const b = calculateHouseEstimate({ ...defaults, bedrooms: 6 });
    expect(item(b, "walls-partitions").quantity).toBeGreaterThan(
      item(a, "walls-partitions").quantity,
    );
    expect(item(b, "interior-plaster").quantity).toBeGreaterThan(
      item(a, "interior-plaster").quantity,
    );
    const higher = calculateHouseEstimate({ ...defaults, wallHeight: 4 });
    expect(item(higher, "walls-partitions").quantity).toBeGreaterThan(
      item(b, "walls-partitions").quantity,
    );
  });
  it("не допускает переполнения произведения и скрытой лишней точности", () => {
    expect(() =>
      calculateItemTotal({
        id: "overflow",
        name: "Overflow",
        unit: "шт.",
        quantity: 1e308,
        unitPrice: 1e308,
      }),
    ).toThrow(RangeError);
    expect(() => calculateHouseEstimate({ ...defaults, area: 120.123 })).toThrow(RangeError);
    const normalized = normalizeForArea({
      ...defaults,
      area: 120.123,
      wallHeight: 3.333,
      perimeter: 44.444,
    });
    expect(normalized).toMatchObject({ area: 120.1, wallHeight: 3.3, perimeter: 44.4 });
    expect(calculateHouseEstimate(normalized).total).toBeGreaterThan(0);
  });
  it("проверяет общий бюджет площади комнат и нормализует переход на маленький проект", () => {
    const small = normalizeForArea({ ...defaults, area: 72, bedrooms: 4, bathrooms: 2 });
    expect(small.bedrooms).toBeLessThan(4);
    expect(fitsRoomLayout(small.area, small.floors, small.bedrooms, small.bathrooms)).toBe(true);
    const crowded = normalizeForArea({ ...defaults, area: 108, bedrooms: 6, bathrooms: 3 });
    expect(crowded.bathrooms).toBe(2);
    expect(calculateHouseEstimate(crowded).total).toBeGreaterThan(0);
  });
  it("проверяет 44 928 сочетаний технологий, геометрии и демо-сценариев", () => {
    let count = 0;
    for (const area of [30, 60, 72, 120, 180, 360, 1000])
      for (const floors of [1, 2] as const) {
        if (area < minimumArea(floors)) continue;
        for (const region of Object.keys(DEMO_REGIONS))
          for (const delivery of Object.keys(DEMO_DELIVERY))
            for (const wallMaterial of Object.keys(WALL_MATERIALS))
              for (const foundation of ["strip", "slab", "piles"])
                for (const roof of ["metal", "soft"])
                  for (const finish of ["standard", "comfort"])
                    for (const projectType of Object.keys(PROJECT_TYPES)) {
                      const parameters = normalizeForArea({
                        ...defaults,
                        area,
                        floors,
                        region,
                        delivery,
                        wallMaterial,
                        foundation,
                        roof,
                        finish,
                        projectType,
                      } as HouseParameters);
                      check(calculateHouseEstimate(parameters));
                      count++;
                    }
      }
    expect(count).toBe(44928);
  }, 20000);
  it("проверяет все целые площади, допустимые комнаты и обе границы периметра", () => {
    for (let area = 30; area <= 1000; area++)
      for (const floors of [1, 2] as const) {
        if (area < minimumArea(floors)) continue;
        for (
          let bedrooms = minimumBedrooms(area);
          bedrooms <= maximumBedrooms(area, floors);
          bedrooms++
        )
          for (
            let bathrooms = minimumBathrooms(area, bedrooms);
            bathrooms <= maximumBathrooms(area, floors, bedrooms);
            bathrooms++
          )
            for (const perimeter of [
              minimumPerimeter(area, floors),
              maximumPerimeter(area, floors),
            ]) {
              check(
                calculateHouseEstimate({
                  ...defaults,
                  area,
                  floors,
                  bedrooms,
                  bathrooms,
                  perimeter,
                }),
              );
            }
      }
  }, 20000);
  it("все 256 составов работ корректны для новых технологий и доставки", () => {
    const ids = DEMO_ESTIMATE_CATALOG.map((stage) => stage.id);
    for (const wallMaterial of ["aeratedConcrete", "frame"] as const)
      for (const foundation of ["strip", "slab", "piles"] as const)
        for (let mask = 0; mask < 256; mask++) {
          const result = calculateHouseEstimate(
            { ...defaults, wallMaterial, foundation, delivery: "longDistance" },
            { mode: "stages", stageIds: ids.filter((_, index) => mask & (1 << index)) },
          );
          check(result);
          if (!mask) expect(result.total).toBe(0);
        }
  });
});
