import { calculateItemTotal } from "./calculations";
import type { EstimateResult } from "./types";

// Allocate rounding remainders once, so every view shows the same ruble amounts.
export function buildDisplayedEstimate(estimate: EstimateResult) {
  const stages = estimate.stages
    .filter((stage) => stage.included)
    .map((stage) => ({
      id: stage.id,
      name: stage.name,
      amount: Math.round(stage.total),
      items: stage.items.map((item) => ({
        id: item.id,
        amount: Math.round(calculateItemTotal(item)),
      })),
    }));
  const deliveryCost = Math.round(estimate.deliveryCost);
  const total = Math.round(estimate.total);
  if (stages.length) {
    stages[stages.length - 1].amount +=
      total - deliveryCost - stages.reduce((sum, stage) => sum + stage.amount, 0);
  }
  for (const stage of stages) {
    if (stage.items.length)
      stage.items[stage.items.length - 1].amount +=
        stage.amount - stage.items.reduce((sum, item) => sum + item.amount, 0);
  }
  return { stages, deliveryCost, total };
}
