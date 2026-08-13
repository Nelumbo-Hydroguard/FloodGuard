export function DemoNotice({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 border border-accent-muted/40 bg-accent/5 rounded px-3 py-2 text-xs text-slate-300">
      <span className="font-mono text-accent shrink-0">[DEMO]</span>
      <span>
        {children ?? (
          <>
            Prova de conceito — todos os dados desta tela são simulados
            (<code className="text-slate-400">source: "simulation"</code>). Não há
            sensores físicos, LoRaWAN, Meshtastic ou MQTT reais em operação.
          </>
        )}
      </span>
    </div>
  );
}
