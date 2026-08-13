import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDemoAlerts, type DemoAlert, type RiskLevel } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import { PageHeader } from "../components/PageHeader";
import { DemoNotice } from "../components/DemoNotice";
import { RiskLegend } from "../components/RiskLegend";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { RISK_LEVELS_ORDERED, RISK_THEME } from "../lib/riskTheme";

// Rótulos legíveis para o `status` que o backend já devolve prefixado com
// simulated_ (app/routers/alerts.py) — mantém o prefixo visível no card
// (badge "simulado" já cobre isso), aqui só traduz pra leitura humana.
const STATUS_LABEL: Record<string, string> = {
  simulated_monitoring: "Em monitoramento",
  simulated_attention: "Em atenção",
  simulated_active: "Ativo",
  simulated_critical: "Crítico",
};

const ACTIVE_STATUSES = new Set(["simulated_active", "simulated_critical"]);

export function Alertas() {
  const [alerts, setAlerts] = useState<DemoAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<RiskLevel | "todos">("todos");
  const [onlyActive, setOnlyActive] = useState(false);

  useEffect(() => {
    fetchDemoAlerts()
      .then((data) => setAlerts(data.alerts))
      .catch(() => setError("Não foi possível carregar os alertas simulados. A API está rodando?"));
  }, []);

  if (error) {
    return (
      <div>
        <PageHeader title="Alertas" description="Alertas simulados, derivados do motor de risco." />
        <ErrorState message={error} />
      </div>
    );
  }

  const list = alerts ?? [];
  const visible = list
    .filter((a) => levelFilter === "todos" || a.risk_level === levelFilter)
    .filter((a) => !onlyActive || ACTIVE_STATUSES.has(a.status));

  return (
    <div>
      <PageHeader
        title="Alertas"
        description="Eventos simulados, derivados do motor de risco (/api/alerts/demo) — não há alerta real emitido pela Defesa Civil nesta PoC."
        actions={<RiskLegend />}
      />

      <div className="mb-4">
        <DemoNotice>
          Todo evento abaixo é <strong className="text-slate-300">simulado</strong>, sem
          persistência em banco. Quer testar outros valores?{" "}
          <Link to="/telemetria" className="text-accent underline underline-offset-2">
            Ir para Telemetria
          </Link>
          . Abrigos de apoio a esses eventos:{" "}
          <Link to="/abrigos" className="text-accent underline underline-offset-2">
            ver Abrigos
          </Link>
          .
        </DemoNotice>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setLevelFilter("todos")}
          className={`text-xs px-3 py-1 rounded border ${
            levelFilter === "todos" ? "border-accent text-accent" : "border-navy-600 text-slate-400 hover:text-white"
          }`}
        >
          Todos ({list.length})
        </button>
        {RISK_LEVELS_ORDERED.map((level) => {
          const count = list.filter((a) => a.risk_level === level).length;
          return (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`text-xs px-3 py-1 rounded border ${
                levelFilter === level ? RISK_THEME[level].badgeClass : "border-navy-600 text-slate-400 hover:text-white"
              }`}
            >
              {RISK_THEME[level].label} ({count})
            </button>
          );
        })}
        <label className="flex items-center gap-1.5 text-xs text-slate-400 ml-2 cursor-pointer select-none">
          <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} className="accent-accent" />
          Somente ativos/críticos
        </label>
      </div>

      {list.length === 0 && !error && (
        <EmptyState title="Carregando alertas…" description="Consultando /api/alerts/demo." />
      )}

      {list.length > 0 && visible.length === 0 && (
        <EmptyState title="Nenhum alerta neste filtro" description="Tente outro nível ou desmarque “Somente ativos/críticos”." />
      )}

      <div className="flex flex-col gap-3">
        {visible.map((alert) => (
          <div key={alert.id} className="border border-navy-700 bg-navy-900 rounded overflow-hidden">
            <div className={`h-1 ${RISK_THEME[alert.risk_level].barClass}`} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{alert.title}</h3>
                    <span className="text-[10px] font-mono uppercase text-slate-600 border border-navy-600 rounded px-1.5 py-0.5">
                      simulado
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Região: {alert.region ?? "não informada"} · {STATUS_LABEL[alert.status] ?? alert.status} ·{" "}
                    {new Date(alert.timestamp).toLocaleString("pt-BR")}
                  </p>
                </div>
                <StatusBadge level={alert.risk_level} />
              </div>

              <div className="flex items-center gap-3 mb-2 text-xs text-slate-500">
                <span className="font-mono">score {Math.round(alert.risk_score * 100)}%</span>
                <span className="font-mono">confiança {Math.round(alert.confidence * 100)}%</span>
              </div>

              <p className="text-sm text-slate-400 mb-2">{alert.explanation}</p>
              <p className="text-sm mb-3">
                <span className="text-slate-500">Ação recomendada: </span>
                <span className="text-slate-200">{alert.recommended_action}</span>
              </p>

              <Link
                to={`/alertas/${alert.id}`}
                className="inline-block text-xs font-semibold text-accent hover:underline underline-offset-2"
              >
                Ver detalhes →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
