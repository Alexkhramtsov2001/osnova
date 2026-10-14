import { DEFAULT_HOUSE_PARAMETERS } from "../estimate/catalog";
import { calculateHouseEstimate } from "../estimate/calculations";
import type { Project } from "./catalog";

// Единая демонстрационная комплектация для честного сравнения каталога.
export function getProjectParameters(project: Project) {
  return {
    ...DEFAULT_HOUSE_PARAMETERS,
    area: project.area,
    floors: project.floors,
    bedrooms: project.bedrooms,
    perimeter: Math.ceil(4 * Math.sqrt(project.area / project.floors)),
  };
}

export function getProjectEstimate(project: Project) {
  return calculateHouseEstimate(getProjectParameters(project));
}

export function formatPriceRange(min: number, max: number) {
  const format = (value: number) =>
    (value / 1_000_000).toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return `${format(min)}–${format(max)} млн ₽`;
}

export function getProjectValueContext(project: Project, selection: readonly Project[]) {
  const total = getProjectEstimate(project).total;
  const cheaper = selection
    .filter((item) => item.number !== project.number && getProjectEstimate(item).total < total)
    .sort((a, b) => getProjectEstimate(b).total - getProjectEstimate(a).total)[0];
  if (!cheaper) return null;
  const extraArea = project.area - cheaper.area;
  const extraBedrooms = project.bedrooms - cheaper.bedrooms;
  const gains = [
    ...(extraArea > 0 ? [`+${extraArea} м² общей площади`] : []),
    ...(extraBedrooms > 0
      ? [
          `+${extraBedrooms} ${extraBedrooms === 1 ? "спальня" : extraBedrooms < 5 ? "спальни" : "спален"}`,
        ]
      : []),
  ];
  if (gains.length === 0) return null;
  const difference = Math.round((total / getProjectEstimate(cheaper).total - 1) * 100);
  return `По сравнению с «${cheaper.name}»: ${gains.join(" и ")}. Средний бюджет в общей комплектации выше примерно на ${difference}%.`;
}

export function getProjectAdvantages(project: Project, selection: readonly Project[]) {
  const advantages = [
    project.floors === 1
      ? "Все комнаты на одном этаже — без ежедневных подъёмов по лестнице."
      : "Два этажа уменьшают площадь застройки при той же общей площади дома.",
  ];
  if (selection.length > 1) {
    const estimate = getProjectEstimate(project);
    const cheapest = Math.min(...selection.map((item) => getProjectEstimate(item).total));
    if (estimate.total === cheapest)
      advantages.push("Самый низкий бюджет среди выбранных в общей комплектации.");
    if (project.bedrooms === Math.max(...selection.map((item) => item.bedrooms))) {
      advantages.push(
        "Максимальное число спален среди выбранных: больше отдельных комнат для семьи или гостей.",
      );
    }
    if (project.area === Math.max(...selection.map((item) => item.area))) {
      advantages.push(
        "Самая большая общая площадь среди выбранных: больше возможностей для зонирования.",
      );
    }
  }
  return advantages;
}
