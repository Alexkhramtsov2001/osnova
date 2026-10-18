import type { EstimateResult } from "../estimate/types";
import { buildDisplayedEstimate } from "../estimate/displayAmounts";

export { buildDisplayedEstimate as buildStagePaymentSchedule } from "../estimate/displayAmounts";

export type PaymentMethod = "cashFull" | "cashStages" | "credit" | "mortgage";

// Условие существует только для демонстрации интерфейса, это не тариф компании.
export const DEMO_FULL_PAYMENT_DISCOUNT_RATE = 0.03;

export function calculatePaymentPreview(estimate: EstimateResult, method: PaymentMethod) {
  const display = buildDisplayedEstimate(estimate);
  const deliveryCost = display.deliveryCost;
  const constructionTotal = display.total;
  const stagesTotal = constructionTotal - deliveryCost;
  const discount =
    method === "cashFull" ? Math.round(constructionTotal * DEMO_FULL_PAYMENT_DISCOUNT_RATE) : 0;

  return {
    stagesTotal,
    deliveryCost,
    constructionTotal,
    discount,
    afterDiscount: constructionTotal - discount,
  };
}
