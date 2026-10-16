import type { EstimateResult } from "../estimate/types";

export type PaymentMethod = "cashFull" | "cashStages" | "credit" | "mortgage";

// Условие существует только для демонстрации интерфейса, это не тариф компании.
export const DEMO_FULL_PAYMENT_DISCOUNT_RATE = 0.03;

export function calculatePaymentPreview(estimate: EstimateResult, method: PaymentMethod) {
  const stagesTotal = Math.round(
    estimate.stages.reduce((sum, stage) => sum + (stage.included ? stage.total : 0), 0),
  );
  const deliveryCost = Math.round(estimate.deliveryCost);
  const constructionTotal = Math.round(estimate.total);
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

export function buildStagePaymentSchedule(estimate: EstimateResult) {
  const stages = estimate.stages
    .filter((stage) => stage.included)
    .map((stage) => ({ id: stage.id, name: stage.name, amount: Math.round(stage.total) }));
  const deliveryCost = Math.round(estimate.deliveryCost);
  const constructionTotal = Math.round(estimate.total);
  const difference =
    constructionTotal - deliveryCost - stages.reduce((sum, stage) => sum + stage.amount, 0);
  if (stages.length > 0) stages[stages.length - 1].amount += difference;

  return {
    stages,
    deliveryCost,
    total: constructionTotal,
  };
}
