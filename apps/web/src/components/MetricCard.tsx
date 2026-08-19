export function MetricCard({
  label,
  value,
  hint,
  accentClass = "text-white",
  /**
   * "numeric" usa mono tabular (score, contagem, %); "text" usa a display.
   * Palavra em monoespaçada — "Crítico", "Simulada" — lia como saída de
   * terminal, não como indicador de painel.
   */
  variant = "numeric",
}: {
  label: string;
  value: string;
  hint?: string;
  accentClass?: string;
  variant?: "numeric" | "text";
}) {
  return (
    <div className="panel panel-interactive overflow-hidden p-4">
      {/* Filete vertical à esquerda: ancora a leitura da coluna de KPIs e
          separa visualmente um card do outro sem precisar de mais borda. */}
      <span className="absolute inset-y-4 left-0 w-px bg-gradient-to-b from-transparent via-accent/40 to-transparent" />
      <p className="data-label">{label}</p>
      <p
        className={`mt-2 text-[28px] font-semibold leading-none ${
          variant === "numeric" ? "font-mono" : "font-display"
        } ${accentClass}`}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-xs leading-snug text-slate-500">{hint}</p>}
    </div>
  );
}
