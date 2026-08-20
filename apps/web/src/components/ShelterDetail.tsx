import type { OperationalShelter } from "../lib/shelters";
import { OCCUPANCY_STYLE, formatRelative, routeUrl, telHref } from "../lib/operations";
import { Drawer } from "./Drawer";
import { DemoBadge } from "./DemoBadge";

/**
 * Detalhe do abrigo em drawer.
 *
 * O botão "Ligar" existe, mas o telefone é fictício (faixa 5550) e vem com
 * selo ao lado: o gesto do produto fica demonstrado sem que alguém disce
 * para um número de terceiros por engano.
 */

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-navy-800/70 py-2.5 last:border-b-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-right text-xs text-slate-200">{value}</dd>
    </div>
  );
}

export function ShelterDetail({
  shelter,
  onClose,
}: {
  shelter: OperationalShelter | null;
  onClose: () => void;
}) {
  if (!shelter) return null;

  const style =
    shelter.level === "indisponivel"
      ? { label: "Indisponível", badgeClass: "border-slate-500/40 bg-slate-500/10 text-slate-400", barClass: "bg-slate-600" }
      : OCCUPANCY_STYLE[shelter.level];

  return (
    <Drawer open eyebrow="Local seguro" title={shelter.name} onClose={onClose}
      footer={
        <div className="flex flex-wrap gap-2">
          <a
            href={routeUrl(shelter.latitude, shelter.longitude)}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-navy-950 transition-colors hover:bg-accent/90"
          >
            Traçar rota →
          </a>
          {shelter.contact && (
            <a
              href={telHref(shelter.contact.phone)}
              className="rounded-lg border border-navy-600 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-accent hover:text-accent"
            >
              Ligar
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs text-slate-400 transition-colors hover:text-white"
          >
            Fechar
          </button>
        </div>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${style.badgeClass}`}
        >
          {style.label}
        </span>
        <DemoBadge />
        {shelter.overridden && <DemoBadge label="ajustado na sessão" />}
      </div>

      <div className="mb-5 flex items-end gap-6">
        <div>
          <p className="data-label">Vagas</p>
          <p className="mt-1 font-mono text-[40px] font-semibold leading-none text-white">
            {shelter.free}
          </p>
        </div>
        <div className="pb-1.5">
          <p className="data-label">Ocupação</p>
          <p className="mt-1 font-mono text-lg font-semibold leading-none text-slate-300">
            {shelter.currentUsed}/{shelter.capacity_total}
          </p>
        </div>
        <div className="pb-1.5">
          <p className="data-label">Percentual</p>
          <p className="mt-1 font-mono text-lg font-semibold leading-none text-slate-300">
            {Math.round(shelter.percent)}%
          </p>
        </div>
      </div>

      <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-navy-800 ring-1 ring-inset ring-navy-700/80">
        <div
          className={`h-full rounded-full ${style.barClass}`}
          style={{ width: `${Math.min(100, shelter.percent)}%` }}
        />
      </div>

      <dl>
        <Row label="Região" value={shelter.region} />
        <Row label="Endereço" value={shelter.address} />
        {shelter.contact && (
          <Row
            label="Telefone"
            value={
              <span className="inline-flex items-center gap-2">
                <span className="font-mono">{shelter.contact.phone}</span>
                <DemoBadge label="fictício" />
              </span>
            }
          />
        )}
        <Row label="Capacidade total" value={`${shelter.capacity_total} pessoas`} />
        {shelter.contact && <Row label="Acessibilidade" value={shelter.contact.accessibility} />}
        <Row
          label="Coordenadas"
          value={
            <span className="font-mono">
              {shelter.latitude.toFixed(4)}, {shelter.longitude.toFixed(4)}
            </span>
          }
        />
        {shelter.updatedAtIso && (
          <Row label="Última atualização" value={formatRelative(shelter.updatedAtIso)} />
        )}
      </dl>

      {shelter.contact && (
        <div className="mt-4 rounded-lg border border-navy-700/70 bg-navy-950/60 p-3">
          <p className="data-label mb-1.5">Observação operacional</p>
          <p className="text-sm leading-relaxed text-slate-300">{shelter.contact.operationalNote}</p>
        </div>
      )}
    </Drawer>
  );
}
