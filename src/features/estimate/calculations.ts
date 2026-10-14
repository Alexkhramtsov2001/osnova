import {
  maximumBathrooms,
  maximumBedrooms,
  maximumPerimeter,
  minimumArea,
  minimumBathrooms,
  minimumBedrooms,
  minimumPerimeter,
} from "./constraints";
import type {
  EstimateItem,
  EstimateResult,
  EstimateStage,
  EstimateScope,
  HouseParameters,
} from "./types";
import {
  DEFAULT_HOUSE_PARAMETERS,
  DEMO_PRICE_CALIBRATION,
  DEMO_PRICE_RANGE,
  DEMO_ESTIMATE_CATALOG,
  WALL_MATERIALS,
  HOUSE_NUMBER_LIMITS,
  PROJECT_TYPES,
  DEMO_REGIONS,
  DEMO_DELIVERY,
  DEMO_ESTIMATE_DATA,
} from "./catalog";

type StageId = EstimateStage["id"];

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function validateNonNegativeFinite(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${field} должно быть конечным неотрицательным числом`);
  }
}

export function calculateItemTotal(item: EstimateItem): number {
  validateNonNegativeFinite(item.quantity, "Количество");
  validateNonNegativeFinite(item.unitPrice, "Цена");
  return roundMoney(item.quantity * item.unitPrice);
}

export function calculateEstimateTotal(items: EstimateItem[]): number {
  return roundMoney(items.reduce((total, item) => total + calculateItemTotal(item), 0));
}

function validateHouseParameters(parameters: HouseParameters): void {
  if (!Object.hasOwn(PROJECT_TYPES, parameters.projectType)) {
    throw new RangeError("Недопустимый тип проекта");
  }
  if (!Object.hasOwn(DEMO_REGIONS, parameters.region)) {
    throw new RangeError("Недопустимый региональный сценарий");
  }
  if (!Object.hasOwn(DEMO_DELIVERY, parameters.delivery)) {
    throw new RangeError("Недопустимая зона доставки");
  }
  validateNonNegativeFinite(parameters.area, "Площадь");
  validateNonNegativeFinite(parameters.bedrooms, "Количество спален");
  validateNonNegativeFinite(parameters.wallHeight, "Высота стен");
  validateNonNegativeFinite(parameters.perimeter, "Периметр");
  validateNonNegativeFinite(parameters.bathrooms, "Количество санузлов");

  for (const key of Object.keys(HOUSE_NUMBER_LIMITS) as (keyof typeof HOUSE_NUMBER_LIMITS)[]) {
    const { min, max, label } = HOUSE_NUMBER_LIMITS[key];
    if (parameters[key] < min || parameters[key] > max) {
      throw new RangeError(`${label}: допустимое значение от ${min} до ${max}`);
    }
  }

  if (parameters.area <= 0) {
    throw new RangeError("Площадь дома должна быть больше нуля");
  }

  if (!Number.isInteger(parameters.bedrooms) || parameters.bedrooms < 1) {
    throw new RangeError("Количество спален должно быть целым числом не меньше 1");
  }

  if (!Number.isInteger(parameters.bathrooms) || parameters.bathrooms < 1) {
    throw new RangeError("Количество санузлов должно быть целым числом не меньше 1");
  }

  if (parameters.wallHeight <= 0 || parameters.perimeter <= 0) {
    throw new RangeError("Высота стен и периметр должны быть больше нуля");
  }

  if (parameters.floors !== 1 && parameters.floors !== 2) {
    throw new RangeError("Допустимо 1 или 2 этажа");
  }
  if (parameters.area < minimumArea(parameters.floors)) {
    throw new RangeError(
      `Для двух этажей в демо нужна площадь от ${minimumArea(parameters.floors)} м²`,
    );
  }
  if (parameters.bedrooms > maximumBedrooms(parameters.area)) {
    throw new RangeError(
      `Для площади ${parameters.area} м² в демо доступно не более ${maximumBedrooms(parameters.area)} спален`,
    );
  }
  if (parameters.bedrooms < minimumBedrooms(parameters.area)) {
    throw new RangeError(
      `Для площади ${parameters.area} м² в демо нужно не менее ${minimumBedrooms(parameters.area)} спален`,
    );
  }
  if (parameters.bathrooms > maximumBathrooms(parameters.area)) {
    throw new RangeError(
      `Для площади ${parameters.area} м² в демо доступно не более ${maximumBathrooms(parameters.area)} санузлов`,
    );
  }
  if (parameters.bathrooms < minimumBathrooms(parameters.area, parameters.bedrooms)) {
    throw new RangeError(
      `Для выбранного числа спален в демо нужно не менее ${minimumBathrooms(parameters.area, parameters.bedrooms)} санузлов`,
    );
  }
  if (parameters.perimeter < minimumPerimeter(parameters.area, parameters.floors)) {
    throw new RangeError(
      `Для выбранной площади ориентировочный периметр не меньше ${minimumPerimeter(parameters.area, parameters.floors)} м`,
    );
  }
  if (parameters.perimeter > maximumPerimeter(parameters.area, parameters.floors)) {
    throw new RangeError(
      `Для выбранной площади ориентировочный периметр не больше ${maximumPerimeter(parameters.area, parameters.floors)} м`,
    );
  }

  if (!Object.keys(WALL_MATERIALS).includes(parameters.wallMaterial)) {
    throw new RangeError("Недопустимый материал стен");
  }

  if (!["strip", "slab", "piles"].includes(parameters.foundation)) {
    throw new RangeError("Недопустимый тип фундамента");
  }

  if (!["metal", "soft"].includes(parameters.roof)) {
    throw new RangeError("Недопустимый тип кровли");
  }

  if (!["standard", "comfort"].includes(parameters.finish)) {
    throw new RangeError("Недопустимый вариант отделки");
  }
}

function getWallArea(parameters: HouseParameters): number {
  const grossArea = parameters.perimeter * parameters.wallHeight * parameters.floors;

  return roundMoney(grossArea * 0.85);
}

function getRoofArea(parameters: HouseParameters): number {
  const slopeFactor = parameters.roof === "soft" ? 1.2 : 1.15;
  const footprintArea = parameters.area / parameters.floors;
  return roundMoney(footprintArea * slopeFactor);
}

function getQuantity(item: EstimateItem, parameters: HouseParameters): number {
  const wallArea = getWallArea(parameters);
  const roofArea = getRoofArea(parameters);
  const floorArea = parameters.area;
  const footprintArea = floorArea / parameters.floors;
  const plumbingPoints = parameters.bathrooms * 4 + 2;
  const lightingPoints = Math.ceil(parameters.area / 8);
  const interiorDoors = parameters.bedrooms + parameters.bathrooms + 1;

  switch (item.id) {
    case "foundation-earthworks":
      return roundMoney(footprintArea * 0.35);
    case "foundation-cushion":
      return roundMoney(footprintArea * 0.15);
    case "foundation-formwork":
      return roundMoney(parameters.perimeter * 1.2);
    case "foundation-reinforcement":
      return roundMoney(footprintArea * 0.012);
    case "foundation-concrete":
      return roundMoney(footprintArea * 0.3);
    case "foundation-waterproofing":
      return roundMoney(parameters.perimeter * 1.5);

    case "walls-blocks":
      return wallArea;
    case "walls-partitions":
      return roundMoney(floorArea * 1.1);
    case "walls-lintel":
      return parameters.bedrooms + parameters.bathrooms + 3;
    case "walls-armored-belt":
      return roundMoney(parameters.perimeter * parameters.floors);
    case "walls-mortar":
      return wallArea;

    case "roof-structure":
    case "roof-membrane":
    case "roof-batten":
    case "roof-covering":
    case "roof-insulation":
      return roofArea;
    case "roof-drainage":
      return roundMoney(parameters.perimeter);

    case "windows-units":
      return roundMoney(wallArea * 0.15);
    case "doors-exterior":
      return 1;
    case "doors-interior":
      return interiorDoors;
    case "windows-sills":
      return roundMoney(wallArea * 0.08);

    case "facade-preparation":
    case "facade-insulation":
    case "facade-mesh":
    case "facade-finish":
      return wallArea;

    case "engineering-electricity":
    case "engineering-heating":
      return floorArea;
    case "engineering-water":
    case "engineering-sewerage":
      return plumbingPoints;
    case "engineering-ventilation":
      return Math.max(1, parameters.bathrooms + 1);

    case "interior-plaster":
    case "interior-walls-finish":
      return roundMoney(wallArea * 1.8);
    case "interior-screed":
    case "interior-floor-finish":
      return floorArea;
    case "interior-ceiling":
      // area — общая площадь всех этажей, повторно умножать её нельзя.
      return floorArea;
    case "interior-tiles":
      return roundMoney(parameters.bathrooms * 8);

    case "completion-plumbing":
      return plumbingPoints;
    case "completion-lighting":
      return lightingPoints;
    case "completion-interior-doors":
      return interiorDoors;
    case "completion-cleaning":
      return floorArea;

    default:
      throw new Error(`Не задан расчёт количества для позиции: ${item.id}`);
  }
}

function getPriceMultiplier(stageId: StageId, parameters: HouseParameters): number {
  let multiplier = 1;

  if (stageId === "foundation") {
    multiplier *= {
      strip: 1,
      slab: 1.2,
      piles: 0.85,
    }[parameters.foundation];
  }

  if (stageId === "walls") {
    multiplier *= WALL_MATERIALS[parameters.wallMaterial].wallPriceMultiplier;

    if (parameters.floors === 2) {
      multiplier *= 1.12;
    }
  }

  if (stageId === "roof" && parameters.roof === "soft") {
    multiplier *= 1.15;
  }

  if ((stageId === "interior" || stageId === "completion") && parameters.finish === "comfort") {
    multiplier *= 1.25;
  }

  return multiplier;
}

function getStageDurationWeeks(stage: EstimateStage, parameters: HouseParameters) {
  // Условная шкала для дома 120 м²; сроки не выводятся из стоимости.
  let factor = Math.sqrt(parameters.area / 120);

  if (stage.id === "walls") {
    if (parameters.floors === 2) factor *= 1.1;
    factor *= {
      aeratedConcrete: 1,
      ceramicBlock: 1.1,
      brick: 1.2,
      frame: 0.8,
    }[parameters.wallMaterial];
  }

  if (stage.id === "foundation" && parameters.foundation === "slab") factor *= 1.15;
  if (stage.id === "interior" && parameters.finish === "comfort") factor *= 1.15;

  return {
    min: Math.max(1, Math.ceil(stage.durationWeeks.min * factor)),
    max: Math.max(1, Math.ceil(stage.durationWeeks.max * factor)),
  };
}

export function calculateHouseEstimate(
  parameters: HouseParameters = DEFAULT_HOUSE_PARAMETERS,
  scope: EstimateScope = { mode: "turnkey" },
): EstimateResult {
  validateHouseParameters(parameters);

  if (scope.mode !== "turnkey" && scope.mode !== "stages") {
    throw new RangeError("Недопустимый формат расчёта");
  }
  if (scope.mode === "stages" && !Array.isArray(scope.stageIds)) {
    throw new RangeError("Недопустимый состав работ");
  }
  const selectedIds = scope.mode === "stages" ? new Set(scope.stageIds) : null;
  if (
    selectedIds &&
    [...selectedIds].some((id) => !DEMO_ESTIMATE_CATALOG.some((stage) => stage.id === id))
  ) {
    throw new RangeError("Недопустимый этап строительства");
  }

  const stages = DEMO_ESTIMATE_CATALOG.map((stage) => {
    const multiplier = getPriceMultiplier(stage.id, parameters);

    const items = stage.items.map((item) => ({
      ...item,
      quantity: getQuantity(item, parameters),
      unitPrice: roundMoney(
        item.unitPrice *
          multiplier *
          DEMO_PRICE_CALIBRATION *
          DEMO_REGIONS[parameters.region].multiplier,
      ),
    }));

    const total = calculateEstimateTotal(items);

    return {
      ...stage,
      included: selectedIds === null || selectedIds.has(stage.id),
      items,
      total,
      minTotal: roundMoney(total * DEMO_PRICE_RANGE.min),
      maxTotal: roundMoney(total * DEMO_PRICE_RANGE.max),
      durationWeeks: getStageDurationWeeks(stage, parameters),
    };
  });

  const includedStages = stages.filter((stage) => stage.included);
  const deliveryCost = includedStages.length > 0 ? DEMO_DELIVERY[parameters.delivery].cost : 0;
  const deliveryLeadWeeks =
    includedStages.length > 0 ? DEMO_DELIVERY[parameters.delivery].leadWeeks : 0;

  return {
    dataVersion: DEMO_ESTIMATE_DATA.version,
    dataUpdatedAt: DEMO_ESTIMATE_DATA.updatedAt,
    stages,
    deliveryCost,
    deliveryLeadWeeks,
    durationWeeks: {
      min: includedStages.reduce((sum, stage) => sum + stage.durationWeeks.min, deliveryLeadWeeks),
      max: includedStages.reduce((sum, stage) => sum + stage.durationWeeks.max, deliveryLeadWeeks),
    },
    total: roundMoney(includedStages.reduce((sum, stage) => sum + stage.total, deliveryCost)),
    minTotal: roundMoney(includedStages.reduce((sum, stage) => sum + stage.minTotal, deliveryCost)),
    maxTotal: roundMoney(includedStages.reduce((sum, stage) => sum + stage.maxTotal, deliveryCost)),
  };
}
