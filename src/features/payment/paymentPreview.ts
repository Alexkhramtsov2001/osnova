import type { EstimateResult } from "../estimate/types";

export type PaymentMethod = "ownFunds" | "mortgage" | "loan" | "maternityCapital";

// Условие существует только для демонстрации интерфейса, это не тариф компании.
export const DEMO_FULL_PAYMENT_DISCOUNT_RATE = 0.03;

export function calculatePaymentPreview(estimate: EstimateResult, method: PaymentMethod) {
  const stagesTotal = Math.round(
    estimate.stages.reduce((sum, stage) => sum + (stage.included ? stage.total : 0), 0),
  );
  const deliveryCost = Math.round(estimate.deliveryCost);
  const constructionTotal = Math.round(estimate.total);
  const discount =
    method === "ownFunds" ? Math.round(constructionTotal * DEMO_FULL_PAYMENT_DISCOUNT_RATE) : 0;

  return {
    stagesTotal,
    deliveryCost,
    constructionTotal,
    discount,
    afterDiscount: constructionTotal - discount,
  };
}
