/**
 * Cliente mínimo da API FloodGuard.
 *
 * Ainda cobre pouco da API — geo/status e geo/hand-zones/summary entraram na
 * F2 (única fatia real hoje: camadas HAND). telemetry/risk/alerts/shelters
 * seguem placeholder, sem cliente próprio ainda.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function fetchHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error(`FloodGuard API health check failed: ${response.status}`);
  }
  return response.json() as Promise<{ status: string; service: string; mode: string }>;
}

export async function fetchGeoStatus() {
  const response = await fetch(`${API_BASE_URL}/api/geo/status`);
  if (!response.ok) {
    throw new Error(`FloodGuard API geo/status failed: ${response.status}`);
  }
  return response.json() as Promise<{ module: string; status: string; note: string }>;
}

export interface HandZoneSummary {
  class_id: number;
  class_label: string;
  susceptibility: string;
  risk_weight: number;
  total_area_m2: number;
  percent_area: number | null;
}

export async function fetchHandZonesSummary() {
  const response = await fetch(`${API_BASE_URL}/api/geo/hand-zones/summary`);
  if (!response.ok) {
    throw new Error(`FloodGuard API geo/hand-zones/summary failed: ${response.status}`);
  }
  return response.json() as Promise<{ classes: HandZoneSummary[]; total_area_m2: number }>;
}
