import { useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import DemoAccessGate from "../features/account/DemoAccessGate";
import { readDemoSession } from "../features/account/demoSession";
import EstimateCalculator from "../features/estimate/EstimateCalculator";
import {
  readCalculatorDraft,
  resolveCalculatorDraft,
  type CalculatorDraft,
} from "../features/estimate/calculatorDraft";
import { DEFAULT_HOUSE_PARAMETERS } from "../features/estimate/catalog";
import type { HouseParameters } from "../features/estimate/types";
import { projects } from "../features/projects/catalog";
export default function CalculatorPage() {
  const location = useLocation();
  const startingProject = projects.find(
    (project) => project.number === new URLSearchParams(location.search).get("project"),
  );
  const navigationType = useNavigationType();
  const [initialDraft] = useState<CalculatorDraft>(() => {
    let draft: CalculatorDraft | null = null;
    try {
      draft = readCalculatorDraft(window.sessionStorage);
    } catch {
      /* Хранилище может быть недоступно. */
    }
    return resolveCalculatorDraft(
      draft,
      startingProject,
      navigationType === "POP" && location.key !== "default",
    );
  });
  const [houseParameters, setHouseParameters] = useState<HouseParameters>(initialDraft.parameters);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(
    initialDraft.projectName,
  );
  const [sourceProjectNumber, setSourceProjectNumber] = useState(
    initialDraft.sourceProjectNumber ?? null,
  );
  const calculatorRef = useRef<HTMLElement>(null);

  const resetHouseParameters = () => {
    setHouseParameters({ ...DEFAULT_HOUSE_PARAMETERS });
    setSelectedProjectName(null);
    setSourceProjectNumber(null);
  };
  const updateHouseParameters = (next: HouseParameters) => {
    setHouseParameters(next);
    if (next.projectType !== "standard") setSelectedProjectName(null);
  };
  const restoreHouseParameters = (next: HouseParameters, projectName: string | null) => {
    setHouseParameters(next);
    setSelectedProjectName(projectName);
    setSourceProjectNumber(
      projects.find((project) => project.name === projectName)?.number ?? null,
    );
    calculatorRef.current?.focus({ preventScroll: true });
  };
  if (startingProject && !readDemoSession(window.sessionStorage)) {
    return (
      <div className="site-shell">
        <SiteHeader />
        <main>
          <DemoAccessGate
            eyebrow="ВЫБОР ПРОЕКТА / ДЕМО"
            title={`Войдите, чтобы выбрать «${startingProject.name}»`}
            description="Вы сможете продолжить с этим домом в калькуляторе. Учебный вход работает только в браузере и не требует настоящей почты."
            next={`/calculator?project=${startingProject.number}`}
          />
        </main>
        <SiteFooter />
      </div>
    );
  }
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
            sourceProjectNumber={sourceProjectNumber}
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
