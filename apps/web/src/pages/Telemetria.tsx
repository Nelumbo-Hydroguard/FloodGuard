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
import { DemoNotice } from "../components/DemoNotice";
import { ErrorState } from "../components/ErrorState";

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

const HAND_CLASS_OPTIONS = [
  { id: "3", label: "3 — Muito baixa suscetibilidade (peso 0.1)" },
  { id: "2", label: "2 — Baixa suscetibilidade (peso 0.3)" },
  { id: "1", label: "1 — Média suscetibilidade (peso 0.6)" },
  { id: "0", label: "0 — Alta suscetibilidade (peso 0.9)" },
];

function inputClass() {
  return "w-full rounded border border-navy-600 bg-navy-950 px-3 py-1.5 text-sm text-slate-100 focus:border-accent focus:outline-none";
}

export function Telemetria() {
  const [form, setForm] = useState<FormState>(QUICK_EXAMPLES.alerta);
  const [result, setResult] = useState<RiskEvaluationResponse | null>(null);
  const [meshPayload, setMeshPayload] = useState<MeshPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"evaluate" | "mesh" | null>(null);

  const field = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

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
      setError(err instanceof Error ? err.message : "Falha ao gerar payload simulado.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Telemetria"
        description="Ferramenta de teste operacional do motor de risco — nenhum sensor real por trás deste formulário."
      />

      <div className="mb-6">
        <DemoNotice>
          Formulário de teste — os valores abaixo são digitados manualmente ou
          carregados de um exemplo fixo, não vêm de sensor de campo.
        </DemoNotice>
      </div>

      <SectionCard title="Exemplos rápidos" subtitle="Preenche o formulário com um cenário de referência." className="mb-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => applyExample("seguro")}
            className="rounded border border-risk-safe/40 text-risk-safe px-3 py-1.5 text-sm hover:bg-risk-safe/10"
          >
            Seguro
          </button>
          <button
            type="button"
            onClick={() => applyExample("alerta")}
            className="rounded border border-risk-alert/40 text-risk-alert px-3 py-1.5 text-sm hover:bg-risk-alert/10"
          >
            Alerta
          </button>
          <button
            type="button"
            onClick={() => applyExample("critico")}
            className="rounded border border-risk-critical/40 text-risk-critical px-3 py-1.5 text-sm hover:bg-risk-critical/10"
          >
            Crítico
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Parâmetros da leitura" className="mb-6">
        <form onSubmit={handleEvaluate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Latitude
            <input className={inputClass()} value={form.latitude} onChange={field("latitude")} required />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Longitude
            <input className={inputClass()} value={form.longitude} onChange={field("longitude")} required />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Chuva acumulada (mm)
            <input className={inputClass()} type="number" min={0} value={form.rainfall_mm} onChange={field("rainfall_mm")} required />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Nível d'água (m)
            <input className={inputClass()} type="number" min={0} step={0.1} value={form.water_level_m} onChange={field("water_level_m")} required />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Nível d'água anterior (m) — usado para calcular tendência
            <input
              className={inputClass()}
              type="number"
              min={0}
              step={0.1}
              value={form.previous_water_level_m}
              onChange={field("previous_water_level_m")}
              placeholder="em branco = tendência neutra"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Classe HAND
            <select className={inputClass()} value={form.hand_class_id} onChange={field("hand_class_id")}>
              <option value="">sem contexto HAND (fallback)</option>
              {HAND_CLASS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Peso HAND (0 a 1) — sobrepõe a classe se preenchido
            <input className={inputClass()} type="number" min={0} max={1} step={0.05} value={form.hand_risk_weight} onChange={field("hand_risk_weight")} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300">
            Status de comunicação
            <select className={inputClass()} value={form.communication_status} onChange={field("communication_status")}>
              <option value="ok">ok</option>
              <option value="degraded">degraded</option>
              <option value="offline">offline</option>
              <option value="unknown">unknown</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-300 md:col-span-2">
            Região (opcional — usada no payload simulado e no lookup HAND mockado)
            <input className={inputClass()} value={form.region} onChange={field("region")} />
          </label>

          <div className="md:col-span-2 flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading !== null}
              className="rounded bg-accent px-4 py-2 text-sm font-semibold text-navy-950 hover:bg-accent/90 disabled:opacity-50"
            >
              {loading === "evaluate" ? "Avaliando…" : "Avaliar risco"}
            </button>
            <button
              type="button"
              onClick={handleMeshPayload}
              disabled={loading !== null}
              className="rounded border border-navy-600 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {loading === "mesh" ? "Gerando…" : "Gerar payload UniMesh/LoRa simulado"}
            </button>
          </div>
        </form>
      </SectionCard>

      {error && (
        <div className="mb-6">
          <ErrorState message={error} />
        </div>
      )}

      {result && (
        <div className="max-w-md mb-6">
          <RiskCard title="Resultado da avaliação" result={result} />
        </div>
      )}

      {meshPayload && (
        <SectionCard title="Payload UniMesh/LoRa simulado" className="max-w-md">
          <div className="flex items-center gap-2 mb-3 text-xs font-mono">
            <span className="rounded border border-risk-critical/40 bg-risk-critical/10 text-risk-critical px-2 py-0.5">
              implemented: false
            </span>
            <span className="text-slate-500">transmissão real não implementada</span>
          </div>
          <pre className="text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap bg-navy-950 rounded p-3 border border-navy-700">
            {JSON.stringify(meshPayload, null, 2)}
          </pre>
          <p className="text-xs text-slate-600 mt-2">{meshPayload.note}</p>
        </SectionCard>
      )}
    </div>
  );
}
