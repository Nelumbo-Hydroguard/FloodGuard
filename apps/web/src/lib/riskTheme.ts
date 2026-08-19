/**
 * Fonte única da paleta/labels de risco — StatusBadge, FactorBar,
 * RiskLegend e MapLegend consomem daqui, não redefinem cor cada um por si.
 * Os 4 níveis espelham exatamente app.schemas.common.RiskLevel no backend
 * (seguro/atencao/alerta/critico) — não inventar um 5º nível aqui.
 */

import type { RiskLevel } from "./api";

export interface RiskTheme {
  label: string;
  hex: string;
  badgeClass: string;
  dotClass: string;
  textClass: string;
  barClass: string;
  /** Nome da custom property de halo definida em index.css (:root). */
  glowVar: string;
}

export const RISK_THEME: Record<RiskLevel, RiskTheme> = {
  seguro: {
    label: "Seguro",
    hex: "#22c55e",
    badgeClass: "bg-risk-safe/10 text-risk-safe border-risk-safe/40",
    dotClass: "bg-risk-safe",
    textClass: "text-risk-safe",
    barClass: "bg-risk-safe",
    glowVar: "--glow-safe",
  },
  atencao: {
    label: "Atenção",
    hex: "#eab308",
    badgeClass: "bg-risk-attention/10 text-risk-attention border-risk-attention/40",
    dotClass: "bg-risk-attention",
    textClass: "text-risk-attention",
    barClass: "bg-risk-attention",
    glowVar: "--glow-attention",
  },
  alerta: {
    label: "Alerta",
    hex: "#f97316",
    badgeClass: "bg-risk-alert/10 text-risk-alert border-risk-alert/40",
    dotClass: "bg-risk-alert",
    textClass: "text-risk-alert",
    barClass: "bg-risk-alert",
    glowVar: "--glow-alert",
  },
  critico: {
    label: "Crítico",
    hex: "#ef4444",
    badgeClass: "bg-risk-critical/10 text-risk-critical border-risk-critical/40",
    dotClass: "bg-risk-critical",
    textClass: "text-risk-critical",
    barClass: "bg-risk-critical",
    glowVar: "--glow-critical",
  },
};

export const RISK_LEVELS_ORDERED: RiskLevel[] = ["seguro", "atencao", "alerta", "critico"];

export function riskWeight(level: RiskLevel): number {
  return RISK_LEVELS_ORDERED.indexOf(level);
}
