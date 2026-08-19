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

function LegendGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="data-label mb-2">{title}</p>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

export function MapLegend() {
  return (
    <div className="panel-glass absolute bottom-6 left-6 z-[1000] w-[228px] animate-rise-in p-4">
      <div className="flex flex-col gap-4">
        <LegendGroup title="Suscetibilidade HAND">
          {/* Escala contínua em vez de 4 quadradinhos soltos: HAND é um
              gradiente de suscetibilidade, e a barra comunica isso melhor. */}
          <div>
            <div className="flex h-2 overflow-hidden rounded-full ring-1 ring-inset ring-navy-700">
              {HAND_CLASSES.map((item) => (
                <span key={item.label} className="flex-1" style={{ background: item.hex }} />
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
              <span>Muito baixa</span>
              <span>Alta</span>
            </div>
          </div>
        </LegendGroup>

        <LegendGroup title="Camadas">
          <span className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="h-0.5 w-4 shrink-0 rounded-full bg-accent" />
            Limite de Blumenau/SC
          </span>
          <span className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="h-2 w-2 shrink-0 rotate-45 bg-accent" />
            Abrigos simulados
          </span>
        </LegendGroup>

        <LegendGroup title="Alertas simulados">
          <span className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-400" />
            Evento de demonstração
          </span>
          <span className="flex items-center gap-2 text-[11px] text-slate-300">
            <span className="relative h-2.5 w-2.5 shrink-0">
              <span className="absolute inset-[-3px] animate-ping rounded-full bg-risk-critical/40" />
              <span className="relative block h-2.5 w-2.5 rounded-full bg-risk-critical" />
            </span>
            Crítico (destaque pulsante)
          </span>
        </LegendGroup>
      </div>
    </div>
  );
}
