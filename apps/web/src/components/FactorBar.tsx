export function FactorBar({ label, value }: { label: string; value: number }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-0.5">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800">
        <div className="h-1.5 rounded-full bg-slate-400" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
