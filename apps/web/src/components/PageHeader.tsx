import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** Contexto curto acima do título (ex.: "Blumenau/SC"). */
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-navy-700/70 pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="data-label mb-2 text-accent/80">{eyebrow}</p>}
        <h1 className="text-[26px] font-bold leading-tight text-white">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
