export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border border-dashed border-navy-600 rounded p-6 text-center">
      <p className="text-sm font-semibold text-slate-300">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{description}</p>}
    </div>
  );
}
