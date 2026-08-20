import type { DemoSensor } from "../data/demoOperations";
import type { RiskEvaluationResponse } from "../lib/api";
import { RISK_THEME } from "../lib/riskTheme";
import { formatClock } from "../lib/operations";
import { Drawer } from "./Drawer";
import { FactorBar } from "./FactorBar";
import { DemoBadge } from "./DemoBadge";
import { StatusBadge } from "./StatusBadge";

/**
 * Detalhe de um sensor/leitura.
 *
 * Mostra a decomposição do motor (HAND, chuva, nível, tendência) porque isso
 * é explicabilidade operacional — o operador precisa saber por que aquela
 * leitura virou "alerta". O que NÃO entra aqui é o conceito: o que HAND
 * significa está em /sobre.
 */

export interface SensorReadingView {
  sensor: DemoSensor;
  timestampIso: string;
  rainfallMm: number;
  waterLevelM: number;
  previousWaterLevelM: number;
  result: RiskEvaluationResponse;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-navy-800/70 py-2.5 last:border-b-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-right text-xs text-slate-200">{value}</dd>
    </div>
  );
}

export function SensorDetail({
  reading,
  onClose,
}: {
  reading: SensorReadingView | null;
  onClose: () => void;
}) {
  if (!reading) return null;

  const { sensor, result } = reading;
  const theme = RISK_THEME[result.risk_level];
  const delta = reading.waterLevelM - reading.previousWaterLevelM;
  const trend = delta > 0.01 ? "subindo" : delta < -0.01 ? "baixando" : "estável";

  return (
    <Drawer open eyebrow={`Sensor ${sensor.id}`} title={sensor.label} onClose={onClose}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StatusBadge level={result.risk_level} />
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
            sensor.status === "online"
              ? "border-risk-safe/40 bg-risk-safe/10 text-risk-safe"
              : "border-slate-500/40 bg-slate-500/10 text-slate-400"
          }`}
        >
          {sensor.status}
        </span>
        <DemoBadge />
      </div>

      <div className="mb-5 flex items-end gap-6">
        <div>
          <p className="data-label">Score</p>
          <p className={`mt-1 font-mono text-[40px] font-semibold leading-none ${theme.textClass}`}>
            {Math.round(result.risk_score * 100)}
            <span className="ml-0.5 text-lg text-slate-500">%</span>
          </p>
        </div>
        <div className="pb-1.5">
          <p className="data-label">Confiança</p>
          <p className="mt-1 font-mono text-lg font-semibold leading-none text-slate-300">
            {Math.round(result.confidence * 100)}%
          </p>
        </div>
      </div>

      <dl className="mb-5">
        <Row label="Local" value={sensor.region} />
        <Row label="Última leitura" value={formatClock(reading.timestampIso)} />
        <Row label="Nível d'água" value={<span className="font-mono">{reading.waterLevelM.toFixed(2)} m</span>} />
        <Row label="Chuva acumulada" value={<span className="font-mono">{reading.rainfallMm} mm</span>} />
        <Row
          label="Tendência"
          value={
            <span className={delta > 0.01 ? "text-risk-alert" : "text-slate-200"}>
              {trend} ({delta >= 0 ? "+" : ""}
              {delta.toFixed(2)} m)
            </span>
          }
        />
        <Row label="Comunicação" value={sensor.communicationStatus} />
      </dl>

      <div className="mb-5">
        <p className="data-label mb-3">Decomposição do risco</p>
        <div className="flex flex-col gap-3">
          <FactorBar label="HAND" value={result.factors.hand_weight} hint="suscetibilidade" />
          <FactorBar label="Chuva" value={result.factors.rainfall_factor} hint="acumulada" />
          <FactorBar label="Nível d'água" value={result.factors.water_level_factor} />
          <FactorBar label="Tendência" value={result.factors.trend_factor} hint="50% = estável" />
        </div>
      </div>

      <div className="rounded-lg border border-navy-700/70 bg-navy-950/60 p-3">
        <p className="data-label mb-1.5">Ação recomendada</p>
        <p className="text-sm leading-relaxed text-slate-200">{result.recommended_action}</p>
      </div>
    </Drawer>
  );
}
