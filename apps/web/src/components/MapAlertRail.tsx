import { Link } from "react-router-dom";
import type { DemoAlert } from "../lib/api";
import { RISK_THEME } from "../lib/riskTheme";

/**
 * Trilha de alertas sobreposta ao mapa.
 *
 * Não é fonte de dado nova: são os mesmos eventos de `/api/alerts/demo` que
 * já viram marcador no mapa e já preenchem `/alertas`. O que muda é o acesso
 * — antes, para focar um alerta era preciso sair do mapa, ir até a lista e
 * voltar por `?alert=<id>`. A trilha aciona exatamente esse mesmo mecanismo
 * (o `MapAlertFocus` de RiskMap.tsx), só que sem sair da tela.
 */
export function MapAlertRail({
  alerts,
  activeId,
  onSelect,
}: {
  alerts: DemoAlert[] | null;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <aside className="panel-glass absolute right-6 top-6 z-[1000] flex max-h-[calc(100%-3rem)] w-[288px] animate-rise-in flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-navy-700/70 px-4 py-3">
        <p className="data-label">Alertas</p>
        <span className="rounded-full border border-navy-600 px-2 py-0.5 font-mono text-[10px] text-slate-400">
          {alerts.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {alerts.map((alert) => {
          const theme = RISK_THEME[alert.risk_level];
          const active = alert.id === activeId;
          return (
            <button
              key={alert.id}
              type="button"
              onClick={() => onSelect(alert.id)}
              aria-pressed={active}
              className={`flex w-full items-start gap-3 border-b border-navy-800/70 px-4 py-3 text-left transition-colors last:border-b-0 ${
                active ? "bg-accent/[0.08]" : "hover:bg-navy-800/50"
              }`}
            >
              <span
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${theme.dotClass}`}
                style={{ boxShadow: `0 0 10px var(${theme.glowVar})` }}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`text-xs font-semibold ${theme.textClass}`}>{theme.label}</span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {Math.round(alert.risk_score * 100)}%
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                  {alert.region ?? "região não informada"}
                </span>
                <span className="mt-1 block text-[11px] leading-snug text-slate-500 line-clamp-2">
                  {alert.recommended_action}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-navy-700/70 px-4 py-2.5">
        <Link
          to="/alertas"
          className="text-[11px] font-semibold text-accent underline-offset-2 hover:underline"
        >
          Ver lista completa →
        </Link>
      </div>
    </aside>
  );
}
