import { describe, expect, it } from "vitest";
import {
  FAVORITES_STORAGE_KEY,
  normalizeFavoriteIds,
  readFavoriteIds,
  writeFavoriteIds,
} from "./favorites";

describe("локальный список избранных домов", () => {
  it("оставляет только известные уникальные номера в выбранном порядке", () => {
    expect(normalizeFavoriteIds(["03", "01", "03", "999", null, 2])).toEqual(["03", "01"]);
    expect(normalizeFavoriteIds({ projects: ["01"] })).toEqual([]);
  });

  it("безопасно читает повреждённые и недоступные данные", () => {
    expect(readFavoriteIds({ getItem: () => "broken json" })).toEqual([]);
    expect(
      readFavoriteIds({
        getItem: () => {
          throw new Error("blocked");
        },
      }),
    ).toEqual([]);
    expect(readFavoriteIds({ getItem: () => '["08","08","404"]' })).toEqual(["08"]);
  });

  it("сохраняет очищенный список и не ломается при запрете записи", () => {
    let saved = "";
    writeFavoriteIds(
      {
        setItem: (key, value) => {
          expect(key).toBe(FAVORITES_STORAGE_KEY);
          saved = value;
        },
      },
      ["02", "02", "404"],
    );
    expect(saved).toBe('["02"]');
    expect(() =>
      writeFavoriteIds(
        {
          setItem: () => {
            throw new Error("blocked");
          },
        },
        ["01"],
      ),
    ).not.toThrow();
  });
});
