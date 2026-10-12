import {
  DEMO_DELIVERY,
  DEMO_PRICES_NOTICE,
  DEMO_REGIONS,
  PROJECT_TYPES,
  WALL_MATERIALS,
} from "./catalog";
import type { EstimateResult, HouseParameters } from "./types";

const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

const foundations: Record<HouseParameters["foundation"], string> = {
  strip: "Ленточный",
  slab: "Плитный",
  piles: "Свайный",
};
const roofs: Record<HouseParameters["roof"], string> = {
  metal: "Металлочерепица",
  soft: "Мягкая кровля",
};
const finishes: Record<HouseParameters["finish"], string> = {
  standard: "Стандарт",
  comfort: "Комфорт",
};

export function formatRequestSummary(
  parameters: HouseParameters,
  estimate: EstimateResult,
  projectName: string | null,
  mode: "turnkey" | "stages",
): string {
  const includedStages = estimate.stages.filter((stage) => stage.included);
  const lines = [
    "ОСНОВА — демонстрационная сводка расчёта",
    ...(projectName ? [`Проект из каталога: ${projectName}`] : []),
    `Тип проекта: ${PROJECT_TYPES[parameters.projectType].label}`,
    `Площадь: ${number.format(parameters.area)} м²; этажей: ${parameters.floors}; спален: ${parameters.bedrooms}; санузлов: ${parameters.bathrooms}`,
    `Стены: ${WALL_MATERIALS[parameters.wallMaterial].label}; фундамент: ${foundations[parameters.foundation]}; кровля: ${roofs[parameters.roof]}; отделка: ${finishes[parameters.finish]}`,
    `Высота стен: ${number.format(parameters.wallHeight)} м; периметр: ${number.format(parameters.perimeter)} м`,
    `Формат: ${mode === "turnkey" ? "Под ключ" : "Отдельные этапы"}`,
    `Включённые этапы: ${includedStages.map((stage) => stage.name).join(", ")}`,
    `Регион: ${DEMO_REGIONS[parameters.region].label}; доставка: ${DEMO_DELIVERY[parameters.delivery].label} (${money.format(estimate.deliveryCost)})`,
    `Ориентир стоимости: ${money.format(estimate.minTotal)} — ${money.format(estimate.maxTotal)}; средний ориентир: ${money.format(estimate.total)}`,
    `Ориентир срока: ${estimate.durationWeeks.min}–${estimate.durationWeeks.max} календарных недель`,
    `Демо-данные: ${estimate.dataVersion} от ${estimate.dataUpdatedAt.split("-").reverse().join(".")}`,
    DEMO_PRICES_NOTICE,
    "Проектирование и проверка чертежей в стоимость строительных этапов не включены. Сроки, регион и доставка условные.",
  ];
  return lines.join("\n");
}
