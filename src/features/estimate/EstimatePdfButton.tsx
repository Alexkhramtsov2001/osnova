import { useState } from "react";
import ArrowIcon from "../../components/ArrowIcon";
import type { EstimateResult, HouseParameters } from "./types";

type Props = {
  parameters: HouseParameters;
  estimate: EstimateResult;
  projectName: string | null;
  constructionMode: "turnkey" | "stages";
};

export default function EstimatePdfButton({
  parameters,
  estimate,
  projectName,
  constructionMode,
}: Props) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");
  return (
    <div className="estimate-pdf-actions">
      <button
        type="button"
        className="button button-secondary button-center-label"
        disabled={pdfBusy}
        onClick={async () => {
          setPdfBusy(true);
          setPdfError("");
          try {
            const { downloadEstimatePdf } = await import("./exportPdf");
            await downloadEstimatePdf(parameters, estimate, projectName, constructionMode);
          } catch {
            setPdfError("Не удалось подготовить PDF. Попробуйте скачать ещё раз.");
          } finally {
            setPdfBusy(false);
          }
        }}
      >
        <span>{pdfBusy ? "Готовим PDF…" : "Скачать расчёт в PDF"}</span>
        <ArrowIcon direction="down" />
      </button>
      {pdfError && <p role="alert">{pdfError}</p>}
    </div>
  );
}
