export const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export const number = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 2,
});

export const formatDuration = (weeks: number) =>
  new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(weeks);
