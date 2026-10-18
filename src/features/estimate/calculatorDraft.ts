import { normalizeConfiguration, type SavedEstimateConfiguration } from "./savedEstimates";
import { DEFAULT_HOUSE_PARAMETERS, DEMO_ESTIMATE_CATALOG } from "./catalog";
import { normalizeForArea } from "./constraints";
import type { Project } from "../projects/catalog";
import { getProjectParameters } from "../projects/estimates";

const key = "osnova.calculator-draft.v1";
let lastWriteFailed = false;

export function hasUnsavedCalculatorDraft(): boolean {
  return lastWriteFailed;
}
export type CalculatorDraft = SavedEstimateConfiguration & {
  mode: "turnkey" | "stages";
  sourceProjectNumber?: string | null;
};

export function resolveCalculatorDraft(
  draft: CalculatorDraft | null,
  project: Project | undefined,
  returningThroughHistory: boolean,
): CalculatorDraft {
  // History restores the latest edit, not the project named by an older URL.
  if (
    draft &&
    (!project || returningThroughHistory || draft.sourceProjectNumber === project.number)
  )
    return draft;

  if (draft && project)
    return {
      ...draft,
      parameters: normalizeForArea({
        ...draft.parameters,
        projectType: "standard",
        area: project.area,
        floors: project.floors,
        bedrooms: project.bedrooms,
        perimeter: Math.ceil(4 * Math.sqrt(project.area / project.floors)),
      }),
      projectName: project.name,
      sourceProjectNumber: project.number,
    };

  return {
    parameters: project ? getProjectParameters(project) : { ...DEFAULT_HOUSE_PARAMETERS },
    projectName: project?.name ?? null,
    sourceProjectNumber: project?.number ?? null,
    mode: "turnkey",
    stageIds: DEMO_ESTIMATE_CATALOG.map((stage) => stage.id),
  };
}

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
  storage: Pick<Storage, "setItem"> & Partial<Pick<Storage, "removeItem">>,
  draft: CalculatorDraft,
): boolean {
  try {
    storage.setItem(key, JSON.stringify(draft));
    lastWriteFailed = false;
    return true;
  } catch {
    lastWriteFailed = true;
    try {
      // An older checkout snapshot must not become valid again after a reload.
      storage.removeItem?.(key);
    } catch {
      // The in-memory failure flag still blocks checkout while this page is open.
    }
    return false;
  }
}
