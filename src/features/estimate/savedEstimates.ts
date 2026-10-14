import { DEMO_ESTIMATE_CATALOG } from "./catalog";
import { calculateHouseEstimate } from "./calculations";
import { normalizeForArea } from "./constraints";
import type { EstimateStageId, HouseParameters } from "./types";

export const SAVED_ESTIMATES_STORAGE_KEY = "osnova.saved-estimates.v1";
export const SAVED_ESTIMATES_LIMIT = 8;

export type SavedEstimateConfiguration = {
  parameters: HouseParameters;
  stageIds: EstimateStageId[];
  projectName: string | null;
};

export type SavedEstimate = {
  id: string;
  savedAt: string;
  title: string;
  area: number;
  mode: "turnkey" | "stages";
  dataVersion: string;
  summary: string;
  configuration?: SavedEstimateConfiguration;
};

const parameterKeys: (keyof HouseParameters)[] = [
  "projectType",
  "region",
  "delivery",
  "area",
  "floors",
  "bedrooms",
  "wallMaterial",
  "foundation",
  "roof",
  "finish",
  "wallHeight",
  "perimeter",
  "bathrooms",
];
const stageIds = new Set(DEMO_ESTIMATE_CATALOG.map((stage) => stage.id));

function normalizeConfiguration(
  value: unknown,
  mode: SavedEstimate["mode"],
): SavedEstimateConfiguration | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<SavedEstimateConfiguration>;
  if (
    !candidate.parameters ||
    typeof candidate.parameters !== "object" ||
    !Array.isArray(candidate.stageIds) ||
    (mode === "stages" && candidate.stageIds.length === 0) ||
    candidate.stageIds.length > stageIds.size ||
    candidate.stageIds.some((id) => !stageIds.has(id)) ||
    new Set(candidate.stageIds).size !== candidate.stageIds.length ||
    (candidate.projectName !== null &&
      (typeof candidate.projectName !== "string" ||
        !candidate.projectName.trim() ||
        candidate.projectName.length > 120))
  )
    return undefined;

  const rawParameters = Object.fromEntries(
    parameterKeys.map((key) => [key, candidate.parameters![key]]),
  ) as HouseParameters;
  if (
    !Number.isFinite(rawParameters.area) ||
    rawParameters.area < 30 ||
    rawParameters.area > 1000 ||
    (rawParameters.floors !== 1 && rawParameters.floors !== 2)
  ) {
    return undefined;
  }
  const parameters = normalizeForArea(rawParameters);
  try {
    calculateHouseEstimate(
      parameters,
      mode === "turnkey" ? { mode: "turnkey" } : { mode: "stages", stageIds: candidate.stageIds },
    );
  } catch {
    return undefined;
  }
  return { parameters, stageIds: [...candidate.stageIds], projectName: candidate.projectName };
}

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
    .map((item) => {
      const configuration = normalizeConfiguration(item.configuration, item.mode);
      const snapshot = {
        id: item.id,
        savedAt: item.savedAt,
        title: item.title,
        area: item.area,
        mode: item.mode,
        dataVersion: item.dataVersion,
        summary: item.summary,
      };
      return configuration ? { ...snapshot, configuration } : snapshot;
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
