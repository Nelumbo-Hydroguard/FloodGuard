export function MetricCard({
  label,
  value,
  hint,
  accentClass = "text-white",
}: {
  label: string;
  value: string;
  hint?: string;
  accentClass?: string;
}) {
  return (
    <div className="border border-navy-700 bg-navy-900 rounded p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`text-2xl font-bold font-mono tabular-nums mt-1 ${accentClass}`}>{value}</p>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}
