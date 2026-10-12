import { HOUSE_NUMBER_LIMITS } from "./catalog";
import type { HouseParameters } from "./types";

export function minimumArea(floors: HouseParameters["floors"]): number {
  return floors === 2 ? 60 : HOUSE_NUMBER_LIMITS.area.min;
}

export function minimumPerimeter(area: number, floors: HouseParameters["floors"]): number {
  // Минимум для условной квадратной застройки; реальный контур может быть длиннее.
  if (!Number.isFinite(area)) return HOUSE_NUMBER_LIMITS.perimeter.min;
  return Math.max(HOUSE_NUMBER_LIMITS.perimeter.min, Math.floor(4 * Math.sqrt(area / floors)));
}

export function maximumBedrooms(area: number): number {
  return Math.max(1, Math.min(6, Math.floor(area / 18)));
}

export function maximumBathrooms(area: number): number {
  return Math.max(1, Math.min(4, Math.floor(area / 35)));
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
  return Math.min(max, Math.max(lower, value));
}

export function normalizeForArea(parameters: HouseParameters): HouseParameters {
  if (!Number.isFinite(parameters.area)) return parameters;
  const area = clampHouseNumber("area", parameters.area, parameters);
  const next = { ...parameters, area };
  return {
    ...next,
    bedrooms: Math.min(parameters.bedrooms, maximumBedrooms(area)),
    bathrooms: Math.min(parameters.bathrooms, maximumBathrooms(area)),
    perimeter: Number.isFinite(parameters.perimeter)
      ? clampHouseNumber("perimeter", parameters.perimeter, next)
      : parameters.perimeter,
  };
}
