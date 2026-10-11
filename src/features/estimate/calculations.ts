export type EstimateItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

export function calculateItemTotal(item: EstimateItem): number {
  validateNonNegativeFinite(item.quantity, "Количество");
  validateNonNegativeFinite(item.unitPrice, "Цена");

  return roundMoney(item.quantity * item.unitPrice);
}

export function calculateEstimateTotal(items: EstimateItem[]): number {
  return roundMoney(items.reduce((total, item) => total + calculateItemTotal(item), 0));
}

function validateNonNegativeFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${field} должно быть конечным неотрицательным числом`);
  }
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
