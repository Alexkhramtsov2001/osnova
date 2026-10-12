import { describe, expect, it } from "vitest";
import { projects } from "./catalog";
import { calculateHouseEstimate } from "../estimate/calculations";
import {
  formatPriceRange,
  getProjectAdvantages,
  getProjectEstimate,
  getProjectParameters,
} from "./estimates";

describe("единая комплектация каталога", () => {
  it.each(projects)("цена $name воспроизводится в калькуляторе", (project) => {
    const parameters = getProjectParameters(project);
    const estimate = getProjectEstimate(project);
    expect(estimate).toEqual(calculateHouseEstimate(parameters));
    expect(estimate.stages.filter((stage) => stage.included)).toHaveLength(8);
    expect(parameters.wallMaterial).toBe("aeratedConcrete");
    expect(parameters.finish).toBe("standard");
    expect(parameters.area).toBe(project.area);
    expect(estimate.minTotal).toBeLessThan(estimate.maxTotal);
  });

  it("сравнивает преимущества только среди выбранных", () => {
    const compact = projects.find((project) => project.name === "Компакт")!;
    const large = projects.find((project) => project.name === "Простор")!;
    expect(getProjectAdvantages(compact, [compact, large]).join(" ")).toContain(
      "Самый низкий бюджет",
    );
    expect(getProjectAdvantages(large, [compact, large]).join(" ")).not.toContain(
      "Самый низкий бюджет",
    );
    expect(getProjectAdvantages(large, [compact, large]).join(" ")).toContain(
      "Максимальное число спален",
    );
    expect(getProjectAdvantages(compact, [compact])).toHaveLength(1);
  });

  it("показывает диапазон рублей с двумя знаками в миллионах", () => {
    expect(formatPriceRange(7_466_978, 10_102_382)).toBe("7,47–10,10 млн ₽");
  });
});
