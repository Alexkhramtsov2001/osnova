import { WALL_MATERIALS } from "./catalog";
export const options = {
  wallMaterial: Object.entries(WALL_MATERIALS).map(([value, material]) => ({
    value,
    label: material.label,
  })),
  foundation: [
    { value: "strip", label: "Ленточный" },
    { value: "slab", label: "Плитный" },
    { value: "piles", label: "Свайный" },
  ],
  roof: [
    { value: "metal", label: "Металлочерепица" },
    { value: "soft", label: "Мягкая кровля" },
  ],
  finish: [
    { value: "standard", label: "Стандарт" },
    { value: "comfort", label: "Комфорт" },
  ],
} as const;
