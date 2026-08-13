export function ErrorState({ message }: { message: string }) {
  return (
    <div className="border border-risk-critical/40 bg-risk-critical/5 rounded p-4">
      <p className="text-sm font-semibold text-risk-critical">Falha ao carregar dados</p>
      <p className="text-xs text-slate-400 mt-1">{message}</p>
    </div>
  );
}
