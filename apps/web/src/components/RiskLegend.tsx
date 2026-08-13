import { RISK_LEVELS_ORDERED, RISK_THEME } from "../lib/riskTheme";

export function RiskLegend({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 text-xs text-slate-400 ${className}`}>
      {RISK_LEVELS_ORDERED.map((level) => (
        <span key={level} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${RISK_THEME[level].dotClass}`} />
          {RISK_THEME[level].label}
        </span>
      ))}
    </div>
  );
}
