import { describe, expect, it } from "vitest";
import { recommendProject, type Answers } from "./recommendation";

const base: Answers = {
  purpose: "permanent",
  bedrooms: "2",
  floors: "1",
  area: "compact",
  plot: "compact",
  budget: "9",
  priority: "economy",
};
describe("подбор дома", () => {
  it("предлагает компактный одноэтажный дом паре с ограниченным бюджетом", () => {
    const result = recommendProject(base);
    expect(result.project.number).toBe("04");
    expect(result.compromises).toEqual([]);
  });
  it("выбирает летнюю концепцию с четырьмя спальнями для отдыха в саду", () => {
    const result = recommendProject({
      ...base,
      purpose: "summer",
      bedrooms: "4",
      area: "medium",
      plot: "spacious",
      budget: "any",
      priority: "garden",
    });
    expect(result.project.number).toBe("06");
    expect(result.compromises).toEqual([]);
  });
  it("не обещает полного совпадения при несовместимых пожеланиях", () => {
    const result = recommendProject({ ...base, bedrooms: "5", area: "large" });
    expect(result.compromises.length).toBeGreaterThan(0);
    expect(result.reasons.some((reason) => reason.includes("Спален: 5"))).toBe(
      result.project.bedrooms === 5,
    );
  });
  it("при равных основных критериях учитывает приоритет площади", () => {
    const answers = {
      ...base,
      bedrooms: "5",
      floors: "2",
      area: "large",
      plot: "spacious",
      budget: "any",
    };
    expect(recommendProject({ ...answers, priority: "economy" }).project.number).toBe("05");
    expect(recommendProject({ ...answers, priority: "space" }).project.number).toBe("07");
  });
});
