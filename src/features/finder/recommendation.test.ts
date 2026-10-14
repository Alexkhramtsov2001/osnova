import { describe, expect, it } from "vitest";
import {
  recommendProject,
  availableOptions,
  updateAnswer,
  matchingProjects,
  questions,
  type Answers,
} from "./recommendation";

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
    expect(result?.project.number).toBe("04");
    expect(result).not.toBeNull();
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
    expect(result?.project.number).toBe("06");
    expect(result).not.toBeNull();
  });
  it("не подменяет несовместимые требования ближайшим проектом", () => {
    expect(recommendProject({ ...base, bedrooms: "5", area: "large" })).toBeNull();
    expect(
      recommendProject({ ...base, bedrooms: "5", floors: "2", area: "large", budget: "9" }),
    ).toBeNull();
  });
  it("после пяти спален оставляет только совместимые этажность, площадь и бюджет", () => {
    const answers = { purpose: "permanent", bedrooms: "5" };
    expect(availableOptions("floors", answers).map((o) => o.value)).toEqual(["2", "any"]);
    expect(availableOptions("area", { ...answers, floors: "2" }).map((o) => o.value)).toEqual([
      "large",
      "any",
    ]);
    expect(
      availableOptions("budget", { ...answers, floors: "2", area: "large", plot: "any" }).map(
        (o) => o.value,
      ),
    ).toEqual(["any"]);
  });
  it("изменение раннего ответа очищает все зависимые ответы", () => {
    const changed = updateAnswer(base, "bedrooms", "5");
    expect(changed).toEqual({ purpose: "permanent", bedrooms: "5" });
    expect(updateAnswer(changed, "floors", "1")).toEqual(changed);
    expect(updateAnswer(base, "bedrooms", "2")).toEqual(base);
  });
  it("каждая доступная цепочка завершается только проектом, подходящим всем условиям", () => {
    let leaves = 0;
    function visit(answers: Partial<Answers>, index: number) {
      if (index === questions.length) {
        const result = recommendProject(answers as Answers);
        expect(result).not.toBeNull();
        expect(matchingProjects(answers)).toContain(result?.project);
        leaves++;
        return;
      }
      const question = questions[index];
      const options = availableOptions(question.id, answers);
      expect(options.length).toBeGreaterThan(0);
      for (const option of options) visit({ ...answers, [question.id]: option.value }, index + 1);
    }
    visit({}, 0);
    expect(leaves).toBeGreaterThan(100);
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
    expect(recommendProject({ ...answers, priority: "economy" })?.project.number).toBe("05");
    expect(recommendProject({ ...answers, priority: "space" })?.project.number).toBe("07");
  });
});
