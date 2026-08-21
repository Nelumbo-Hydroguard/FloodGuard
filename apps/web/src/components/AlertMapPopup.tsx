import { Link } from "react-router-dom";
import type { DemoAlert } from "../lib/api";
import { RISK_THEME } from "../lib/riskTheme";
import { OPERATIONAL_ACTION_LABEL, getOperationalRecommendationShort } from "../lib/alertMessaging";

// Rótulos legíveis do `status` prefixado com simulated_ (mesmo dicionário
// usado em Alertas.tsx e AlertDetail.tsx) — aqui só pra leitura humana no
// popup do mapa, o prefixo simulated_ continua no dado bruto.
const STATUS_LABEL: Record<string, string> = {
  simulated_monitoring: "Em monitoramento",
  simulated_attention: "Em atenção",
  simulated_active: "Ativo",
  simulated_critical: "Crítico",
};

/**
 * Card de alerta exibido no Popup do Leaflet ao clicar num marcador do mapa.
 * Inspirado na ideia de "abrir detalhe operacional ao selecionar um alerta"
 * do projeto de referência TechGuard Sentinela (João Benvenutti) — adaptado
 * ao padrão visual do FloodGuard (Popup do Leaflet + tokens de RISK_THEME,
 * não o modal/side-panel deles) e aos campos que o motor de risco do
 * FloodGuard realmente calcula (ver docs/auditoria-mapa-benvenutti-f9-1.md).
 *
 * Cores seguem o tema ESCURO do popup definido em index.css (F10). Antes o
 * popup do Leaflet era branco e este card era escrito para fundo claro.
 */
export function AlertMapPopup({ alert }: { alert: DemoAlert }) {
  const theme = RISK_THEME[alert.risk_level];

  return (
    <div className="min-w-[236px] max-w-[268px]">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${theme.dotClass}`}
          style={{ boxShadow: `0 0 8px var(${theme.glowVar})` }}
        />
        <strong className="text-[13px] font-semibold text-white">{alert.title}</strong>
      </div>

      <p className="mb-3 text-[11px] text-slate-500">
        {alert.region ?? "região não informada"} · {STATUS_LABEL[alert.status] ?? alert.status}
      </p>

      <div className="mb-3 flex gap-4">
        <div>
          <p className="data-label">Score</p>
          <p className={`font-mono text-lg font-semibold leading-tight ${theme.textClass}`}>
            {Math.round(alert.risk_score * 100)}%
          </p>
        </div>
        <div>
          <p className="data-label">Confiança</p>
          <p className="font-mono text-lg font-semibold leading-tight text-slate-300">
            {Math.round(alert.confidence * 100)}%
          </p>
        </div>
      </div>

      {/* Justificativa contida em 3 linhas: o popup é resumo operacional,
          não a tela de detalhe. O texto inteiro está em /alertas/:id. */}
      <p className="mb-3 text-[11px] leading-relaxed text-slate-400 line-clamp-3">{alert.explanation}</p>

      <div className="mb-3 rounded-lg border border-navy-700 bg-navy-950/70 p-2.5">
        <p className="data-label mb-1">{OPERATIONAL_ACTION_LABEL}</p>
        <p className="text-[11px] leading-relaxed text-slate-200">
          {getOperationalRecommendationShort(alert.risk_level)}
        </p>
      </div>

      <p className="mb-2.5 border-t border-navy-700 pt-2 font-mono text-[10px] uppercase tracking-wide text-slate-600">
        [simulado] não é alerta oficial da Defesa Civil
      </p>

      <div className="flex flex-wrap gap-3">
        <Link
          to={`/alertas/${alert.id}`}
          className="text-[11px] font-semibold text-accent underline-offset-2 hover:underline"
        >
          Ver detalhes →
        </Link>
        {alert.suggested_next_step && (
          <Link
            to={alert.suggested_next_step}
            className="text-[11px] font-semibold text-accent underline-offset-2 hover:underline"
          >
            Testar em Telemetria →
          </Link>
        )}
      </div>
    </div>
  );
}
