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

export function fitsRoomLayout(
  area: number,
  floors: HouseParameters["floors"],
  bedrooms: number,
  bathrooms: number,
): boolean {
  // Демо-бюджет площади: спальня 12 м², санузел 3 м², общая зона 8 м²,
  // 20% на стены/проходы/общие помещения и ещё 6 м² на лестницу двухэтажного дома.
  return bedrooms * 12 + bathrooms * 3 + 8 + (floors === 2 ? 6 : 0) <= area * 0.8 + 1e-8;
}

export function maximumBedrooms(area: number, floors: HouseParameters["floors"] = 1): number {
  const limit = Math.max(1, Math.min(6, Math.floor(area / 18)));
  for (let bedrooms = limit; bedrooms > 1; bedrooms--) {
    if (fitsRoomLayout(area, floors, bedrooms, minimumBathrooms(area, bedrooms))) return bedrooms;
  }
  return 1;
}

export function minimumBedrooms(area: number): number {
  return Math.max(1, Math.min(6, Math.ceil(area / 180)));
}

export function maximumBathrooms(
  area: number,
  floors: HouseParameters["floors"] = 1,
  bedrooms = minimumBedrooms(area),
): number {
  const layoutLimit = Math.floor(
    (area * 0.8 - 8 - (floors === 2 ? 6 : 0) - bedrooms * 12 + 1e-8) / 3,
  );
  return Math.max(1, Math.min(4, Math.floor(area / 35), layoutLimit));
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
  const rounded = Math.round(value / HOUSE_NUMBER_LIMITS[key].step) * HOUSE_NUMBER_LIMITS[key].step;
  return Math.min(upper, Math.max(lower, Number(rounded.toFixed(1))));
}

export function isHouseNumberStepValid(
  key: keyof typeof HOUSE_NUMBER_LIMITS,
  value: number,
): boolean {
  return (
    Number.isFinite(value) &&
    Math.abs(
      value / HOUSE_NUMBER_LIMITS[key].step - Math.round(value / HOUSE_NUMBER_LIMITS[key].step),
    ) < 1e-7
  );
}

export function normalizeForArea(parameters: HouseParameters): HouseParameters {
  if (!Number.isFinite(parameters.area)) return parameters;
  const area = clampHouseNumber("area", parameters.area, parameters);
  const bedrooms = Math.min(
    maximumBedrooms(area, parameters.floors),
    Math.max(minimumBedrooms(area), parameters.bedrooms),
  );
  const next = { ...parameters, area, bedrooms };
  return {
    ...next,
    wallHeight: Number.isFinite(parameters.wallHeight)
      ? clampHouseNumber("wallHeight", parameters.wallHeight, next)
      : parameters.wallHeight,
    bathrooms: Math.min(
      maximumBathrooms(area, parameters.floors, bedrooms),
      Math.max(minimumBathrooms(area, bedrooms), parameters.bathrooms),
    ),
    perimeter: Number.isFinite(parameters.perimeter)
      ? clampHouseNumber("perimeter", parameters.perimeter, next)
      : parameters.perimeter,
  };
}
