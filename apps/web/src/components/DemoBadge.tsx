/**
 * Selo discreto de conteúdo simulado.
 *
 * Substitui, dentro das telas de operação, o parágrafo explicativo que a
 * F10.1 removeu: o operador precisa saber que o dado é simulado, não ler um
 * aviso de três linhas. A explicação completa vive em /sobre.
 */
export function DemoBadge({
  label = "simulado",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded border border-navy-600 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500 ${className}`}
    >
      {label}
    </span>
  );
}

/** Nota de sessão — usada onde o operador altera estado que não persiste. */
export function SessionNote({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] leading-relaxed text-slate-600">{children}</p>;
}
