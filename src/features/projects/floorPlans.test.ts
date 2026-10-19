/// <reference types="node" />
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { projects } from "./catalog";
import { getProjectFloorPlans, projectFloorPlans } from "./floorPlans";

describe("статические демонстрационные планировки", () => {
  it("покрывают все проекты, этажи и указанное число спален", () => {
    expect(Object.keys(projectFloorPlans)).toEqual(projects.map((project) => project.number));
    for (const project of projects) {
      const plans = getProjectFloorPlans(project);
      expect(plans).toHaveLength(project.floors);
      expect(
        plans.flatMap((plan) => plan.rooms).filter((room) => room.startsWith("Спальня")),
      ).toHaveLength(project.bedrooms);
      expect(plans.map((plan) => plan.floor)).toEqual(
        Array.from({ length: project.floors }, (_, index) => index + 1),
      );
      expect(plans.every((plan) => project.floors === 1 || plan.rooms.includes("Лестница"))).toBe(
        true,
      );
    }
  });
  it("11 разных SVG загружаются из локальных ресурсов и содержат архитектурные обозначения", () => {
    const sources = new Set<string>();
    for (const project of projects)
      for (const plan of getProjectFloorPlans(project)) {
        const svg = readFileSync(`public/images/floor-plans/${plan.file}`, "utf8");
        expect(svg).toContain("Демонстрационная");
        expect(svg).toContain("data-door");
        expect(svg).toContain("data-window");
        expect(svg).toContain(project.name);
        expect(svg).not.toMatch(/<script|foreignObject|(?:href|src)=["']https?:/);
        expect(plan.alt).toContain(`${plan.floor} этаж`);
        sources.add(svg);
      }
    expect(sources.size).toBe(11);
  });
});
