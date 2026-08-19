export function EmptyState({
  title,
  description,
  /** Mostra barras de esqueleto — use quando o estado for carregamento. */
  loading = false,
}: {
  title: string;
  description?: string;
  loading?: boolean;
}) {
  return (
    <div className="panel p-8 text-center">
      {loading && (
        <div className="mx-auto mb-5 flex max-w-xs flex-col gap-2" aria-hidden="true">
          <span className="h-2 w-full animate-breathe rounded-full bg-navy-700" />
          <span className="h-2 w-4/5 animate-breathe rounded-full bg-navy-700 [animation-delay:200ms]" />
          <span className="h-2 w-3/5 animate-breathe rounded-full bg-navy-700 [animation-delay:400ms]" />
        </div>
      )}
      <p className="text-sm font-semibold text-slate-200">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">{description}</p>
      )}
    </div>
  );
}
