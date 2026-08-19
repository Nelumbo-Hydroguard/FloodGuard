import type { RiskLevel } from "../lib/api";
import { RISK_THEME } from "../lib/riskTheme";

export function StatusBadge({ level }: { level: RiskLevel }) {
  const theme = RISK_THEME[level];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${theme.badgeClass}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${theme.dotClass}`}
        style={{ boxShadow: `0 0 8px var(${theme.glowVar})` }}
      />
      {theme.label}
    </span>
  );
}
