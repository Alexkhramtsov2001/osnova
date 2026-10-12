export const SAVED_ESTIMATES_STORAGE_KEY = "osnova.saved-estimates.v1";
export const SAVED_ESTIMATES_LIMIT = 8;

export type SavedEstimate = {
  id: string;
  savedAt: string;
  title: string;
  area: number;
  mode: "turnkey" | "stages";
  dataVersion: string;
  summary: string;
};

export function normalizeSavedEstimates(value: unknown): SavedEstimate[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .filter((item): item is SavedEstimate => {
      if (!item || typeof item !== "object") return false;
      const entry = item as Partial<SavedEstimate>;
      if (
        typeof entry.id !== "string" ||
        !entry.id ||
        seen.has(entry.id) ||
        typeof entry.savedAt !== "string" ||
        !Number.isFinite(Date.parse(entry.savedAt)) ||
        typeof entry.title !== "string" ||
        !entry.title ||
        entry.title.length > 120 ||
        typeof entry.area !== "number" ||
        !Number.isFinite(entry.area) ||
        entry.area < 30 ||
        entry.area > 1000 ||
        (entry.mode !== "turnkey" && entry.mode !== "stages") ||
        typeof entry.dataVersion !== "string" ||
        !entry.dataVersion ||
        entry.dataVersion.length > 80 ||
        typeof entry.summary !== "string" ||
        !entry.summary ||
        entry.summary.length > 20000
      )
        return false;
      seen.add(entry.id);
      return true;
    })
    .slice(0, SAVED_ESTIMATES_LIMIT);
}

export function readSavedEstimates(storage: Pick<Storage, "getItem">): SavedEstimate[] {
  try {
    const raw = storage.getItem(SAVED_ESTIMATES_STORAGE_KEY);
    return raw ? normalizeSavedEstimates(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function writeSavedEstimates(
  storage: Pick<Storage, "setItem">,
  items: readonly SavedEstimate[],
): boolean {
  try {
    storage.setItem(SAVED_ESTIMATES_STORAGE_KEY, JSON.stringify(normalizeSavedEstimates(items)));
    return true;
  } catch {
    return false;
  }
}
