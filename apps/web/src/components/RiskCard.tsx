import type { RiskEvaluationResponse } from "../lib/api";
import { FactorBar } from "./FactorBar";
import { StatusBadge } from "./StatusBadge";
import { RISK_THEME } from "../lib/riskTheme";
import { OPERATIONAL_ACTION_LABEL, getOperationalRecommendation } from "../lib/alertMessaging";

export function RiskCard({ title, result }: { title: string; result: RiskEvaluationResponse }) {
  const theme = RISK_THEME[result.risk_level];
  const score = Math.round(result.risk_score * 100);

  return (
    <div className="panel panel-interactive flex flex-col overflow-hidden">
      <div className={`severity-strip ${theme.barClass}`} style={{ boxShadow: `0 0 16px var(${theme.glowVar})` }} />

      <div className="flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold text-white">{title}</h3>
            {result.region && <p className="mt-0.5 text-xs text-slate-500">{result.region}</p>}
          </div>
          <StatusBadge level={result.risk_level} />
        </div>

        {/* Score e confiança lado a lado, com o score dominando a hierarquia:
            é o número que a Defesa Civil lê primeiro. */}
        <div className="flex items-end gap-4">
          <div>
            <p className="data-label">Score de risco</p>
            <p className={`mt-1 font-mono text-[40px] font-semibold leading-none ${theme.textClass}`}>
              {score}
              <span className="ml-0.5 text-lg text-slate-500">%</span>
            </p>
          </div>
          <div className="pb-1">
            <p className="data-label">Confiança</p>
            <p className="mt-1 font-mono text-lg font-semibold leading-none text-slate-300">
              {Math.round(result.confidence * 100)}%
            </p>
          </div>
        </div>

        {!result.spatial_context_available && (
          <p className="-mt-2 text-[11px] text-risk-attention">
            Sem contexto HAND — motor usou fallback espacial.
          </p>
        )}

        <div>
          <p className="data-label mb-3">Decomposição do risco</p>
          <div className="flex flex-col gap-3">
            <FactorBar label="HAND" value={result.factors.hand_weight} hint="suscetibilidade" />
            <FactorBar label="Chuva" value={result.factors.rainfall_factor} hint="acumulada" />
            <FactorBar label="Nível d'água" value={result.factors.water_level_factor} />
            <FactorBar label="Tendência" value={result.factors.trend_factor} hint="50% = estável" />
          </div>
        </div>

        <p className="border-t border-navy-700/70 pt-4 text-sm leading-relaxed text-slate-400">
          {result.explanation}
        </p>

        <div className="rounded-lg border border-navy-700/70 bg-navy-950/60 p-3">
          <p className="data-label mb-1.5">{OPERATIONAL_ACTION_LABEL}</p>
          <p className="text-sm leading-relaxed text-slate-200">
            {getOperationalRecommendation(result.risk_level, result.recommended_action)}
          </p>
        </div>
      </div>
    </div>
  );
}
