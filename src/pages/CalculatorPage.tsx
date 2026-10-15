import { useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import EstimateCalculator from "../features/estimate/EstimateCalculator";
import { readCalculatorDraft, type CalculatorDraft } from "../features/estimate/calculatorDraft";
import { normalizeForArea } from "../features/estimate/constraints";
import { DEFAULT_HOUSE_PARAMETERS, DEMO_ESTIMATE_CATALOG } from "../features/estimate/catalog";
import type { HouseParameters } from "../features/estimate/types";
import { projects } from "../features/projects/catalog";
import { getProjectParameters } from "../features/projects/estimates";
export default function CalculatorPage() {
  const location = useLocation();
  const startingProject = projects.find(
    (project) => project.number === new URLSearchParams(window.location.search).get("project"),
  );
  const navigationType = useNavigationType();
  const [initialDraft] = useState<CalculatorDraft>(() => {
    let draft: CalculatorDraft | null = null;
    try {
      draft = readCalculatorDraft(window.sessionStorage);
    } catch {
      /* Хранилище может быть недоступно. */
    }
    if (
      draft &&
      (!startingProject ||
        (navigationType === "POP" && draft.sourceProjectNumber === startingProject.number))
    )
      return draft;
    if (draft && startingProject && location.state?.fromCatalog)
      return {
        ...draft,
        parameters: normalizeForArea({
          ...draft.parameters,
          projectType: "standard",
          area: startingProject.area,
          floors: startingProject.floors,
          bedrooms: startingProject.bedrooms,
          perimeter: Math.ceil(4 * Math.sqrt(startingProject.area / startingProject.floors)),
        }),
        projectName: startingProject.name,
        sourceProjectNumber: startingProject.number,
      };
    return {
      parameters: startingProject
        ? getProjectParameters(startingProject)
        : { ...DEFAULT_HOUSE_PARAMETERS },
      projectName: startingProject?.name ?? null,
      sourceProjectNumber: startingProject?.number ?? null,
      mode: "turnkey",
      stageIds: DEMO_ESTIMATE_CATALOG.map((stage) => stage.id),
    };
  });
  const [houseParameters, setHouseParameters] = useState<HouseParameters>(initialDraft.parameters);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(
    initialDraft.projectName,
  );
  const calculatorRef = useRef<HTMLElement>(null);

  const resetHouseParameters = () => {
    setHouseParameters({ ...DEFAULT_HOUSE_PARAMETERS });
    setSelectedProjectName(null);
  };
  const updateHouseParameters = (next: HouseParameters) => {
    setHouseParameters(next);
    if (next.projectType !== "standard") setSelectedProjectName(null);
  };
  const restoreHouseParameters = (next: HouseParameters, projectName: string | null) => {
    setHouseParameters(next);
    setSelectedProjectName(projectName);
    calculatorRef.current?.focus({ preventScroll: true });
  };
  return (
    <div className="site-shell">
      <SiteHeader />
      <main>
        <section
          id="calculator"
          className="calculator-teaser"
          ref={calculatorRef}
          tabIndex={-1}
          aria-label="Расчёт стоимости"
        >
          <EstimateCalculator
            parameters={houseParameters}
            onParametersChange={updateHouseParameters}
            onRestore={restoreHouseParameters}
            projectName={selectedProjectName}
            onReset={resetHouseParameters}
            initialStageIds={initialDraft.stageIds}
            sourceProjectNumber={startingProject?.number ?? null}
            initialScope={
              initialDraft.mode === "turnkey"
                ? { mode: "turnkey" }
                : { mode: "stages", stageIds: initialDraft.stageIds }
            }
          />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
