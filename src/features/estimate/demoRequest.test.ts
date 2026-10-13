import { describe, expect, it } from "vitest";
import { calculateHouseEstimate } from "./calculations";
import { DEFAULT_HOUSE_PARAMETERS } from "./catalog";
import { createDemoRequestPayload } from "./demoRequest";

describe("демонстрационная заявка", () => {
  it("отправляет только ограниченные параметры расчёта без контактных данных", () => {
    const estimate = calculateHouseEstimate(DEFAULT_HOUSE_PARAMETERS, {
      mode: "stages",
      stageIds: ["foundation", "roof"],
    });
    const payload = createDemoRequestPayload(
      DEFAULT_HOUSE_PARAMETERS,
      estimate,
      "Скандинавия",
      "stages",
      "f2424d62-43fa-4e9f-92d8-27ae543b8bf4",
    );

    expect(payload).toEqual({
      p_client_request_id: "f2424d62-43fa-4e9f-92d8-27ae543b8bf4",
      p_project_number: "01",
      p_project_type: "standard",
      p_region: "central",
      p_area: DEFAULT_HOUSE_PARAMETERS.area,
      p_construction_mode: "stages",
      p_stage_ids: ["foundation", "roof"],
      p_estimate_total: Math.round(estimate.total),
      p_data_version: estimate.dataVersion,
    });
    expect(JSON.stringify(payload)).not.toMatch(/email|phone|name|message|summary/i);
  });
});
