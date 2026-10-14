import ArrowIcon from "../../components/ArrowIcon";
import { DEMO_DELIVERY } from "./catalog";
import { money, number } from "./formatters";
import type { EstimateResult, HouseParameters } from "./types";

type Props = {
  estimate: EstimateResult;
  parameters: HouseParameters;
  includedStageCount: number;
  constructionMode: "turnkey" | "stages";
  breakdownOpen: boolean;
  onToggle: () => void;
  expandedStages: string[];
  toggleStage: (id: string) => void;
};

export default function EstimateBreakdown({
  estimate,
  parameters,
  includedStageCount,
  constructionMode,
  breakdownOpen,
  onToggle,
  expandedStages,
  toggleStage,
}: Props) {
  return (
    <div className="estimate-breakdown" data-open={breakdownOpen}>
      <button
        className="estimate-breakdown-heading"
        type="button"
        aria-expanded={breakdownOpen}
        aria-controls="estimate-breakdown-panel"
        onClick={() => onToggle()}
      >
        <span>
          <span className="estimate-overline">03 / ДЕТАЛИЗАЦИЯ</span>
          <strong>Из чего складывается цена</strong>
        </span>
        <span className="estimate-stage-count">
          Включено: {includedStageCount} из {estimate.stages.length}
        </span>
        <ArrowIcon direction="chevron-down" />
      </button>
      <div
        id="estimate-breakdown-panel"
        className="estimate-breakdown-panel"
        aria-hidden={!breakdownOpen}
        inert={!breakdownOpen}
      >
        <div className="estimate-breakdown-inner">
          <p className="estimate-breakdown-note">
            Региональная поправка уже включена в цены этапов. Доставка показана отдельно после
            списка.
          </p>

          <div className="estimate-stages">
            {estimate.stages.map((stage, index) => {
              const isExpanded = expandedStages.includes(stage.id);

              return (
                <div
                  className={`estimate-stage ${stage.included ? "" : "is-excluded"}`}
                  key={stage.id}
                >
                  <button
                    type="button"
                    className="estimate-stage-toggle"
                    aria-expanded={stage.included && isExpanded}
                    disabled={!stage.included}
                    onClick={() => toggleStage(stage.id)}
                  >
                    <span className="estimate-stage-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="estimate-stage-copy">
                      <strong>{stage.name}</strong>
                      <small>{stage.description}</small>
                      {stage.included && (
                        <small className="estimate-stage-duration">
                          Ориентир: {stage.durationWeeks.min}–{stage.durationWeeks.max} нед.
                        </small>
                      )}
                    </span>
                    <span className="estimate-stage-price">
                      {stage.included ? money.format(stage.total) : "Не включён"}
                    </span>
                    <span
                      className={`estimate-chevron ${isExpanded ? "is-open" : ""}`}
                      aria-hidden="true"
                    >
                      <ArrowIcon direction="chevron-down" />
                    </span>
                  </button>

                  {stage.included && isExpanded && (
                    <div className="estimate-stage-details">
                      <p className="estimate-stage-detail-label">В расчёт этапа входят</p>
                      {stage.items.map((item) => (
                        <div className="estimate-line-item" key={item.id}>
                          <span className="estimate-line-name">{item.name}</span>
                          <span className="estimate-line-quantity">
                            {number.format(item.quantity)} {item.unit}
                          </span>
                          <span className="estimate-line-total">
                            {money.format(item.quantity * item.unitPrice)}
                          </span>
                        </div>
                      ))}
                      <div className="estimate-stage-explanation">
                        <p>
                          <strong>Что меняет цену:</strong> {stage.priceFactors}
                        </p>
                        <p>
                          <strong>Допущение:</strong> {stage.assumption}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {includedStageCount > 0 && parameters.delivery !== "none" && (
            <div className="estimate-delivery-row">
              <span>Доставка материалов · {DEMO_DELIVERY[parameters.delivery].label}</span>
              <strong>{money.format(estimate.deliveryCost)}</strong>
            </div>
          )}

          {includedStageCount > 0 && (
            <div className="estimate-grand-total">
              <span>
                {estimate.deliveryCost > 0
                  ? "Итого с доставкой"
                  : constructionMode === "turnkey"
                    ? "Итого по всем этапам"
                    : "Итого по выбранным этапам"}
              </span>
              <strong>{money.format(estimate.total)}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
