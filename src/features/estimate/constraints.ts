import { HOUSE_NUMBER_LIMITS } from "./catalog";
import type { HouseParameters } from "./types";

export function minimumArea(floors: HouseParameters["floors"]): number {
  return floors === 2 ? 60 : HOUSE_NUMBER_LIMITS.area.min;
}

export function minimumPerimeter(area: number, floors: HouseParameters["floors"]): number {
  // Минимум для условной квадратной застройки.
  if (!Number.isFinite(area)) return HOUSE_NUMBER_LIMITS.perimeter.min;
  return Math.max(HOUSE_NUMBER_LIMITS.perimeter.min, Math.ceil(4 * Math.sqrt(area / floors)));
}

export function maximumPerimeter(area: number, floors: HouseParameters["floors"]): number {
  // Для демо ограничиваем контур прямоугольником с соотношением сторон примерно до 1:4.
  if (!Number.isFinite(area)) return HOUSE_NUMBER_LIMITS.perimeter.max;
  return Math.min(HOUSE_NUMBER_LIMITS.perimeter.max, Math.ceil(5 * Math.sqrt(area / floors)));
}

export function maximumBedrooms(area: number): number {
  return Math.max(1, Math.min(6, Math.floor(area / 18)));
}

export function minimumBedrooms(area: number): number {
  return Math.max(1, Math.min(6, Math.ceil(area / 180)));
}

export function maximumBathrooms(area: number): number {
  return Math.max(1, Math.min(4, Math.floor(area / 35)));
}

export function minimumBathrooms(area: number, bedrooms = minimumBedrooms(area)): number {
  return Math.max(1, Math.min(4, Math.max(Math.ceil(area / 250), Math.ceil(bedrooms / 3))));
}

export function clampHouseNumber(
  key: keyof typeof HOUSE_NUMBER_LIMITS,
  value: number,
  parameters: HouseParameters,
): number {
  if (!Number.isFinite(value)) return value;
  const { min, max } = HOUSE_NUMBER_LIMITS[key];
  const lower =
    key === "area"
      ? minimumArea(parameters.floors)
      : key === "perimeter"
        ? minimumPerimeter(parameters.area, parameters.floors)
        : min;
  const upper =
    key === "perimeter" && Number.isFinite(parameters.area)
      ? maximumPerimeter(parameters.area, parameters.floors)
      : max;
  return Math.min(upper, Math.max(lower, value));
}

export function normalizeForArea(parameters: HouseParameters): HouseParameters {
  if (!Number.isFinite(parameters.area)) return parameters;
  const area = clampHouseNumber("area", parameters.area, parameters);
  const bedrooms = Math.min(
    maximumBedrooms(area),
    Math.max(minimumBedrooms(area), parameters.bedrooms),
  );
  const next = { ...parameters, area, bedrooms };
  return {
    ...next,
    bathrooms: Math.min(
      maximumBathrooms(area),
      Math.max(minimumBathrooms(area, bedrooms), parameters.bathrooms),
    ),
    perimeter: Number.isFinite(parameters.perimeter)
      ? clampHouseNumber("perimeter", parameters.perimeter, next)
      : parameters.perimeter,
  };
}
