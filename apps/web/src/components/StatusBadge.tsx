import type { RiskLevel } from "../lib/api";
import { RISK_THEME } from "../lib/riskTheme";

export function StatusBadge({ level }: { level: RiskLevel }) {
  const theme = RISK_THEME[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${theme.badgeClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${theme.dotClass}`} />
      {theme.label}
    </span>
  );
}
