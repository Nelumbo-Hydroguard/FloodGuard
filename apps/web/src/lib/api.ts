/**
 * Cliente da API FloodGuard.
 *
 * Endpoints reais consumidos aqui usam o prefixo /api/... da API FastAPI
 * (services/api/app/main.py). Os nomes /risk/status, /scenarios/demo etc.
 * usados na documentação de produto mapeiam para /api/risk/status,
 * /api/scenarios/demo — mesmo módulo, prefixo consistente com geo/telemetry
 * já em uso desde a F2.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function getJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`FloodGuard API ${path} falhou: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new Error(
      `FloodGuard API ${path} falhou: ${response.status}${detail ? ` — ${JSON.stringify(detail.detail ?? detail)}` : ""}`,
    );
  }
  return response.json() as Promise<T>;
}

export async function fetchHealth() {
  return getJSON<{ status: string; service: string; mode: string }>("/health");
}

export async function fetchGeoStatus() {
  return getJSON<{ module: string; status: string; note: string }>("/api/geo/status");
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
  return getJSON<{ classes: HandZoneSummary[]; total_area_m2: number }>("/api/geo/hand-zones/summary");
}

// --- Motor de risco (F3) ---------------------------------------------

export type RiskLevel = "seguro" | "atencao" | "alerta" | "critico";

export interface RiskFactors {
  hand_weight: number;
  rainfall_factor: number;
  water_level_factor: number;
  trend_factor: number;
}

export interface RiskEvaluationResponse {
  risk_level: RiskLevel;
  risk_score: number;
  confidence: number;
  spatial_context_available: boolean;
  factors: RiskFactors;
  explanation: string;
  recommended_action: string;
  station_id: string | null;
  region: string | null;
  timestamp: string;
}

export interface RiskEvaluationRequest {
  latitude: number;
  longitude: number;
  rainfall_mm: number;
  water_level_m: number;
  previous_water_level_m?: number | null;
  hand_class_id?: number | null;
  hand_risk_weight?: number | null;
  region?: string | null;
  communication_status?: string;
  station_id?: string | null;
}

export async function fetchRiskStatus() {
  return getJSON<{ module: string; status: string; note: string }>("/api/risk/status");
}

export async function evaluateRisk(request: RiskEvaluationRequest) {
  return postJSON<RiskEvaluationResponse>("/api/risk/evaluate", request);
}

export interface ScenariosDemoResponse {
  source: string;
  scenarios: Record<"seguro" | "alerta" | "critico", RiskEvaluationResponse>;
}

export async function fetchScenariosDemo() {
  return getJSON<ScenariosDemoResponse>("/api/scenarios/demo");
}

export interface MeshPayload {
  protocol: string;
  channel: string;
  status: string;
  risk_level: RiskLevel;
  risk_score: number;
  region: string;
  recommended_action: string;
  compact_payload: string;
  latency_seconds_simulated: number;
  timestamp: string;
  source: string;
  implemented: boolean;
  note: string;
}

export async function buildMeshPayload(rawPayload: Record<string, unknown>) {
  return postJSON<MeshPayload>("/api/telemetry/mesh-payload", rawPayload);
}

// --- Mapa (F6) — camadas HAND com fallback estático quando PostGIS falha ---

export interface HandZoneStat {
  class_id: number;
  class_label: string;
  susceptibility: string;
  risk_weight: number;
  total_area_m2: number;
  percent_area: number | null;
}

export interface DemoMapResponse {
  status: "ok" | "degraded";
  source: "postgis" | "static_fallback";
  boundary_available: boolean;
  hand_zones_available: boolean;
  stats: HandZoneStat[];
  message: string;
}

export async function fetchDemoMap() {
  return getJSON<DemoMapResponse>("/api/geo/demo-map");
}

export interface DemoPoint {
  id: "seguro" | "alerta" | "critico";
  name: string;
  lat: number;
  lon: number;
  risk_level: RiskLevel;
  risk_score: number;
  explanation: string;
}

export async function fetchDemoPoints() {
  return getJSON<{ source: string; points: DemoPoint[] }>("/api/geo/demo-points");
}

/** GeoJSON Feature real do PostGIS — só funciona com `municipalities` populada (F2). */
export async function fetchMunicipalityBlumenau() {
  return getJSON<unknown>("/api/geo/municipality/blumenau");
}

/** GeoJSON FeatureCollection real do PostGIS — só funciona com `hand_zones` populada (F2). */
export async function fetchHandZonesGeoJSON() {
  return getJSON<unknown>("/api/geo/hand-zones");
}

/**
 * Camadas estáticas geradas por services/geo/scripts/generate_web_geojson.py
 * a partir de data/hand/ — servidas como arquivo puro pelo Vite
 * (apps/web/public/geo/), sem passar pela API. Usadas como fallback do
 * mapa quando o PostGIS não responde (ver RiskMap.tsx).
 */
export async function fetchStaticGeoJSON(filename: string) {
  const response = await fetch(`/geo/${filename}`);
  if (!response.ok) {
    throw new Error(`Arquivo estático /geo/${filename} não encontrado — rode generate_web_geojson.py.`);
  }
  return response.json();
}
