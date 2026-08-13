import { RISK_THEME } from "../lib/riskTheme";

/**
 * Legenda sobreposta ao mapa.
 *
 * Os rótulos de suscetibilidade usam o vocabulário do HAND (muito baixa →
 * alta), não os nomes dos níveis de risco. As cores são as mesmas do
 * RISK_THEME de propósito — consistência visual com o resto do produto —
 * mas chamar uma zona HAND de "Crítico" sugeria risco em tempo real, o que
 * contradiz o próprio texto da página (HAND é suscetibilidade estática).
 * Correção da auditoria F6.2.
 */
const HAND_CLASSES = [
  { label: "Muito baixa", hex: RISK_THEME.seguro.hex },
  { label: "Baixa", hex: RISK_THEME.atencao.hex },
  { label: "Média", hex: RISK_THEME.alerta.hex },
  { label: "Alta", hex: RISK_THEME.critico.hex },
];

export function MapLegend() {
  return (
    <div className="absolute bottom-3 left-3 z-[1000] bg-navy-900/95 border border-navy-700 rounded p-3 text-xs text-slate-300 max-w-[240px] shadow-lg">
      <p className="font-semibold uppercase tracking-wider text-slate-500 text-[10px] mb-2">
        Suscetibilidade HAND
      </p>
      <div className="flex flex-col gap-1 mb-3">
        {HAND_CLASSES.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: item.hex }} />
            {item.label}
          </span>
        ))}
      </div>

      <p className="font-semibold uppercase tracking-wider text-slate-500 text-[10px] mb-1">
        Limite municipal
      </p>
      <span className="flex items-center gap-1.5 mb-3">
        <span className="h-0.5 w-4 shrink-0" style={{ background: "#22d3ee" }} />
        Blumenau/SC
      </span>

      <p className="font-semibold uppercase tracking-wider text-slate-500 text-[10px] mb-1">
        Marcadores
      </p>
      <span className="flex items-center gap-1.5 mb-1">
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: "#94a3b8" }} />
        Cenários simulados (seguro/alerta/crítico)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0" style={{ background: "#22d3ee", transform: "rotate(45deg)" }} />
        Abrigos simulados
      </span>
    </div>
  );
}
