import { useEffect, useState } from "react";
import {
  fetchRiskStatus,
  fetchScenariosDemo,
  type RiskEvaluationResponse,
  type RiskLevel,
  type ScenariosDemoResponse,
} from "../lib/api";
import { RISK_THEME, riskWeight } from "../lib/riskTheme";
import { RiskCard } from "../components/RiskCard";
import { PageHeader } from "../components/PageHeader";
import { MetricCard } from "../components/MetricCard";
import { RiskLegend } from "../components/RiskLegend";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";

/**
 * Título derivado do nível de risco que o motor realmente devolveu — não da
 * chave do cenário (F9).
 *
 * A chave (`seguro`/`alerta`/`critico`) descreve a *intenção* do cenário
 * fixo; o `risk_level` é o resultado real da fórmula. Enquanto os dois
 * coincidirem não há diferença visível, mas ajustar um parâmetro em
 * `app/routers/scenarios.py::DEMO_SCENARIOS` faria o card exibir um título
 * contradizendo o próprio badge — exatamente o problema que a auditoria
 * F6.2 corrigiu em `Alertas.tsx`. Aqui o título passa a vir da mesma fonte
 * única de rótulos (`RISK_THEME`).
 */
function scenarioTitle(level: RiskLevel): string {
  return `Cenário ${RISK_THEME[level].label.toLowerCase()}`;
}

export function Dashboard() {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [scenarios, setScenarios] = useState<ScenariosDemoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRiskStatus()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));

    fetchScenariosDemo()
      .then(setScenarios)
      .catch(() => setError("Sem resposta do motor de risco. Verifique se a API está no ar (http://localhost:8000)."));
  }, []);

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Defesa Civil · Blumenau/SC" title="Painel operacional" />
        <ErrorState message={error} />
      </div>
    );
  }

  const results = scenarios
    ? (Object.keys(scenarios.scenarios) as Array<keyof ScenariosDemoResponse["scenarios"]>).map((key) => ({
        key,
        result: scenarios.scenarios[key],
      }))
    : [];

  const highest = results.reduce<{ key: string; result: RiskEvaluationResponse } | null>((acc, curr) => {
    if (!acc || riskWeight(curr.result.risk_level) > riskWeight(acc.result.risk_level)) return curr;
    return acc;
  }, null);

  const avgConfidence = results.length
    ? results.reduce((sum, r) => sum + r.result.confidence, 0) / results.length
    : null;

  const needAttention = results.filter(
    ({ result }) => riskWeight(result.risk_level) >= riskWeight("alerta"),
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="Defesa Civil · Blumenau/SC"
        title="Painel operacional"
        description="Situação atual dos cenários monitorados e próxima ação recomendada."
        actions={
          apiOnline !== null && (
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${
                apiOnline
                  ? "border-risk-safe/40 bg-risk-safe/10 text-risk-safe"
                  : "border-risk-critical/40 bg-risk-critical/10 text-risk-critical"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${apiOnline ? "animate-breathe bg-risk-safe" : "bg-risk-critical"}`}
                style={{ boxShadow: `0 0 8px var(${apiOnline ? "--glow-safe" : "--glow-critical"})` }}
              />
              motor de risco {apiOnline ? "online" : "offline"}
            </span>
          )
        }
      />

      {results.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Cenários monitorados" value={String(results.length)} hint="simulados" />
          <MetricCard
            label="Maior risco"
            variant="text"
            value={highest ? RISK_THEME[highest.result.risk_level].label : "—"}
            accentClass={highest ? RISK_THEME[highest.result.risk_level].textClass : undefined}
            hint={highest ? scenarioTitle(highest.result.risk_level) : undefined}
          />
          <MetricCard
            label="Precisam de atenção"
            value={String(needAttention)}
            accentClass={needAttention > 0 ? "text-risk-alert" : "text-risk-safe"}
            hint="alerta ou crítico"
          />
          <MetricCard
            label="Confiança média"
            value={avgConfidence != null ? `${Math.round(avgConfidence * 100)}%` : "—"}
            hint={`entre ${results.length} cenários`}
          />
        </div>
      )}

      {highest && (
        <div className="panel relative mb-6 overflow-hidden p-5">
          {/* Filete na cor do maior risco: a ação recomendada é o que a
              Defesa Civil precisa ler primeiro, então ela carrega a
              severidade do cenário que a motivou. */}
          <span
            className={`absolute inset-y-0 left-0 w-[3px] ${RISK_THEME[highest.result.risk_level].barClass}`}
            style={{ boxShadow: `0 0 16px var(${RISK_THEME[highest.result.risk_level].glowVar})` }}
          />
          <div className="flex flex-col gap-2 pl-2">
            <p className="data-label">Próxima ação recomendada</p>
            <p className="font-display text-lg font-semibold leading-snug text-white">
              {highest.result.recommended_action}
            </p>
            <p className="text-xs text-slate-500">
              {scenarioTitle(highest.result.risk_level)} · maior risco no momento
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-4 border-b border-navy-700/70 pb-3">
        <p className="data-label">Cenários monitorados</p>
        <RiskLegend />
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {results.map(({ key, result }) => (
            <RiskCard key={key} title={scenarioTitle(result.risk_level)} result={result} />
          ))}
        </div>
      ) : (
        <EmptyState loading title="Carregando cenários…" description="Consultando o motor de risco." />
      )}
    </div>
  );
}
