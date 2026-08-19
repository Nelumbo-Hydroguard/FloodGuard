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
        eyebrow="Fila operacional"
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

      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-navy-700/70 bg-navy-900/50 p-2">
        <button
          onClick={() => setLevelFilter("todos")}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            levelFilter === "todos"
              ? "border-accent/50 bg-accent/10 text-accent"
              : "border-transparent text-slate-400 hover:bg-navy-800 hover:text-slate-100"
          }`}
        >
          Todos <span className="ml-1 font-mono text-slate-500">{list.length}</span>
        </button>
        {RISK_LEVELS_ORDERED.map((level) => {
          const count = list.filter((a) => a.risk_level === level).length;
          const selected = levelFilter === level;
          return (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? RISK_THEME[level].badgeClass
                  : "border-transparent text-slate-400 hover:bg-navy-800 hover:text-slate-100"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${RISK_THEME[level].dotClass}`} />
              {RISK_THEME[level].label}
              <span className="font-mono text-slate-500">{count}</span>
            </button>
          );
        })}
        <label className="ml-auto flex cursor-pointer select-none items-center gap-2 px-2 text-xs text-slate-400">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
            className="accent-accent"
          />
          Somente ativos/críticos
        </label>
      </div>

      {list.length === 0 && !error && (
        <EmptyState loading title="Carregando alertas…" description="Consultando /api/alerts/demo." />
      )}

      {list.length > 0 && visible.length === 0 && (
        <EmptyState title="Nenhum alerta neste filtro" description="Tente outro nível ou desmarque “Somente ativos/críticos”." />
      )}

      <div className="flex flex-col gap-4">
        {visible.map((alert) => {
          const theme = RISK_THEME[alert.risk_level];
          return (
            <article key={alert.id} className="panel panel-interactive overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Coluna de severidade: score grande sobre fundo tingido no
                    nível do evento. A urgência é lida antes do texto. */}
                <div
                  className="flex shrink-0 flex-row items-center gap-4 border-b px-5 py-4 sm:w-[168px] sm:flex-col sm:items-start sm:justify-center sm:border-b-0 sm:border-r"
                  style={{ borderColor: `${theme.hex}33`, backgroundColor: `${theme.hex}0f` }}
                >
                  <StatusBadge level={alert.risk_level} />
                  <div>
                    <p className={`font-mono text-[34px] font-semibold leading-none ${theme.textClass}`}>
                      {Math.round(alert.risk_score * 100)}
                      <span className="text-base text-slate-500">%</span>
                    </p>
                    <p className="data-label mt-1.5">
                      confiança {Math.round(alert.confidence * 100)}%
                    </p>
                  </div>
                </div>

                <div className="min-w-0 flex-1 p-5">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-white">{alert.title}</h3>
                    <span className="rounded border border-navy-600 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      simulado
                    </span>
                  </div>
                  <p className="mb-3 text-xs text-slate-500">
                    {alert.region ?? "região não informada"} ·{" "}
                    {STATUS_LABEL[alert.status] ?? alert.status} ·{" "}
                    {new Date(alert.timestamp).toLocaleString("pt-BR")}
                  </p>

                  <p className="mb-3 text-sm leading-relaxed text-slate-400">{alert.explanation}</p>

                  <div className="mb-4 rounded-lg border border-navy-700/70 bg-navy-950/60 p-3">
                    <p className="data-label mb-1">Ação recomendada</p>
                    <p className="text-sm leading-relaxed text-slate-200">{alert.recommended_action}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/mapa?alert=${alert.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
                    >
                      Ver no mapa →
                    </Link>
                    <Link
                      to={`/alertas/${alert.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
