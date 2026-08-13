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
import { SectionCard } from "../components/SectionCard";
import { DemoNotice } from "../components/DemoNotice";
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
      .catch(() => setError("Não foi possível carregar os cenários simulados. A API está rodando em http://localhost:8000?"));
  }, []);

  if (error) {
    return (
      <div>
        <PageHeader title="Painel operacional" description="Defesa Civil de Blumenau/SC — PoC FloodGuard" />
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

  return (
    <div>
      <PageHeader
        title="Painel operacional"
        description="Resumo do motor de risco para a Defesa Civil de Blumenau/SC."
        actions={
          apiOnline !== null && (
            <span className={`text-xs font-mono px-2 py-1 rounded border ${apiOnline ? "border-risk-safe/40 text-risk-safe" : "border-risk-critical/40 text-risk-critical"}`}>
              motor de risco: {apiOnline ? "online" : "offline"}
            </span>
          )
        }
      />

      <div className="mb-4">
        <DemoNotice />
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Cenários avaliados" value={String(results.length)} hint="rodados pelo motor real" />
          <MetricCard
            label="Maior risco"
            value={highest ? RISK_THEME[highest.result.risk_level].label : "—"}
            accentClass={highest ? RISK_THEME[highest.result.risk_level].textClass : undefined}
            hint={highest ? scenarioTitle(highest.result.risk_level) : undefined}
          />
          <MetricCard
            label="Confiança média"
            value={avgConfidence != null ? `${Math.round(avgConfidence * 100)}%` : "—"}
            hint={`entre os ${results.length} cenários`}
          />
          <MetricCard label="Comunicação" value="Simulada" hint="UniMesh/LoRa, implemented: false" />
        </div>
      )}

      {highest && (
        <SectionCard title="Próxima ação recomendada" className="mb-6">
          <div className="flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${RISK_THEME[highest.result.risk_level].dotClass}`} />
            <p className="text-sm text-slate-200">{highest.result.recommended_action}</p>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Baseado no cenário de maior risco simulado ({scenarioTitle(highest.result.risk_level).toLowerCase()}).
          </p>
        </SectionCard>
      )}

      <div className="mb-3">
        <RiskLegend />
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {results.map(({ key, result }) => (
            <RiskCard key={key} title={scenarioTitle(result.risk_level)} result={result} />
          ))}
        </div>
      ) : (
        <EmptyState title="Carregando cenários…" description="Consultando o motor de risco em /api/scenarios/demo." />
      )}
    </div>
  );
}
