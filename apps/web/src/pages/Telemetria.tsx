import { useState, type FormEvent } from "react";
import {
  buildMeshPayload,
  evaluateRisk,
  type MeshPayload,
  type RiskEvaluationResponse,
} from "../lib/api";
import { RiskCard } from "../components/RiskCard";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { RISK_THEME } from "../lib/riskTheme";
import { TelemetryStream } from "../components/TelemetryStream";
import { DEMO_SENSORS } from "../data/demoOperations";
import { formatRelative } from "../lib/operations";
import { resolveTimestamp } from "../data/demoOperations";

interface FormState {
  latitude: string;
  longitude: string;
  rainfall_mm: string;
  water_level_m: string;
  previous_water_level_m: string;
  hand_class_id: string;
  hand_risk_weight: string;
  communication_status: string;
  region: string;
}

// Mesmos 3 cenários fixos de app/routers/scenarios.py::DEMO_SCENARIOS —
// atalhos pra não precisar digitar tudo pra testar o motor na demo.
const QUICK_EXAMPLES: Record<"seguro" | "alerta" | "critico", FormState> = {
  seguro: {
    latitude: "-26.914",
    longitude: "-49.077",
    rainfall_mm: "5",
    water_level_m: "0.3",
    previous_water_level_m: "0.3",
    hand_class_id: "3",
    hand_risk_weight: "0.1",
    communication_status: "ok",
    region: "Garcia",
  },
  alerta: {
    latitude: "-26.925",
    longitude: "-49.073",
    rainfall_mm: "90",
    water_level_m: "1.8",
    previous_water_level_m: "1.5",
    hand_class_id: "1",
    hand_risk_weight: "0.6",
    communication_status: "ok",
    region: "Velha",
  },
  critico: {
    latitude: "-26.898",
    longitude: "-49.081",
    rainfall_mm: "140",
    water_level_m: "2.8",
    previous_water_level_m: "2.2",
    hand_class_id: "0",
    hand_risk_weight: "0.9",
    communication_status: "degraded",
    region: "Itoupava Norte",
  },
};

// Pesos idênticos a app/engine/spatial_context.py::HAND_CLASSES_BY_ID.
const HAND_CLASS_OPTIONS = [
  { id: "3", weight: "0.1", label: "Muito baixa · 0.1" },
  { id: "2", weight: "0.3", label: "Baixa · 0.3" },
  { id: "1", weight: "0.6", label: "Média · 0.6" },
  { id: "0", weight: "0.9", label: "Alta · 0.9" },
];

const WEIGHT_BY_HAND_CLASS: Record<string, string> = Object.fromEntries(
  HAND_CLASS_OPTIONS.map((opt) => [opt.id, opt.weight]),
);

function inputClass() {
  return "w-full rounded-lg border border-navy-600/80 bg-navy-950/80 px-3 py-2 font-mono text-sm text-slate-100 transition-colors placeholder:font-sans placeholder:text-slate-600 hover:border-navy-600 focus:border-accent focus:outline-none";
}

function fieldLabelClass() {
  return "flex flex-col gap-1.5 text-xs font-medium text-slate-300";
}

/**
 * Dois modos, um console.
 *
 * "Avaliar leitura" é a ferramenta que já existia: digita parâmetros, o
 * motor responde. "Fluxo de sensores" é a visão de acompanhamento — a série
 * demo chegando no tempo, avaliada pelo mesmo motor. Uma tela só com as duas
 * coisas empilhadas ficaria longa e sem foco; abas mantêm cada gesto inteiro.
 */
type Mode = "avaliar" | "fluxo";

const MODES: Array<{ key: Mode; label: string }> = [
  { key: "avaliar", label: "Avaliar leitura" },
  { key: "fluxo", label: "Fluxo de sensores" },
];

export function Telemetria() {
  const [mode, setMode] = useState<Mode>("avaliar");
  const [form, setForm] = useState<FormState>(QUICK_EXAMPLES.alerta);
  const [result, setResult] = useState<RiskEvaluationResponse | null>(null);
  const [meshPayload, setMeshPayload] = useState<MeshPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"evaluate" | "mesh" | null>(null);

  const field = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  /**
   * Trocar a classe HAND também ajusta o peso (F9).
   *
   * O backend prioriza `hand_risk_weight` sobre `hand_class_id`
   * (app/engine/risk_engine.py::_resolve_spatial_context). Sem esta
   * sincronização, mudar o seletor de classe não alterava nada enquanto o
   * campo de peso estivesse preenchido: a tela exibia "peso 0.1" e o motor
   * calculava com 0.9. Pior, escolher "sem contexto HAND" não ativava o
   * fallback, porque o peso continuava preenchido.
   *
   * O campo de peso continua editável — quem quiser um valor fora da tabela
   * ainda pode digitar depois de escolher a classe.
   */
  function handleHandClassChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const classId = event.target.value;
    setForm((prev) => ({
      ...prev,
      hand_class_id: classId,
      hand_risk_weight: classId === "" ? "" : (WEIGHT_BY_HAND_CLASS[classId] ?? prev.hand_risk_weight),
    }));
  }

  function applyExample(example: keyof typeof QUICK_EXAMPLES) {
    setForm(QUICK_EXAMPLES[example]);
    setResult(null);
    setMeshPayload(null);
    setError(null);
  }

  const buildRequestPayload = () => ({
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    rainfall_mm: Number(form.rainfall_mm),
    water_level_m: Number(form.water_level_m),
    previous_water_level_m: form.previous_water_level_m === "" ? null : Number(form.previous_water_level_m),
    hand_class_id: form.hand_class_id === "" ? null : Number(form.hand_class_id),
    hand_risk_weight: form.hand_risk_weight === "" ? null : Number(form.hand_risk_weight),
    communication_status: form.communication_status,
    region: form.region || null,
  });

  async function handleEvaluate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading("evaluate");
    try {
      const response = await evaluateRisk(buildRequestPayload());
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao avaliar risco.");
    } finally {
      setLoading(null);
    }
  }

  async function handleMeshPayload() {
    setError(null);
    setLoading("mesh");
    try {
      const response = await buildMeshPayload(buildRequestPayload());
      setMeshPayload(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao gerar payload.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Console do motor de risco"
        title="Telemetria"
        description="Acompanhe as leituras dos sensores ou avalie uma leitura manual. Valores simulados."
      />

      <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-navy-700/70 pb-3">
        {MODES.map((option) => {
          const active = mode === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setMode(option.key)}
              aria-current={active ? "true" : undefined}
              className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                active ? "text-white" : "text-slate-400 hover:text-slate-100"
              }`}
            >
              {option.label}
              <span
                className={`absolute inset-x-2 -bottom-[13px] h-0.5 rounded-full transition-all ${
                  active ? "bg-accent shadow-[0_0_12px_var(--glow-accent)]" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>

      {mode === "fluxo" && (
        <div className="flex flex-col gap-4">
          <TelemetryStream />

          <SectionCard title="Sensores" subtitle="Rede simulada de monitoramento.">
            <div className="flex flex-col">
              {DEMO_SENSORS.map((sensor) => (
                <div
                  key={sensor.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-navy-800/70 py-3 last:border-b-0"
                >
                  <span className="font-mono text-xs text-slate-300">{sensor.id}</span>
                  <span className="text-sm text-slate-200">{sensor.label}</span>
                  <span className="text-xs text-slate-500">{sensor.region}</span>
                  <span className="font-mono text-xs text-slate-400">
                    {sensor.waterLevelM.toFixed(2)} m · {sensor.rainfallMm} mm
                  </span>
                  <span className="text-[11px] text-slate-600">
                    {formatRelative(resolveTimestamp(sensor.lastReadingMinutesAgo))}
                  </span>
                  <span
                    className={`ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      sensor.status === "online"
                        ? "border-risk-safe/40 bg-risk-safe/10 text-risk-safe"
                        : "border-slate-500/40 bg-slate-500/10 text-slate-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        sensor.status === "online" ? "animate-breathe bg-risk-safe" : "bg-slate-500"
                      }`}
                    />
                    {sensor.status}
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Entrada à esquerda, saída à direita e fixa: é o gesto de uma
          ferramenta operacional — mexe no parâmetro, vê o motor responder,
          sem perder o resultado de vista ao rolar o formulário.

          `hidden` em vez de desmontar: trocar para o fluxo de sensores e
          voltar não pode apagar o resultado que o operador acabou de
          calcular. */}
      <div className={`grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px] ${mode === "avaliar" ? "" : "hidden"}`}>
        <div className="flex flex-col gap-4">
      <SectionCard
        title="Presets"
        subtitle="Carrega um cenário de referência."
      >
        <div className="grid grid-cols-3 gap-2">
          {(["seguro", "alerta", "critico"] as const).map((key) => {
            const theme = RISK_THEME[key === "critico" ? "critico" : key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => applyExample(key)}
                className="group flex items-center justify-center gap-2 rounded-lg border border-navy-600/80 bg-navy-950/50 px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-navy-600 hover:bg-navy-800"
              >
                <span
                  className={`h-2 w-2 rounded-full ${theme.dotClass}`}
                  style={{ boxShadow: `0 0 8px var(${theme.glowVar})` }}
                />
                {theme.label}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Leitura">
        <form onSubmit={handleEvaluate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className={fieldLabelClass()}>
            Latitude
            <input className={inputClass()} value={form.latitude} onChange={field("latitude")} required />
          </label>
          <label className={fieldLabelClass()}>
            Longitude
            <input className={inputClass()} value={form.longitude} onChange={field("longitude")} required />
          </label>
          <label className={fieldLabelClass()}>
            Chuva acumulada (mm)
            <input className={inputClass()} type="number" min={0} value={form.rainfall_mm} onChange={field("rainfall_mm")} required />
          </label>
          <label className={fieldLabelClass()}>
            Nível d'água (m)
            <input className={inputClass()} type="number" min={0} step={0.1} value={form.water_level_m} onChange={field("water_level_m")} required />
          </label>
          <label className={fieldLabelClass()}>
            Nível d'água anterior (m)
            <input
              className={inputClass()}
              type="number"
              min={0}
              step={0.1}
              value={form.previous_water_level_m}
              onChange={field("previous_water_level_m")}
              placeholder="vazio = tendência neutra"
            />
          </label>
          <label className={fieldLabelClass()}>
            Classe HAND
            <select className={inputClass()} value={form.hand_class_id} onChange={handleHandClassChange}>
              <option value="">Sem contexto HAND</option>
              {HAND_CLASS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className={fieldLabelClass()}>
            Peso HAND (0–1)
            <input className={inputClass()} type="number" min={0} max={1} step={0.05} value={form.hand_risk_weight} onChange={field("hand_risk_weight")} />
          </label>
          <label className={fieldLabelClass()}>
            Status de comunicação
            <select className={inputClass()} value={form.communication_status} onChange={field("communication_status")}>
              <option value="ok">ok</option>
              <option value="degraded">degraded</option>
              <option value="offline">offline</option>
              <option value="unknown">unknown</option>
            </select>
          </label>
          <label className={`${fieldLabelClass()} md:col-span-2`}>
            Região (opcional)
            <input className={inputClass()} value={form.region} onChange={field("region")} />
          </label>

          <div className="flex flex-col gap-2 border-t border-navy-700/70 pt-4 sm:flex-row md:col-span-2">
            <button
              type="submit"
              disabled={loading !== null}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-[0_0_20px_var(--glow-accent)] transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:shadow-none"
            >
              {loading === "evaluate" ? "Avaliando…" : "Avaliar risco"}
            </button>
            <button
              type="button"
              onClick={handleMeshPayload}
              disabled={loading !== null}
              className="rounded-lg border border-navy-600 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {loading === "mesh" ? "Gerando…" : "Gerar payload UniMesh/LoRa"}
            </button>
          </div>
        </form>
      </SectionCard>
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-[4.5rem]">
          {error && <ErrorState message={error} />}

          {result ? (
            <RiskCard title="Resultado da avaliação" result={result} />
          ) : (
            !error && (
              <EmptyState
                title="Nenhuma avaliação ainda"
                description="Escolha um preset ou preencha a leitura e clique em “Avaliar risco”."
              />
            )
          )}

          {meshPayload && (
            <SectionCard title="Payload UniMesh/LoRa simulado">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-risk-critical/40 bg-risk-critical/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-risk-critical">
                  implemented: false
                </span>
                <span className="text-[11px] text-slate-500">transmissão não implementada</span>
              </div>
              <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-navy-700 bg-navy-950 p-3 font-mono text-[11px] leading-relaxed text-slate-400">
                {JSON.stringify(meshPayload, null, 2)}
              </pre>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
