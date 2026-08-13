import { RISK_THEME } from "../lib/riskTheme";

// Mesmos limiares de app/engine/risk_rules.py::RISK_THRESHOLDS (0.25/0.50/0.75)
// — usado só para colorir a barra de um fator individual, não para
// classificar risco (isso é sempre o backend quem faz).
function colorClassFor(value: number): string {
  if (value < 0.25) return RISK_THEME.seguro.barClass;
  if (value < 0.5) return RISK_THEME.atencao.barClass;
  if (value < 0.75) return RISK_THEME.alerta.barClass;
  return RISK_THEME.critico.barClass;
}

export function FactorBar({ label, value }: { label: string; value: number }) {
  const clamped = Math.min(1, Math.max(0, value));
  const percent = Math.round(clamped * 100);

  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-0.5">
        <span>{label}</span>
        <span className="font-mono tabular-nums">{percent}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-navy-700">
        <div className={`h-1.5 rounded-full ${colorClassFor(clamped)}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
