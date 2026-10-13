import type { EstimateResult, HouseParameters } from "./types";
import { projects } from "../projects/catalog";
import { projectUrl, publishableKey } from "../backend/config";

export function createDemoRequestPayload(
  parameters: HouseParameters,
  estimate: EstimateResult,
  projectName: string | null,
  mode: "turnkey" | "stages",
  clientRequestId: string,
) {
  return {
    p_client_request_id: clientRequestId,
    p_project_number: projects.find((project) => project.name === projectName)?.number ?? null,
    p_project_type: parameters.projectType,
    p_region: parameters.region,
    p_area: parameters.area,
    p_construction_mode: mode,
    p_stage_ids: estimate.stages.filter((stage) => stage.included).map((stage) => stage.id),
    p_estimate_total: Math.round(estimate.total),
    p_data_version: estimate.dataVersion,
  };
}

export async function submitDemoRequest(
  payload: ReturnType<typeof createDemoRequestPayload>,
): Promise<string> {
  const response = await fetch(`${projectUrl}/rest/v1/rpc/submit_demo_request`, {
    method: "POST",
    headers: { apikey: publishableKey, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(response.status === 429 ? "limit" : "request");
  }
  const id: unknown = await response.json();
  if (typeof id !== "string") throw new Error("response");
  return id;
}
