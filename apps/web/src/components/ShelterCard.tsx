import type { OperationalShelter } from "../lib/shelters";
import { OCCUPANCY_STYLE, routeUrl } from "../lib/operations";
import { DemoBadge } from "./DemoBadge";

/**
 * Card de abrigo na lista operacional.
 *
 * Hierarquia deliberada: VAGAS primeiro. Na hora de encaminhar uma família,
 * a pergunta é "cabe?", não "qual o percentual de ocupação?". O percentual
 * entra como contexto, e a barra dá a leitura instantânea da lotação.
 */
export function ShelterCard({
  shelter,
  onOpen,
}: {
  shelter: OperationalShelter;
  onOpen: (shelter: OperationalShelter) => void;
}) {
  const style =
    shelter.level === "indisponivel"
      ? {
          label: "Indisponível",
          badgeClass: "border-slate-500/40 bg-slate-500/10 text-slate-400",
          barClass: "bg-slate-600",
          textClass: "text-slate-400",
        }
      : OCCUPANCY_STYLE[shelter.level];

  return (
    <article className="panel panel-interactive flex flex-col p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold leading-snug text-white">
            {shelter.name}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{shelter.region}</p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{shelter.address}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${style.badgeClass}`}
        >
          {style.label}
        </span>
      </div>

      <div className="mb-4 flex items-end gap-5">
        <div>
          <p className="data-label">Vagas</p>
          <p className={`mt-1 font-mono text-[32px] font-semibold leading-none ${style.textClass}`}>
            {shelter.free}
          </p>
        </div>
        <div className="pb-1">
          <p className="data-label">Ocupação</p>
          <p className="mt-1 font-mono text-base font-semibold leading-none text-slate-300">
            {shelter.currentUsed}
            <span className="text-slate-600">/{shelter.capacity_total}</span>
          </p>
        </div>
        <div className="pb-1">
          <p className="data-label">Percentual</p>
          <p className="mt-1 font-mono text-base font-semibold leading-none text-slate-300">
            {Math.round(shelter.percent)}%
          </p>
        </div>
      </div>

      <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-navy-800 ring-1 ring-inset ring-navy-700/80">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${style.barClass}`}
          style={{ width: `${Math.min(100, shelter.percent)}%` }}
        />
      </div>

      {shelter.contact && (
        <p className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="font-mono">{shelter.contact.phone}</span>
          <DemoBadge label="fictício" />
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 border-t border-navy-700/70 pt-4">
        <button
          type="button"
          onClick={() => onOpen(shelter)}
          className="rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-accent hover:text-accent"
        >
          Ver detalhes
        </button>
        <a
          href={routeUrl(shelter.latitude, shelter.longitude)}
          target="_blank"
          rel="noreferrer noopener"
          className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
        >
          Traçar rota →
        </a>
      </div>
    </article>
  );
}
