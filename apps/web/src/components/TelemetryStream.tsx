import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO_SENSORS, TELEMETRY_SERIES } from "../data/demoOperations";
import { evaluateRiskBatch, type RiskEvaluationResponse } from "../lib/api";
import { RISK_THEME } from "../lib/riskTheme";
import { formatClock } from "../lib/operations";
import { SectionCard } from "./SectionCard";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { DemoBadge } from "./DemoBadge";
import { SensorDetail, type SensorReadingView } from "./SensorDetail";

/**
 * Fluxo contínuo de sensores.
 *
 * Como funciona, e por que assim:
 *
 * - A SÉRIE É UM SCRIPT (data/demoOperations.ts). Nada de `Math.random()`:
 *   quem apresenta precisa saber que no passo 7 o risco vira alerta.
 * - O RISCO VEM DO MOTOR REAL. Ao iniciar, a série inteira vai numa única
 *   chamada a `/api/risk/evaluate-batch`; os resultados são revelados um a
 *   um no intervalo. Uma requisição por tick deixaria a demo refém da rede
 *   e poluiria a aba de rede — e hardcodar o nível de risco na fixture
 *   seria mentir sobre o que a plataforma calcula.
 * - MEMÓRIA LIMITADA. A lista para no fim do script (12 passos) e a
 *   renderização é limitada a `MAX_VISIBLE`. Não existe caminho em que
 *   isso cresça sem fim.
 * - O timer é sempre limpo no unmount e a cada mudança de estado, senão o
 *   intervalo continuaria rodando depois de sair da tela.
 */

const TICK_MS = 2500;
const MAX_VISIBLE = 12;

type StreamState = "idle" | "loading" | "running" | "paused" | "done";

interface StreamRow extends SensorReadingView {
  id: string;
}

const SENSOR_BY_ID = new Map(DEMO_SENSORS.map((sensor) => [sensor.id, sensor]));

export function TelemetryStream() {
  const [state, setState] = useState<StreamState>("idle");
  const [rows, setRows] = useState<StreamRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SensorReadingView | null>(null);

  // Resultados do motor para a série inteira, buscados uma única vez.
  const resultsRef = useRef<RiskEvaluationResponse[] | null>(null);
  const cursorRef = useRef(0);
  const startedAtRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const pushNext = useCallback(() => {
    const results = resultsRef.current;
    if (!results) return;
    const index = cursorRef.current;
    if (index >= TELEMETRY_SERIES.length) {
      clearTimer();
      setState("done");
      return;
    }

    const step = TELEMETRY_SERIES[index];
    const sensor = SENSOR_BY_ID.get(step.sensorId);
    const result = results[index];
    cursorRef.current = index + 1;
    if (!sensor || !result) return;

    setRows((prev) =>
      [
        {
          id: step.id,
          sensor,
          timestampIso: new Date(startedAtRef.current + step.offsetSeconds * 1000).toISOString(),
          rainfallMm: step.rainfallMm,
          waterLevelM: step.waterLevelM,
          previousWaterLevelM: step.previousWaterLevelM,
          result,
        },
        ...prev,
      ].slice(0, MAX_VISIBLE),
    );
  }, [clearTimer]);

  const start = useCallback(async () => {
    setError(null);

    if (!resultsRef.current) {
      setState("loading");
      try {
        const response = await evaluateRiskBatch(
          TELEMETRY_SERIES.map((step) => {
            const sensor = SENSOR_BY_ID.get(step.sensorId)!;
            return {
              latitude: sensor.latitude,
              longitude: sensor.longitude,
              rainfall_mm: step.rainfallMm,
              water_level_m: step.waterLevelM,
              previous_water_level_m: step.previousWaterLevelM,
              hand_class_id: sensor.handClassId,
              hand_risk_weight: sensor.handRiskWeight,
              communication_status: sensor.communicationStatus,
              region: sensor.region,
              station_id: sensor.id,
            };
          }),
        );
        resultsRef.current = response.results;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha ao avaliar a série no motor de risco.");
        setState("idle");
        return;
      }
    }

    startedAtRef.current = Date.now();
    setState("running");
    pushNext();
    clearTimer();
    timerRef.current = window.setInterval(pushNext, TICK_MS);
  }, [clearTimer, pushNext]);

  const pause = useCallback(() => {
    clearTimer();
    setState("paused");
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    cursorRef.current = 0;
    setRows([]);
    setError(null);
    setState("idle");
  }, [clearTimer]);

  const running = state === "running";
  const progress = `${Math.min(cursorRef.current, TELEMETRY_SERIES.length)}/${TELEMETRY_SERIES.length}`;

  return (
    <>
      <SectionCard
        title="Leituras recebidas"
        subtitle="Série simulada avaliada pelo motor de risco a cada leitura."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {!running ? (
              <button
                type="button"
                onClick={start}
                disabled={state === "loading" || state === "done"}
                className="rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-navy-950 transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                {state === "loading"
                  ? "Preparando…"
                  : state === "paused"
                    ? "Retomar"
                    : "Iniciar simulação"}
              </button>
            ) : (
              <button
                type="button"
                onClick={pause}
                className="rounded-lg border border-navy-600 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-accent hover:text-accent"
              >
                Pausar
              </button>
            )}
            <button
              type="button"
              onClick={reset}
              disabled={state === "idle" && rows.length === 0}
              className="rounded-lg border border-navy-600 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
            >
              Reiniciar
            </button>
          </div>
        }
      >
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono uppercase tracking-wider ${
              running
                ? "border-risk-safe/40 bg-risk-safe/10 text-risk-safe"
                : "border-navy-600 text-slate-500"
            }`}
          >
            <span className={`h-1 w-1 rounded-full ${running ? "animate-breathe bg-risk-safe" : "bg-slate-600"}`} />
            {running ? "recebendo" : state === "done" ? "série concluída" : "parado"}
          </span>
          <span className="font-mono">{progress} leituras</span>
          <DemoBadge />
        </div>

        {error && <ErrorState message={error} />}

        {rows.length === 0 && !error && (
          <EmptyState
            title="Nenhuma leitura recebida"
            description="Inicie a simulação para acompanhar as leituras chegando."
          />
        )}

        {rows.length > 0 && (
          <div className="flex flex-col">
            {rows.map((row) => {
              const theme = RISK_THEME[row.result.risk_level];
              const rising = row.waterLevelM > row.previousWaterLevelM;
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelected(row)}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-navy-800/70 px-1 py-3 text-left transition-colors last:border-b-0 hover:bg-navy-800/40"
                >
                  <span className="font-mono text-xs text-slate-500">{formatClock(row.timestampIso)}</span>
                  <span className="font-mono text-xs text-slate-300">{row.sensor.id}</span>
                  <span className="text-xs text-slate-400">{row.sensor.region}</span>
                  <span className="font-mono text-xs text-slate-200">
                    {row.waterLevelM.toFixed(2)} m
                    <span className={rising ? "ml-1 text-risk-alert" : "ml-1 text-slate-600"}>
                      {rising ? "↑" : "→"}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-slate-400">{row.rainfallMm} mm</span>
                  <span className={`ml-auto font-mono text-xs font-semibold ${theme.textClass}`}>
                    {Math.round(row.result.risk_score * 100)}%
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${theme.badgeClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${theme.dotClass}`} />
                    {theme.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SensorDetail reading={selected} onClose={() => setSelected(null)} />
    </>
  );
}
