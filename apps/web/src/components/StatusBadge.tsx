import type { RiskLevel } from "../lib/api";

const STYLES: Record<RiskLevel, string> = {
  seguro: "bg-emerald-950 text-emerald-400 border-emerald-800",
  atencao: "bg-yellow-950 text-yellow-400 border-yellow-800",
  alerta: "bg-orange-950 text-orange-400 border-orange-800",
  critico: "bg-red-950 text-red-400 border-red-800",
};

const LABELS: Record<RiskLevel, string> = {
  seguro: "Seguro",
  atencao: "Atenção",
  alerta: "Alerta",
  critico: "Crítico",
};

export function StatusBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${STYLES[level]}`}>
      {LABELS[level]}
    </span>
  );
}
