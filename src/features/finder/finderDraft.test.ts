import { describe, expect, it } from "vitest";
import { QUESTION_COUNT, nextQuestion, updateAnswer, type Answers } from "./recommendation";
import {
  createFinderDraft,
  readFinderDraft,
  writeFinderDraft,
  type FinderDraft,
} from "./finderDraft";

function completedDraft(): FinderDraft {
  let answers: Partial<Answers> = {};
  const questionIds: string[] = [];
  for (let step = 0; step < QUESTION_COUNT; step++) {
    const question = nextQuestion(answers, questionIds)!;
    questionIds.push(question.id);
    answers = updateAnswer(answers, question.id, question.options[0].value);
  }
  return { step: QUESTION_COUNT, questionIds, answers };
}
const read = (value: unknown) => readFinderDraft({ getItem: () => JSON.stringify(value) });

describe("прогресс подбора в пределах вкладки", () => {
  it("восстанавливает завершённый подбор и ответы", () => {
    const draft = completedDraft();
    expect(read(draft)).toEqual(draft);
  });
  it("восстанавливает текущий вопрос и ещё не заполненный ответ", () => {
    const draft = createFinderDraft();
    const answers = updateAnswer(draft.answers, "purpose", "weekends");
    expect(read({ step: 1, questionIds: ["purpose", "bedrooms"], answers })).toEqual({
      step: 1,
      questionIds: ["purpose", "bedrooms"],
      answers,
    });
  });
  it("сохраняет последующие ответы при возврате к предыдущему шагу", () => {
    const draft = { ...completedDraft(), step: 2 };
    expect(read(draft)).toEqual(draft);
  });
  it.each([
    { step: 8, questionIds: ["purpose"], answers: {} },
    { step: 0, questionIds: ["unknown"], answers: {} },
    { step: 0, questionIds: ["purpose"], answers: { purpose: "unknown" } },
    { step: 1, questionIds: ["purpose", "bedrooms"], answers: {} },
    { step: 1, questionIds: ["purpose", "purpose"], answers: { purpose: "weekends" } },
  ])("отбрасывает повреждённое состояние", (value) => {
    expect(read(value)).toBeNull();
  });
  it("перезапуск заменяет прежний прогресс пустым опросом", () => {
    let serialized = JSON.stringify(completedDraft());
    expect(
      writeFinderDraft(
        {
          setItem: (_key, value) => {
            serialized = value;
          },
        },
        createFinderDraft(),
      ),
    ).toBe(true);
    expect(readFinderDraft({ getItem: () => serialized })).toEqual(createFinderDraft());
  });
  it("не мешает подбору при недоступном хранилище", () => {
    expect(
      readFinderDraft({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toBeNull();
    expect(
      writeFinderDraft(
        {
          setItem: () => {
            throw new Error("quota");
          },
        },
        createFinderDraft(),
      ),
    ).toBe(false);
  });
});
