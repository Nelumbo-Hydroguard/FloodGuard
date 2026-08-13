import { Link } from "react-router-dom";
import type { DemoAlert } from "../lib/api";
import { RISK_THEME } from "../lib/riskTheme";

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
 */
export function AlertMapPopup({ alert }: { alert: DemoAlert }) {
  const theme = RISK_THEME[alert.risk_level];

  return (
    <div className="min-w-[220px] max-w-[260px] text-navy-950">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: theme.hex }} />
        <strong className="text-sm">{alert.title}</strong>
      </div>
      <p className="text-[11px] text-slate-600 mb-1.5">
        Região: {alert.region ?? "não informada"} · {STATUS_LABEL[alert.status] ?? alert.status}
      </p>
      <p className="text-[11px] mb-1.5">
        <span className="font-mono">score {Math.round(alert.risk_score * 100)}%</span>{" "}
        <span className="font-mono">· confiança {Math.round(alert.confidence * 100)}%</span>
      </p>
      <p className="text-xs text-slate-700 mb-1.5">{alert.explanation}</p>
      <p className="text-xs mb-2">
        <span className="text-slate-600">Ação recomendada: </span>
        <span className="font-medium">{alert.recommended_action}</span>
      </p>
      <p className="text-[10px] font-mono uppercase text-slate-500 border-t border-slate-300 pt-1.5 mb-1.5">
        [simulado] evento de demonstração — não é alerta oficial da Defesa Civil
      </p>
      <div className="flex flex-wrap gap-2">
        <Link to={`/alertas/${alert.id}`} className="text-xs font-semibold text-accent-muted hover:underline underline-offset-2">
          Ver detalhes →
        </Link>
        {alert.suggested_next_step && (
          <Link to={alert.suggested_next_step} className="text-xs font-semibold text-accent-muted hover:underline underline-offset-2">
            Testar em Telemetria →
          </Link>
        )}
      </div>
    </div>
  );
}
