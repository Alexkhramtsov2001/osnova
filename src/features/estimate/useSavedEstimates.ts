import { useEffect, useState } from "react";
import {
  readSavedEstimates,
  SAVED_ESTIMATES_STORAGE_KEY,
  updateSavedEstimates,
  type SavedEstimate,
} from "./savedEstimates";

function readCurrent() {
  try {
    return readSavedEstimates(window.localStorage);
  } catch {
    return [];
  }
}

export function useSavedEstimates() {
  const [savedEstimates, setSavedEstimates] = useState(readCurrent);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === SAVED_ESTIMATES_STORAGE_KEY || event.key === null)
        setSavedEstimates(readCurrent());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  const mutate = async (update: (current: SavedEstimate[]) => SavedEstimate[]) => {
    try {
      const next = await updateSavedEstimates(window.localStorage, update);
      if (next === null) return false;
      setSavedEstimates(next);
      return true;
    } catch {
      return false;
    }
  };
  return { savedEstimates, mutate, refresh: () => setSavedEstimates(readCurrent()) };
}
