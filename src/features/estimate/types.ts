export type EstimateItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
};

export type EstimateStageId =
  | "foundation"
  | "walls"
  | "roof"
  | "windows-doors"
  | "facade"
  | "engineering"
  | "interior"
  | "completion";

export type EstimateStage = {
  id: EstimateStageId;
  name: string;
  description: string;
  priceFactors: string;
  assumption: string;
  durationWeeks: { min: number; max: number };
  items: EstimateItem[];
};

export type HouseParameters = {
  projectType: "standard" | "custom" | "clientDrawings";
  region: "central" | "northwest" | "south" | "ural" | "siberia" | "farEast";
  delivery: "none" | "near" | "regional" | "longDistance";
  area: number;
  floors: 1 | 2;
  bedrooms: number;
  wallMaterial: "aeratedConcrete" | "ceramicBlock" | "brick" | "frame";
  foundation: "strip" | "slab" | "piles";
  roof: "metal" | "soft";
  finish: "standard" | "comfort";
  wallHeight: number;
  perimeter: number;
  bathrooms: number;
};

export type EstimateResult = {
  dataVersion: string;
  dataUpdatedAt: string;
  stages: (EstimateStage & {
    included: boolean;
    total: number;
    minTotal: number;
    maxTotal: number;
  })[];
  deliveryCost: number;
  deliveryLeadWeeks: number;
  durationWeeks: { min: number; max: number };
  total: number;
  minTotal: number;
  maxTotal: number;
};

export type EstimateScope = { mode: "turnkey" } | { mode: "stages"; stageIds: EstimateStageId[] };
