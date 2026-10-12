import { projects } from "./catalog";

export const FAVORITES_STORAGE_KEY = "osnova.favorite-projects.v1";

export function normalizeFavoriteIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const known = new Set(projects.map((project) => project.number));
  return [...new Set(value.filter((id): id is string => typeof id === "string" && known.has(id)))];
}

export function readFavoriteIds(storage: Pick<Storage, "getItem">): string[] {
  try {
    const saved = storage.getItem(FAVORITES_STORAGE_KEY);
    return saved ? normalizeFavoriteIds(JSON.parse(saved)) : [];
  } catch {
    return [];
  }
}

export function writeFavoriteIds(storage: Pick<Storage, "setItem">, ids: readonly string[]): void {
  try {
    storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(normalizeFavoriteIds(ids)));
  } catch {
    // The shortlist still works in memory if the browser disallows local storage.
  }
}
