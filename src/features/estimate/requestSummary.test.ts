import { describe, expect, it } from "vitest";
import { calculateHouseEstimate } from "./calculations";
import { DEFAULT_HOUSE_PARAMETERS } from "./catalog";
import { formatRequestSummary } from "./requestSummary";

describe("сводка расчёта для копирования", () => {
  it("отражает выбранный проект, этапы и текущие демо-ориентиры", () => {
    const parameters = {
      ...DEFAULT_HOUSE_PARAMETERS,
      area: 118,
      region: "ural" as const,
      delivery: "regional" as const,
    };
    const estimate = calculateHouseEstimate(parameters, {
      mode: "stages",
      stageIds: ["foundation", "roof"],
    });
    const summary = formatRequestSummary(parameters, estimate, "Север", "stages");

    expect(summary).toContain("Проект из каталога: Север");
    expect(summary).toContain("Площадь: 118 м²");
    expect(summary).toContain("Формат: Отдельные этапы");
    expect(summary).toContain("Включённые этапы: Фундамент, Кровля");
    expect(summary).not.toContain("Коробка дома");
    expect(summary).toContain("Регион: Урал; доставка: 50–300 км");
    expect(summary).toContain(estimate.dataVersion);
    expect(summary).toContain("Не являются сметой или коммерческим предложением");
  });

  it("не переименовывает полный набор выбранных этапов в формат под ключ", () => {
    const estimate = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS, {
      mode: "stages",
      stageIds: [
        "foundation",
        "walls",
        "roof",
        "windows-doors",
        "facade",
        "engineering",
        "interior",
        "completion",
      ],
    });
    const summary = formatRequestSummary(DEFAULT_HOUSE_PARAMETERS, estimate, null, "stages");
    expect(summary).toContain("Формат: Отдельные этапы");
  });
});
