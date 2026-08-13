import type { RiskEvaluationResponse } from "../lib/api";
import { FactorBar } from "./FactorBar";
import { StatusBadge } from "./StatusBadge";
import { RISK_THEME } from "../lib/riskTheme";

export function RiskCard({ title, result }: { title: string; result: RiskEvaluationResponse }) {
  const theme = RISK_THEME[result.risk_level];

  return (
    <div className="border border-navy-700 bg-navy-900 rounded overflow-hidden flex flex-col">
      <div className={`h-1 ${theme.barClass}`} />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-white">{title}</h3>
            {result.region && <p className="text-xs text-slate-500">{result.region}</p>}
          </div>
          <StatusBadge level={result.risk_level} />
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold font-mono tabular-nums text-white">
            {Math.round(result.risk_score * 100)}%
          </span>
          <span className="text-xs text-slate-500">
            confiança {Math.round(result.confidence * 100)}%
            {!result.spatial_context_available && (
              <span className="text-risk-attention"> · sem contexto HAND</span>
            )}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <FactorBar label="HAND" value={result.factors.hand_weight} />
          <FactorBar label="Chuva" value={result.factors.rainfall_factor} />
          <FactorBar label="Nível d'água" value={result.factors.water_level_factor} />
          <FactorBar label="Tendência" value={result.factors.trend_factor} />
        </div>

        <p className="text-sm text-slate-400">{result.explanation}</p>

        <p className="text-sm border-t border-navy-700 pt-2">
          <span className="text-slate-500">Ação recomendada: </span>
          <span className="text-slate-200">{result.recommended_action}</span>
        </p>
      </div>
    </div>
  );
}
