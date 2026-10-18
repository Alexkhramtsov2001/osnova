import { QUESTION_COUNT, nextQuestion, questionBank, type Answers } from "./recommendation";

export const FINDER_DRAFT_KEY = "osnova.finder-draft.v1";
export type FinderDraft = { step: number; questionIds: string[]; answers: Partial<Answers> };
export const createFinderDraft = (): FinderDraft => ({
  step: 0,
  questionIds: ["purpose"],
  answers: {},
});

export function readFinderDraft(storage: Pick<Storage, "getItem">): FinderDraft | null {
  try {
    const value = JSON.parse(storage.getItem(FINDER_DRAFT_KEY) ?? "null") as FinderDraft | null;
    if (
      !value ||
      !Number.isInteger(value.step) ||
      value.step < 0 ||
      value.step > QUESTION_COUNT ||
      !Array.isArray(value.questionIds) ||
      value.questionIds.length < 1 ||
      value.questionIds.length > QUESTION_COUNT ||
      new Set(value.questionIds).size !== value.questionIds.length ||
      (value.step === QUESTION_COUNT
        ? value.questionIds.length !== QUESTION_COUNT
        : value.step >= value.questionIds.length) ||
      !value.answers ||
      typeof value.answers !== "object" ||
      Array.isArray(value.answers)
    )
      return null;
    const answers: Partial<Answers> = {};
    for (const [index, id] of value.questionIds.entries()) {
      const expected = nextQuestion(answers, value.questionIds.slice(0, index));
      const question = questionBank.find((item) => item.id === id);
      if (!question || expected?.id !== id) return null;
      const answer = value.answers[id];
      if (answer !== undefined) {
        if (!question.options.some((option) => option.value === answer)) return null;
        answers[id] = answer;
      } else if (index < value.step) return null;
    }
    return { step: value.step, questionIds: [...value.questionIds], answers };
  } catch {
    return null;
  }
}

export function writeFinderDraft(storage: Pick<Storage, "setItem">, draft: FinderDraft): boolean {
  try {
    storage.setItem(FINDER_DRAFT_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}
