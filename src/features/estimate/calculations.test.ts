import { normalizeForArea } from "./constraints";
import { describe, expect, it } from "vitest";
import { calculateEstimateTotal, calculateHouseEstimate, calculateItemTotal } from "./calculations";
import { DEFAULT_HOUSE_PARAMETERS } from "./catalog";

describe("Расчёт позиции сметы", () => {
  it("умножает количество на цену", () => {
    expect(
      calculateItemTotal({
        id: "concrete",
        name: "Газобетон",
        unit: "м³",
        quantity: 10,
        unitPrice: 6500,
      }),
    ).toBe(65000);
  });

  it("округляет стоимость до копеек", () => {
    expect(
      calculateItemTotal({
        id: "material",
        name: "Материал",
        unit: "шт.",
        quantity: 3,
        unitPrice: 10.333,
      }),
    ).toBe(31);
  });

  it("отклоняет отрицательное количество", () => {
    expect(() =>
      calculateItemTotal({
        id: "material",
        name: "Материал",
        unit: "шт.",
        quantity: -1,
        unitPrice: 100,
      }),
    ).toThrow(RangeError);
  });

  it("отклоняет отрицательную цену", () => {
    expect(() =>
      calculateItemTotal({
        id: "material",
        name: "Материал",
        unit: "шт.",
        quantity: 1,
        unitPrice: -100,
      }),
    ).toThrow(RangeError);
  });
});

describe("Итоговая стоимость сметы", () => {
  it("суммирует несколько позиций", () => {
    expect(
      calculateEstimateTotal([
        {
          id: "material",
          name: "Материал",
          unit: "шт.",
          quantity: 10,
          unitPrice: 100,
        },
        {
          id: "work",
          name: "Работы",
          unit: "ч",
          quantity: 5,
          unitPrice: 200,
        },
      ]),
    ).toBe(2000);
  });

  it("возвращает ноль для пустой сметы", () => {
    expect(calculateEstimateTotal([])).toBe(0);
  });
});

describe("Расчёт сметы дома", () => {
  it("тип проекта не добавляет неоценённое проектирование к строительным этапам", () => {
    const standard = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS);
    for (const projectType of ["custom", "clientDrawings"] as const) {
      const result = calculateHouseEstimate({ ...DEFAULT_HOUSE_PARAMETERS, projectType });
      expect(result).toEqual(standard);
    }
    expect(() =>
      calculateHouseEstimate({ ...DEFAULT_HOUSE_PARAMETERS, projectType: "unknown" as "standard" }),
    ).toThrow(RangeError);
  });

  it("формирует восемь этапов строительства", () => {
    const result = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS);

    expect(result.stages).toHaveLength(8);
    expect(result.stages.every((stage) => stage.items.length > 0)).toBe(true);
  });

  it("итог равен сумме стоимости всех этапов", () => {
    const result = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS);

    const stagesTotal = result.stages.reduce((sum, stage) => sum + stage.total, 0);

    expect(result.total).toBe(stagesTotal);
    expect(result.minTotal).toBeLessThan(result.total);
    expect(result.maxTotal).toBeGreaterThan(result.total);
    expect(result.minTotal).toBeCloseTo(
      result.stages.reduce((sum, stage) => sum + stage.minTotal, 0),
      2,
    );
    expect(result.maxTotal).toBeCloseTo(
      result.stages.reduce((sum, stage) => sum + stage.maxTotal, 0),
      2,
    );
  });

  it("даёт демонстрационный ориентир, близкий к публичным пакетным ценам", () => {
    const result = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS);
    const pricePerSquareMeter = result.total / DEFAULT_HOUSE_PARAMETERS.area;

    expect(pricePerSquareMeter).toBeGreaterThan(65000);
    expect(pricePerSquareMeter).toBeLessThan(85000);
  });

  it("увеличение площади увеличивает стоимость сметы", () => {
    const smallHouse = calculateHouseEstimate({
      ...DEFAULT_HOUSE_PARAMETERS,
      area: 80,
    });

    const largeHouse = calculateHouseEstimate({
      ...DEFAULT_HOUSE_PARAMETERS,
      area: 160,
      perimeter: 51,
    });

    expect(largeHouse.total).toBeGreaterThan(smallHouse.total);
  });

  it("изменение типа фундамента влияет на стоимость", () => {
    const stripFoundation = calculateHouseEstimate({
      ...DEFAULT_HOUSE_PARAMETERS,
      foundation: "strip",
    });

    const slabFoundation = calculateHouseEstimate({
      ...DEFAULT_HOUSE_PARAMETERS,
      foundation: "slab",
    });

    expect(slabFoundation.total).toBeGreaterThan(stripFoundation.total);
  });

  it("отклоняет нулевую площадь дома", () => {
    expect(() =>
      calculateHouseEstimate({
        ...DEFAULT_HOUSE_PARAMETERS,
        area: 0,
      }),
    ).toThrow(RangeError);
  });
});
describe("Проверка параметров дома", () => {
  it.each([
    { area: 29 },
    { area: 1001 },
    { area: NaN },
    { wallHeight: 2.3 },
    { wallHeight: 5.1 },
    { perimeter: 9 },
    { perimeter: 201 },
  ])("отклоняет параметры за пределами интерфейса: %o", (overrides) => {
    expect(() => calculateHouseEstimate({ ...DEFAULT_HOUSE_PARAMETERS, ...overrides })).toThrow(
      RangeError,
    );
  });

  it.each([30, 1000])("принимает границу площади %s м²", (area) => {
    const parameters = normalizeForArea({ ...DEFAULT_HOUSE_PARAMETERS, area });
    expect(Number.isFinite(calculateHouseEstimate(parameters).total)).toBe(true);
  });

  it("общая площадь потолков не удваивается при выборе двух этажей", () => {
    for (const floors of [1, 2] as const) {
      const result = calculateHouseEstimate(
        normalizeForArea({ ...DEFAULT_HOUSE_PARAMETERS, floors }),
      );
      const ceiling = result.stages
        .find((stage) => stage.id === "interior")!
        .items.find((item) => item.id === "interior-ceiling")!;
      expect(ceiling.quantity).toBe(DEFAULT_HOUSE_PARAMETERS.area);
    }
  });

  it("считает плитный фундамент и кровлю от пятна застройки для двух этажей", () => {
    const oneFloor = calculateHouseEstimate({ ...DEFAULT_HOUSE_PARAMETERS, foundation: "slab" });
    const twoFloors = calculateHouseEstimate(
      normalizeForArea({ ...DEFAULT_HOUSE_PARAMETERS, foundation: "slab", floors: 2 }),
    );
    const quantity = (
      result: ReturnType<typeof calculateHouseEstimate>,
      stageId: string,
      itemId: string,
    ) =>
      result.stages.find((stage) => stage.id === stageId)!.items.find((item) => item.id === itemId)!
        .quantity;

    for (const itemId of [
      "foundation-earthworks",
      "foundation-cushion",
      "foundation-reinforcement",
      "foundation-concrete",
    ]) {
      expect(quantity(twoFloors, "foundation", itemId)).toBe(
        quantity(oneFloor, "foundation", itemId) / 2,
      );
    }
    expect(quantity(twoFloors, "roof", "roof-structure")).toBe(
      quantity(oneFloor, "roof", "roof-structure") / 2,
    );
  });

  it("керамический блок даёт конечную вилку и меняет только стоимость стен", () => {
    const base = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS);
    const ceramic = calculateHouseEstimate({
      ...DEFAULT_HOUSE_PARAMETERS,
      wallMaterial: "ceramicBlock",
    });

    expect(Number.isFinite(ceramic.total)).toBe(true);
    expect(ceramic.minTotal).toBeLessThan(ceramic.total);
    expect(ceramic.maxTotal).toBeGreaterThan(ceramic.total);
    expect(ceramic.total).toBeGreaterThan(base.total);
    for (const stage of base.stages) {
      const updated = ceramic.stages.find((item) => item.id === stage.id)!;
      if (stage.id === "walls") {
        expect(updated.total).toBeGreaterThan(stage.total);
      } else {
        expect(updated).toEqual(stage);
      }
    }
  });

  it("изменение материала стен влияет на стоимость этапа стен", () => {
    const aeratedConcrete = calculateHouseEstimate({
      ...DEFAULT_HOUSE_PARAMETERS,
      wallMaterial: "aeratedConcrete",
    });

    const brick = calculateHouseEstimate({
      ...DEFAULT_HOUSE_PARAMETERS,
      wallMaterial: "brick",
    });

    const wallsA = aeratedConcrete.stages.find((stage) => stage.id === "walls");

    const wallsB = brick.stages.find((stage) => stage.id === "walls");

    expect(wallsA).toBeDefined();
    expect(wallsB).toBeDefined();
    expect(wallsB!.total).toBeGreaterThan(wallsA!.total);
  });

  it("увеличение высоты стен увеличивает количество стеновых материалов", () => {
    const low = calculateHouseEstimate({
      ...DEFAULT_HOUSE_PARAMETERS,
      wallHeight: 2.5,
    });

    const high = calculateHouseEstimate({
      ...DEFAULT_HOUSE_PARAMETERS,
      wallHeight: 3.5,
    });

    const lowWalls = low.stages.find((stage) => stage.id === "walls")!;

    const highWalls = high.stages.find((stage) => stage.id === "walls")!;

    const lowBlocks = lowWalls.items.find((item) => item.id === "walls-blocks")!;

    const highBlocks = highWalls.items.find((item) => item.id === "walls-blocks")!;

    expect(highBlocks.quantity).toBeGreaterThan(lowBlocks.quantity);
  });

  it("отклоняет отрицательную площадь", () => {
    expect(() =>
      calculateHouseEstimate({
        ...DEFAULT_HOUSE_PARAMETERS,
        area: -10,
      }),
    ).toThrow(RangeError);
  });

  it("отклоняет бесконечную высоту стен", () => {
    expect(() =>
      calculateHouseEstimate({
        ...DEFAULT_HOUSE_PARAMETERS,
        wallHeight: Infinity,
      }),
    ).toThrow(RangeError);
  });

  it("у всех позиций сметы неотрицательные количества и цены", () => {
    const result = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS);

    for (const stage of result.stages) {
      for (const item of stage.items) {
        expect(item.quantity).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(item.quantity)).toBe(true);
        expect(item.unitPrice).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(item.unitPrice)).toBe(true);
      }
    }
  });
});
