import { describe, expect, it } from "vitest";
import { calculateHouseEstimate } from "./calculations";
import { DEFAULT_HOUSE_PARAMETERS, DEMO_ESTIMATE_CATALOG } from "./catalog";
import type { EstimateScope } from "./types";

describe("Состав работ", () => {
  it("полный выбор отдельных этапов совпадает с расчётом под ключ", () => {
    expect(
      calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS, {
        mode: "stages",
        stageIds: DEMO_ESTIMATE_CATALOG.map((stage) => stage.id),
      }),
    ).toEqual(calculateHouseEstimate());
  });

  it("включает в итог и границы вилки только выбранный фундамент", () => {
    const full = calculateHouseEstimate();
    const foundation = full.stages.find((stage) => stage.id === "foundation")!;
    const selected = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS, {
      mode: "stages",
      stageIds: ["foundation"],
    });
    expect(selected.total).toBe(foundation.total);
    expect(selected.minTotal).toBe(foundation.minTotal);
    expect(selected.maxTotal).toBe(foundation.maxTotal);
    expect(selected.stages.filter((stage) => stage.included).map((stage) => stage.id)).toEqual([
      "foundation",
    ]);
    expect(selected.stages).toHaveLength(full.stages.length);
  });

  it("суммирует два этапа без зависимости от порядка и повторов идентификаторов", () => {
    const full = calculateHouseEstimate();
    const expected = full.stages.filter((stage) => stage.id === "walls" || stage.id === "roof");
    const result = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS, {
      mode: "stages",
      stageIds: ["roof", "walls", "roof"],
    });
    expect(result.total).toBeCloseTo(
      expected.reduce((sum, stage) => sum + stage.total, 0),
      2,
    );
    expect(result.minTotal).toBeCloseTo(
      expected.reduce((sum, stage) => sum + stage.minTotal, 0),
      2,
    );
    expect(result.maxTotal).toBeCloseTo(
      expected.reduce((sum, stage) => sum + stage.maxTotal, 0),
      2,
    );
  });

  it("не добавляет в фундамент доплату за исключённую отделку", () => {
    const scope: EstimateScope = { mode: "stages", stageIds: ["foundation"] };
    const standard = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS, scope);
    const comfort = calculateHouseEstimate(
      { ...DEFAULT_HOUSE_PARAMETERS, finish: "comfort" },
      scope,
    );
    expect(comfort.total).toBe(standard.total);
    expect(comfort.minTotal).toBe(standard.minTotal);
    expect(comfort.maxTotal).toBe(standard.maxTotal);
  });

  it("пустой состав не включает ни один этап и даёт нулевые внутренние суммы", () => {
    const result = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS, {
      mode: "stages",
      stageIds: [],
    });
    expect(result.total).toBe(0);
    expect(result.minTotal).toBe(0);
    expect(result.maxTotal).toBe(0);
    expect(result.stages.every((stage) => !stage.included)).toBe(true);
  });

  it.each([{ mode: "unknown" }, { mode: "stages", stageIds: ["unknown"] }, { mode: "stages" }])(
    "отклоняет неизвестный формат или состав: %o",
    (scope) => {
      expect(() =>
        calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS, scope as EstimateScope),
      ).toThrow(RangeError);
    },
  );
});
