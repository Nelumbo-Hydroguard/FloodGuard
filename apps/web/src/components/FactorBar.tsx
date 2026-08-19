import type { RiskLevel } from "../lib/api";
import { RISK_THEME } from "../lib/riskTheme";

/**
 * Medidor de um fator do motor de risco.
 *
 * Este é o componente-assinatura do FloodGuard: o diferencial do produto não
 * é mostrar um score, é mostrar DE ONDE ele vem (HAND, chuva, nível d'água,
 * tendência). Até a F9 essa informação — a mais valiosa da tela — era uma
 * barrinha cinza de 1,5px, o elemento mais apagado da interface. Agora o
 * medidor traz a escala inteira: as marcas de limiar deixam ver em que faixa
 * o fator caiu, não só que "encheu um pouco".
 */

// Mesmos limiares de app/engine/risk_rules.py::RISK_THRESHOLDS (0.25/0.50/0.75).
// Só colorem/segmentam a barra de UM fator — a classificação do risco final é
// sempre do backend, nunca daqui.
const THRESHOLDS = [0.25, 0.5, 0.75];

function levelFor(value: number): RiskLevel {
  if (value < THRESHOLDS[0]) return "seguro";
  if (value < THRESHOLDS[1]) return "atencao";
  if (value < THRESHOLDS[2]) return "alerta";
  return "critico";
}

export function FactorBar({
  label,
  value,
  /** Nota curta à direita do rótulo (ex.: unidade ou origem do dado). */
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  const clamped = Math.min(1, Math.max(0, value));
  const percent = Math.round(clamped * 100);
  const theme = RISK_THEME[levelFor(clamped)];

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-slate-300">
          {label}
          {hint && <span className="ml-1.5 text-[10px] font-normal text-slate-600">{hint}</span>}
        </span>
        <span className={`font-mono text-xs font-semibold ${theme.textClass}`}>{percent}%</span>
      </div>

      <div className="relative h-2 w-full overflow-hidden rounded-full bg-navy-800 ring-1 ring-inset ring-navy-700/80">
        {/* Marcas de limiar do motor — deixam ler a faixa, não só o tamanho. */}
        {THRESHOLDS.map((t) => (
          <span
            key={t}
            className="absolute inset-y-0 z-10 w-px bg-navy-950/70"
            style={{ left: `${t * 100}%` }}
            aria-hidden="true"
          />
        ))}
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${theme.barClass}`}
          style={{ width: `${percent}%`, boxShadow: `0 0 10px var(${theme.glowVar})` }}
        />
      </div>
    </div>
  );
}
