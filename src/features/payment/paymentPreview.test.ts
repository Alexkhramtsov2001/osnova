import { describe, expect, it } from "vitest";
import { calculateHouseEstimate } from "../estimate/calculations";
import { DEFAULT_HOUSE_PARAMETERS } from "../estimate/catalog";
import { calculatePaymentPreview } from "./paymentPreview";

describe("демонстрационная сводка оплаты", () => {
  const estimate = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS);

  it("показывает этапы и доставку без повторного прибавления", () => {
    const preview = calculatePaymentPreview(estimate, "mortgage");
    expect(preview.stagesTotal + preview.deliveryCost).toBe(preview.constructionTotal);
    expect(preview.afterDiscount).toBe(preview.constructionTotal);
    expect(preview.discount).toBe(0);
  });

  it("даёт условную скидку только при полной оплате своими средствами", () => {
    const fullPayment = calculatePaymentPreview(estimate, "ownFunds");
    expect(fullPayment.discount).toBe(Math.round(estimate.total * 0.03));
    expect(fullPayment.afterDiscount).toBe(fullPayment.constructionTotal - fullPayment.discount);
    expect(calculatePaymentPreview(estimate, "loan").discount).toBe(0);
    expect(calculatePaymentPreview(estimate, "maternityCapital").discount).toBe(0);
  });

  it("учитывает доставку один раз и выбранные этапы при частичном составе", () => {
    const withDelivery = calculateHouseEstimate(
      { ...DEFAULT_HOUSE_PARAMETERS, delivery: "regional" },
      { mode: "stages", stageIds: ["foundation", "roof"] },
    );
    const preview = calculatePaymentPreview(withDelivery, "ownFunds");
    expect(preview.deliveryCost).toBe(110_000);
    expect(preview.stagesTotal + preview.deliveryCost).toBe(preview.constructionTotal);
    expect(preview.constructionTotal).toBe(Math.round(withDelivery.total));
  });

  it("не превращает пустой состав работ в счёт", () => {
    const emptyEstimate = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS, {
      mode: "stages",
      stageIds: [],
    });
    expect(calculatePaymentPreview(emptyEstimate, "ownFunds").afterDiscount).toBe(0);
  });
});
