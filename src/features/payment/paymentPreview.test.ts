import { describe, expect, it } from "vitest";
import { calculateHouseEstimate } from "../estimate/calculations";
import { DEFAULT_HOUSE_PARAMETERS } from "../estimate/catalog";
import { buildStagePaymentSchedule, calculatePaymentPreview } from "./paymentPreview";

describe("демонстрационная сводка оплаты", () => {
  const estimate = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS);

  it("показывает этапы и доставку без повторного прибавления", () => {
    const preview = calculatePaymentPreview(estimate, "mortgage");
    expect(preview.stagesTotal + preview.deliveryCost).toBe(preview.constructionTotal);
    expect(preview.afterDiscount).toBe(preview.constructionTotal);
    expect(preview.discount).toBe(0);
  });

  it("даёт условную скидку только при полной оплате своими средствами", () => {
    const fullPayment = calculatePaymentPreview(estimate, "cashFull");
    expect(fullPayment.discount).toBe(Math.round(estimate.total * 0.03));
    expect(fullPayment.afterDiscount).toBe(fullPayment.constructionTotal - fullPayment.discount);
    expect(calculatePaymentPreview(estimate, "credit").discount).toBe(0);
    expect(calculatePaymentPreview(estimate, "cashStages").discount).toBe(0);
  });

  it("учитывает доставку один раз и выбранные этапы при частичном составе", () => {
    const withDelivery = calculateHouseEstimate(
      { ...DEFAULT_HOUSE_PARAMETERS, delivery: "regional" },
      { mode: "stages", stageIds: ["foundation", "roof"] },
    );
    const preview = calculatePaymentPreview(withDelivery, "cashFull");
    expect(preview.deliveryCost).toBe(110_000);
    expect(preview.stagesTotal + preview.deliveryCost).toBe(preview.constructionTotal);
    expect(preview.constructionTotal).toBe(Math.round(withDelivery.total));
  });

  it("не превращает пустой состав работ в счёт", () => {
    const emptyEstimate = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS, {
      mode: "stages",
      stageIds: [],
    });
    expect(calculatePaymentPreview(emptyEstimate, "cashFull").afterDiscount).toBe(0);
  });

  it("график этапов сходится с итогом и учитывает доставку один раз", () => {
    const withDelivery = calculateHouseEstimate(
      { ...DEFAULT_HOUSE_PARAMETERS, delivery: "regional" },
      { mode: "stages", stageIds: ["foundation", "roof"] },
    );
    const schedule = buildStagePaymentSchedule(withDelivery);
    expect(schedule.stages).toHaveLength(2);
    expect(schedule.deliveryCost).toBe(110_000);
    expect(
      schedule.stages.reduce((sum, stage) => sum + stage.amount, 0) + schedule.deliveryCost,
    ).toBe(schedule.total);
    expect(schedule.total).toBe(Math.round(withDelivery.total));
  });

  it.each(["none", "regional"] as const)(
    "согласует округление дробных сумм этапов и позиций: %s",
    (delivery) => {
      const estimate = calculateHouseEstimate(
        { ...DEFAULT_HOUSE_PARAMETERS, area: 120.1, delivery },
        { mode: "stages", stageIds: ["walls", "roof"] },
      );
      const display = buildStagePaymentSchedule(estimate);
      expect(display.stages.reduce((sum, stage) => sum + stage.amount, display.deliveryCost)).toBe(
        display.total,
      );
      for (const stage of display.stages)
        expect(stage.items.reduce((sum, item) => sum + item.amount, 0)).toBe(stage.amount);
      for (const method of ["cashFull", "cashStages", "credit", "mortgage"] as const) {
        const preview = calculatePaymentPreview(estimate, method);
        expect(
          display.stages.reduce((sum, stage) => sum + stage.amount, display.deliveryCost) -
            preview.discount,
        ).toBe(preview.afterDiscount);
      }
      expect(display.total).toBe(Math.round(estimate.total));
    },
  );
});
