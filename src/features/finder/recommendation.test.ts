import { describe, expect, it } from "vitest";
import {
  QUESTION_COUNT,
  matchingProjects,
  nextQuestion,
  questionBank,
  recommendProject,
  type Answers,
} from "./recommendation";

describe("подбор дома", () => {
  it("использует банк больше семи вопросов и всегда выбирает ровно семь", () => {
    expect(questionBank.length).toBeGreaterThan(QUESTION_COUNT);
    expect(questionBank.every((question) => question.options.length === 4)).toBe(true);
    const answers: Partial<Answers> = {};
    const asked = ["purpose"];
    answers.purpose = "permanent";
    while (asked.length < QUESTION_COUNT) {
      const next = nextQuestion(answers, asked);
      expect(next).not.toBeNull();
      expect(next?.options).toHaveLength(4);
      asked.push(next!.id);
      answers[next!.id] = next!.options[0].value;
    }
    expect(asked).toHaveLength(7);
    expect(nextQuestion(answers, asked)).toBeNull();
  });

  it("не предлагает противоречивую рекомендацию при пяти спальнях и одном этаже", () => {
    const answers = { purpose: "permanent", bedrooms: "5", floors: "1" };
    expect(matchingProjects(answers)).toHaveLength(0);
    expect(recommendProject(answers)).toBeNull();
  });

  it("показывает проект только при соответствии жёстким ограничениям", () => {
    const result = recommendProject({
      purpose: "permanent",
      bedrooms: "2",
      floors: "1",
      area: "compact",
      plot: "compact",
      budget: "9",
    });
    expect(result).not.toBeNull();
    expect(matchingProjects({ bedrooms: "5", area: "compact" })).toHaveLength(0);
  });
});
