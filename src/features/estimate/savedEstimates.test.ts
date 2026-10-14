import { describe, expect, it } from "vitest";
import { DEFAULT_HOUSE_PARAMETERS } from "./catalog";
import {
  normalizeSavedEstimates,
  readSavedEstimates,
  SAVED_ESTIMATES_STORAGE_KEY,
  writeSavedEstimates,
} from "./savedEstimates";

const sample = {
  id: "one",
  savedAt: "2026-10-13T10:00:00.000Z",
  title: "Проект Север",
  area: 164,
  mode: "turnkey" as const,
  dataVersion: "demo-1",
  summary: "Расчёт и допущения",
};
const withConfiguration = {
  ...sample,
  configuration: {
    parameters: { ...DEFAULT_HOUSE_PARAMETERS },
    stageIds: ["foundation", "walls"] as ("foundation" | "walls")[],
    projectName: "Север",
  },
};

describe("сохранённые расчёты", () => {
  it("отбрасывает повреждённые и повторные записи", () => {
    expect(
      normalizeSavedEstimates([sample, sample, { ...sample, id: "bad", summary: "" }]),
    ).toEqual([sample]);
  });

  it("переживает запись и чтение хранилища", () => {
    let stored = "";
    const storage = {
      getItem: (key: string) => (key === SAVED_ESTIMATES_STORAGE_KEY ? stored : null),
      setItem: (_key: string, value: string) => {
        stored = value;
      },
    };
    expect(writeSavedEstimates(storage, [withConfiguration, { ...sample, id: "legacy" }])).toBe(
      true,
    );
    expect(readSavedEstimates(storage)).toEqual([withConfiguration, { ...sample, id: "legacy" }]);
  });

  it("сохраняет старую текстовую сводку, если конфигурация повреждена", () => {
    const damaged = {
      ...withConfiguration,
      configuration: {
        ...withConfiguration.configuration,
        parameters: { ...DEFAULT_HOUSE_PARAMETERS, area: 5 },
      },
    };
    expect(normalizeSavedEstimates([damaged])).toEqual([sample]);
  });

  it("сохраняет старую конфигурацию, нормализуя геометрию по новым правилам", () => {
    const olderGeometry = {
      ...withConfiguration,
      area: 100,
      configuration: {
        ...withConfiguration.configuration,
        parameters: {
          ...DEFAULT_HOUSE_PARAMETERS,
          area: 100,
          floors: 2 as const,
          perimeter: 44,
        },
      },
    };
    const result = normalizeSavedEstimates([olderGeometry]);
    expect(result[0].configuration?.parameters.perimeter).toBe(36);
  });

  it("сообщает, когда браузер не разрешает запись", () => {
    expect(
      writeSavedEstimates(
        {
          setItem: () => {
            throw new Error("blocked");
          },
        },
        [sample],
      ),
    ).toBe(false);
    expect(readSavedEstimates({ getItem: () => "invalid json" })).toEqual([]);
  });
});
