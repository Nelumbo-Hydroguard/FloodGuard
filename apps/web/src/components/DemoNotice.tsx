/**
 * Aviso de conteúdo simulado. Presença obrigatória nas telas que exibem
 * dados do motor — é o compromisso de honestidade da PoC (docs/limitacoes.md),
 * não decoração. O redesign da F10 deixou o aviso MAIS legível, nunca menos.
 */
export function DemoNotice({ children }: { children?: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-accent/25 bg-accent/[0.06] px-4 py-3">
      <span className="absolute inset-y-0 left-0 w-[3px] bg-accent/70" />
      <div className="flex items-start gap-3">
        <span className="mt-px shrink-0 rounded border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
          demo
        </span>
        <p className="text-xs leading-relaxed text-slate-300">
          {children ?? (
            <>
              Prova de conceito — todos os dados desta tela são simulados
              (<code className="text-slate-400">source: "simulation"</code>). Não há
              sensores físicos, LoRaWAN, Meshtastic ou MQTT reais em operação.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
