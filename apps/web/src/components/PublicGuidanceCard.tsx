import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { RiskLevel } from "../lib/api";
import { RISK_THEME } from "../lib/riskTheme";
import {
  PUBLIC_GUIDANCE_DISCLAIMER,
  PUBLIC_GUIDANCE_LABEL,
  getPublicGuidance,
  getPublicHeadline,
  getPublicLevelLabel,
  isRiskLevel,
} from "../lib/alertMessaging";
import { DemoBadge } from "./DemoBadge";

/**
 * Prévia da mensagem que o CIDADÃO receberia — o outro lado do mesmo evento.
 *
 * Por que isto vive numa tela de operador: o operador precisa ver o que
 * seria comunicado à população ANTES de comunicar. É a peça que faltava
 * para a separação dos dois públicos ficar visível em vez de teórica. Não
 * é um portal cidadão; é a prévia dele.
 *
 * O QUE NÃO ENTRA AQUI, e é o ponto do componente: score, confiança, HAND,
 * pesos, fórmula, payload. Nada de número técnico. Cidadão precisa de
 * nível, lugar, hora, o que está acontecendo, o que fazer e para onde ir —
 * nesta ordem.
 *
 * Conteúdo DEMONSTRATIVO do protótipo. Não é alerta oficial da Defesa Civil
 * e não pode ser apresentado como tal.
 */
export function PublicGuidanceCard({
  level,
  region,
  timestamp,
  actions,
}: {
  level: RiskLevel | string;
  region: string | null;
  timestamp: string;
  /**
   * Substitui o CTA padrão ("Ver local seguro"). Usado na lista de alertas
   * do cidadão, onde cada evento precisa também de "Ver no mapa" apontando
   * para o próprio id — o card em si não conhece o alerta, só a mensagem.
   */
  actions?: ReactNode;
}) {
  const theme = isRiskLevel(level) ? RISK_THEME[level] : null;

  return (
    <section className="panel relative overflow-hidden p-5">
      <span
        className={`absolute inset-y-0 left-0 w-[3px] ${theme?.barClass ?? "bg-slate-600"}`}
        style={theme ? { boxShadow: `0 0 16px var(${theme.glowVar})` } : undefined}
      />

      <div className="pl-2">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h2 className="data-label">{PUBLIC_GUIDANCE_LABEL}</h2>
          <DemoBadge label="demonstrativo" />
        </div>

        {/* NÍVEL · REGIÃO · HORÁRIO */}
        <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={`font-display text-xl font-semibold ${theme?.textClass ?? "text-slate-300"}`}>
            {getPublicLevelLabel(level)}
          </span>
          <span className="text-sm text-slate-300">{region ?? "Região não informada"}</span>
          <span className="text-xs text-slate-500">{new Date(timestamp).toLocaleString("pt-BR")}</span>
        </div>

        <div className="mb-4">
          <p className="data-label mb-1.5">O que está acontecendo</p>
          <p className="text-sm leading-relaxed text-slate-200">{getPublicHeadline(level)}</p>
        </div>

        <div className="mb-4">
          <p className="data-label mb-1.5">O que fazer</p>
          <p className="text-sm leading-relaxed text-slate-200">{getPublicGuidance(level)}</p>
        </div>

        <div className="flex flex-col gap-3 border-t border-navy-700/70 pt-4">
          <div className="flex flex-wrap gap-2">
            {actions ?? (
              <Link
                to="/abrigos"
                className="inline-flex items-center rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
              >
                Ver local seguro →
              </Link>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600">{PUBLIC_GUIDANCE_DISCLAIMER}</p>
        </div>
      </div>
    </section>
  );
}
