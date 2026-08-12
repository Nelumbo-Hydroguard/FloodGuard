import type { RiskEvaluationResponse } from "../lib/api";
import { FactorBar } from "./FactorBar";
import { StatusBadge } from "./StatusBadge";

export function RiskCard({ title, result }: { title: string; result: RiskEvaluationResponse }) {
  return (
    <div className="border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        <StatusBadge level={result.risk_level} />
      </div>

      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-bold tabular-nums">{result.risk_score.toFixed(2)}</span>
        <span className="text-xs text-slate-500">
          score · confiança {Math.round(result.confidence * 100)}%
          {!result.spatial_context_available && " · sem HAND"}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <FactorBar label="HAND" value={result.factors.hand_weight} />
        <FactorBar label="Chuva" value={result.factors.rainfall_factor} />
        <FactorBar label="Nível d'água" value={result.factors.water_level_factor} />
        <FactorBar label="Tendência" value={result.factors.trend_factor} />
      </div>

      <p className="text-sm text-slate-400">{result.explanation}</p>

      <p className="text-sm border-t border-slate-800 pt-2">
        <span className="text-slate-500">Ação recomendada: </span>
        {result.recommended_action}
      </p>
    </div>
  );
}
