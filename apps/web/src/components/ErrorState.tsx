export function ErrorState({ message }: { message: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-risk-critical/35 bg-risk-critical/[0.07] p-5 shadow-panel">
      <span className="absolute inset-y-0 left-0 w-[3px] bg-risk-critical" />
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-risk-critical/50 text-[11px] font-bold text-risk-critical">
          !
        </span>
        <div>
          <p className="text-sm font-semibold text-risk-critical">Falha ao carregar dados</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{message}</p>
        </div>
      </div>
    </div>
  );
}
