import { normalizeConfiguration, type SavedEstimateConfiguration } from "./savedEstimates";

const key = "osnova.calculator-draft.v1";
export type CalculatorDraft = SavedEstimateConfiguration & {
  mode: "turnkey" | "stages";
  sourceProjectNumber?: string | null;
};

export function readCalculatorDraft(storage: Pick<Storage, "getItem">): CalculatorDraft | null {
  try {
    const value: unknown = JSON.parse(storage.getItem(key) ?? "null");
    if (!value || typeof value !== "object") return null;
    const candidate = value as Partial<CalculatorDraft>;
    if (candidate.mode !== "turnkey" && candidate.mode !== "stages") return null;
    const configuration = normalizeConfiguration(candidate, candidate.mode, true);
    return configuration
      ? {
          ...configuration,
          mode: candidate.mode,
          sourceProjectNumber:
            typeof candidate.sourceProjectNumber === "string" &&
            /^0[1-8]$/.test(candidate.sourceProjectNumber)
              ? candidate.sourceProjectNumber
              : null,
        }
      : null;
  } catch {
    return null;
  }
}

export function writeCalculatorDraft(
  storage: Pick<Storage, "setItem">,
  draft: CalculatorDraft,
): boolean {
  try {
    storage.setItem(key, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}
