import { describe, expect, it } from "vitest";
import { projects } from "../projects/catalog";
import { getProjectParameters } from "../projects/estimates";
import { DEFAULT_HOUSE_PARAMETERS } from "./catalog";
import { calculateHouseEstimate } from "./calculations";
import {
  readCalculatorDraft,
  resolveCalculatorDraft,
  writeCalculatorDraft,
  hasUnsavedCalculatorDraft,
  type CalculatorDraft,
} from "./calculatorDraft";

const north = projects.find((project) => project.number === "02")!;
const compact = projects.find((project) => project.number === "04")!;
const userDraft: CalculatorDraft = {
  parameters: {
    ...DEFAULT_HOUSE_PARAMETERS,
    area: 1000,
    perimeter: 127,
    bedrooms: 6,
    bathrooms: 4,
    wallMaterial: "frame",
    foundation: "piles",
    roof: "soft",
    finish: "comfort",
    region: "ural",
    delivery: "regional",
    wallHeight: 3.5,
  },
  projectName: null,
  sourceProjectNumber: null,
  mode: "stages",
  stageIds: ["foundation", "roof"],
};

describe("перенос проектного черновика", () => {
  it("отмечает ошибку записи для оформления и снимает её после успешной записи", () => {
    let olderSnapshot: string | null = JSON.stringify(userDraft);
    try {
      expect(
        writeCalculatorDraft(
          {
            setItem: () => {
              throw new Error("quota");
            },
            removeItem: () => {
              olderSnapshot = null;
            },
          },
          userDraft,
        ),
      ).toBe(false);
      expect(hasUnsavedCalculatorDraft()).toBe(true);
      expect(readCalculatorDraft({ getItem: () => olderSnapshot })).toBeNull();
    } finally {
      writeCalculatorDraft({ setItem: () => {} }, userDraft);
    }
    expect(hasUnsavedCalculatorDraft()).toBe(false);
  });
  it("новый посетитель получает параметры выбранного дома", () => {
    const draft = resolveCalculatorDraft(null, north, false);
    expect(draft.parameters).toEqual(getProjectParameters(north));
    expect(draft.sourceProjectNumber).toBe("02");
    expect(draft.stageIds).toHaveLength(8);
  });

  it("смена дома сохраняет комплектацию и нормализует комнаты", () => {
    const draft = resolveCalculatorDraft(userDraft, compact, false);
    expect(draft.parameters).toMatchObject({
      area: compact.area,
      floors: compact.floors,
      bedrooms: compact.bedrooms,
      wallMaterial: "frame",
      foundation: "piles",
      roof: "soft",
      finish: "comfort",
      region: "ural",
      delivery: "regional",
      wallHeight: 3.5,
      bathrooms: 2,
    });
    expect(draft.mode).toBe("stages");
    expect(draft.stageIds).toEqual(["foundation", "roof"]);
    expect(draft.sourceProjectNumber).toBe("04");
    expect(calculateHouseEstimate(draft.parameters).total).toBeGreaterThan(0);
    expect(userDraft.parameters.area).toBe(1000);
  });

  it("тот же проект не заменяет пользовательские изменения типовым снимком", () => {
    const edited = {
      ...resolveCalculatorDraft(userDraft, north, false),
      parameters: { ...getProjectParameters(north), area: 180, perimeter: 38 },
    };
    expect(resolveCalculatorDraft(edited, north, false)).toEqual(edited);
  });

  it("возврат к URL другого проекта не перекрывает более новый черновик", () => {
    const latest = resolveCalculatorDraft(userDraft, compact, false);
    expect(resolveCalculatorDraft(latest, north, true)).toEqual(latest);
    expect(resolveCalculatorDraft(latest, north, false).sourceProjectNumber).toBe("02");
  });

  it("переход без project сохраняет происхождение и последующее восстановление", () => {
    const selected = resolveCalculatorDraft(userDraft, north, false);
    const edited = {
      ...resolveCalculatorDraft(selected, undefined, false),
      parameters: { ...selected.parameters, area: 180, perimeter: 38 },
    };
    let serialized = "";
    expect(
      writeCalculatorDraft(
        {
          setItem: (_key, value) => {
            serialized = value;
          },
        },
        edited,
      ),
    ).toBe(true);
    const restored = readCalculatorDraft({ getItem: () => serialized });
    expect(restored?.sourceProjectNumber).toBe("02");
    expect(resolveCalculatorDraft(restored, north, true).parameters.area).toBe(180);
  });

  it("возврат после входа без fromCatalog сохраняет настройки записанного черновика", () => {
    let serialized = "";
    writeCalculatorDraft(
      {
        setItem: (_key, value) => {
          serialized = value;
        },
      },
      userDraft,
    );
    const afterLogin = resolveCalculatorDraft(
      readCalculatorDraft({ getItem: () => serialized }),
      north,
      false,
    );
    expect(afterLogin).toEqual(resolveCalculatorDraft(userDraft, north, false));
    expect(afterLogin.parameters.wallMaterial).toBe("frame");
    expect(afterLogin.mode).toBe("stages");
  });
});
