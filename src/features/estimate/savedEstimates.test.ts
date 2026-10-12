import { describe, expect, it } from "vitest";
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
    expect(writeSavedEstimates(storage, [sample])).toBe(true);
    expect(readSavedEstimates(storage)).toEqual([sample]);
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
