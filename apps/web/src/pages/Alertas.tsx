import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchScenariosDemo, type RiskEvaluationResponse, type RiskLevel, type ScenariosDemoResponse } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import { PageHeader } from "../components/PageHeader";
import { DemoNotice } from "../components/DemoNotice";
import { RiskLegend } from "../components/RiskLegend";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { RISK_LEVELS_ORDERED, RISK_THEME } from "../lib/riskTheme";

// O título tem de bater com o nível real devolvido pelo motor — até a F6.2
// o cenário "alerta" era rotulado "— atenção" enquanto o badge mostrava
// "ALERTA" (contradição apontada na auditoria). "Evento simulado" é o termo
// genérico; o nível vem do RISK_THEME, fonte única dos 4 rótulos.
function scenarioTitle(level: RiskLevel): string {
  return `Evento simulado — ${RISK_THEME[level].label}`;
}

export function Alertas() {
  const [scenarios, setScenarios] = useState<ScenariosDemoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<RiskLevel | "todos">("todos");

  useEffect(() => {
    fetchScenariosDemo()
      .then(setScenarios)
      .catch(() => setError("Não foi possível carregar os alertas simulados. A API está rodando?"));
  }, []);

  if (error) {
    return (
      <div>
        <PageHeader title="Alertas" description="Alertas simulados, derivados dos cenários do motor de risco." />
        <ErrorState message={error} />
      </div>
    );
  }

  const alerts = scenarios
    ? (Object.keys(scenarios.scenarios) as Array<keyof ScenariosDemoResponse["scenarios"]>).map((key) => ({
        key,
        result: scenarios.scenarios[key] as RiskEvaluationResponse,
      }))
    : [];

  const visible = filter === "todos" ? alerts : alerts.filter((a) => a.result.risk_level === filter);

  return (
    <div>
      <PageHeader
        title="Alertas"
        description="Alertas simulados, derivados dos 3 cenários fixos do motor de risco — não há alerta real emitido pela Defesa Civil nesta PoC."
        actions={<RiskLegend />}
      />

      <div className="mb-4">
        <DemoNotice>
          Todo alerta abaixo é <strong className="text-slate-300">simulado</strong> — gerado a
          partir de `/api/scenarios/demo`, não de uma emissão real da Defesa
          Civil. Quer testar outros valores?{" "}
          <Link to="/telemetria" className="text-accent underline underline-offset-2">
            Ir para Telemetria
          </Link>
          .
        </DemoNotice>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilter("todos")}
          className={`text-xs px-3 py-1 rounded border ${
            filter === "todos" ? "border-accent text-accent" : "border-navy-600 text-slate-400 hover:text-white"
          }`}
        >
          Todos ({alerts.length})
        </button>
        {RISK_LEVELS_ORDERED.map((level) => {
          const count = alerts.filter((a) => a.result.risk_level === level).length;
          return (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`text-xs px-3 py-1 rounded border ${
                filter === level ? RISK_THEME[level].badgeClass : "border-navy-600 text-slate-400 hover:text-white"
              }`}
            >
              {RISK_THEME[level].label} ({count})
            </button>
          );
        })}
      </div>

      {alerts.length === 0 && !error && (
        <EmptyState title="Carregando alertas…" description="Consultando /api/scenarios/demo." />
      )}

      {alerts.length > 0 && visible.length === 0 && (
        <EmptyState title="Nenhum alerta neste filtro" description="Tente selecionar outro nível ou volte para “Todos”." />
      )}

      <div className="flex flex-col gap-3">
        {visible.map(({ key, result }) => (
          <div key={key} className="border border-navy-700 bg-navy-900 rounded overflow-hidden">
            <div className={`h-1 ${RISK_THEME[result.risk_level].barClass}`} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{scenarioTitle(result.risk_level)}</h3>
                    <span className="text-[10px] font-mono uppercase text-slate-600 border border-navy-600 rounded px-1.5 py-0.5">
                      simulado
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Região: {result.region ?? "não informada"} ·{" "}
                    {new Date(result.timestamp).toLocaleString("pt-BR")}
                  </p>
                </div>
                <StatusBadge level={result.risk_level} />
              </div>
              <p className="text-sm text-slate-400 mb-2">{result.explanation}</p>
              <p className="text-sm">
                <span className="text-slate-500">Ação recomendada: </span>
                <span className="text-slate-200">{result.recommended_action}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
