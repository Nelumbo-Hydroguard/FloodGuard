import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { MetricCard } from "../components/MetricCard";
import { SectionCard } from "../components/SectionCard";
import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { SOSQueue } from "../components/SOSQueue";
import { ShelterDetail } from "../components/ShelterDetail";
import { SessionNote } from "../components/DemoBadge";
import { OCCUPANCY_STYLE } from "../lib/operations";
import { useOperationalShelters, type OperationalShelter } from "../lib/shelters";
import { SESSION_NOTICE, useOperations } from "../state/OperationsProvider";

/**
 * `/operacao` — central de atendimento.
 *
 * Chama-se "Operação" e não "Admin" de propósito: não existe autenticação
 * nesta plataforma, e um rótulo de administração sugeriria um controle de
 * acesso que não está implementado. Ver /acesso.
 *
 * Duas abas porque são dois trabalhos diferentes na mesma mesa: triar
 * pedidos (fila SOS) e manter os locais seguros atualizados. Tudo que muda
 * aqui vive na sessão — ver OperationsProvider.
 */

type Tab = "pedidos" | "locais";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "pedidos", label: "Pedidos SOS" },
  { key: "locais", label: "Locais seguros" },
];

/** Passo de ajuste da ocupação simulada — grupo típico, não pessoa a pessoa. */
const OCCUPANCY_STEP = 5;

function ShelterRow({
  shelter,
  onOpen,
  onToggleAvailability,
  onAdjust,
}: {
  shelter: OperationalShelter;
  onOpen: (shelter: OperationalShelter) => void;
  onToggleAvailability: (shelter: OperationalShelter) => void;
  onAdjust: (shelter: OperationalShelter, delta: number) => void;
}) {
  const style =
    shelter.level === "indisponivel"
      ? { label: "Indisponível", badgeClass: "border-slate-500/40 bg-slate-500/10 text-slate-400", barClass: "bg-slate-600" }
      : OCCUPANCY_STYLE[shelter.level];

  return (
    <div className="flex flex-col gap-4 border-b border-navy-800/70 py-4 last:border-b-0 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-sm font-semibold text-white">{shelter.name}</h3>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${style.badgeClass}`}
          >
            {style.label}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">{shelter.region}</p>
        <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-navy-800">
          <div
            className={`h-full rounded-full ${style.barClass}`}
            style={{ width: `${Math.min(100, shelter.percent)}%` }}
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-5">
        <div>
          <p className="data-label">Ocupação</p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-200">
            {shelter.currentUsed}
            <span className="text-slate-600">/{shelter.capacity_total}</span>
          </p>
        </div>
        <div>
          <p className="data-label">Vagas</p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-200">{shelter.free}</p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAdjust(shelter, -OCCUPANCY_STEP)}
            aria-label={`Reduzir ocupação de ${shelter.name}`}
            className="h-8 w-8 rounded-lg border border-navy-600 text-sm text-slate-300 transition-colors hover:border-accent hover:text-accent"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => onAdjust(shelter, OCCUPANCY_STEP)}
            aria-label={`Aumentar ocupação de ${shelter.name}`}
            className="h-8 w-8 rounded-lg border border-navy-600 text-sm text-slate-300 transition-colors hover:border-accent hover:text-accent"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={() => onToggleAvailability(shelter)}
          className="rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-accent hover:text-accent"
        >
          {shelter.unavailable ? "Reativar" : "Marcar indisponível"}
        </button>
        <button
          type="button"
          onClick={() => onOpen(shelter)}
          className="rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-accent hover:text-accent"
        >
          Detalhes
        </button>
      </div>
    </div>
  );
}

export function Operacao() {
  const { sosRequests, advanceSosStatus, setShelterOverride, resetDemoState, dirty } = useOperations();
  const { shelters, loading, error, totals } = useOperationalShelters();
  const [tab, setTab] = useState<Tab>("pedidos");
  const [selected, setSelected] = useState<OperationalShelter | null>(null);

  const waiting = sosRequests.filter((r) => r.status === "aguardando").length;
  const inProgress = sosRequests.filter((r) => r.status === "em_atendimento").length;
  const resolved = sosRequests.filter((r) => r.status === "resolvido").length;

  function toggleAvailability(shelter: OperationalShelter) {
    setShelterOverride(shelter.id, { unavailable: !shelter.unavailable });
  }

  function adjustOccupancy(shelter: OperationalShelter, delta: number) {
    const next = Math.max(0, Math.min(shelter.capacity_total, shelter.currentUsed + delta));
    setShelterOverride(shelter.id, { capacityUsed: next });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Central de atendimento"
        title="Operação"
        description="Triagem de pedidos SOS e situação dos locais seguros."
        actions={
          dirty && (
            <button
              type="button"
              onClick={resetDemoState}
              className="rounded-lg border border-navy-600 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-accent hover:text-accent"
            >
              Reiniciar demo
            </button>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Aguardando"
          value={String(waiting)}
          accentClass={waiting > 0 ? "text-risk-critical" : "text-risk-safe"}
          hint="pedidos sem atendimento"
        />
        <MetricCard label="Em atendimento" value={String(inProgress)} accentClass="text-risk-attention" hint="equipes acionadas" />
        <MetricCard label="Resolvidos" value={String(resolved)} accentClass="text-risk-safe" hint="nesta sessão" />
        <MetricCard
          label="Vagas em abrigo"
          value={String(totals.free)}
          accentClass={totals.free > 0 ? "text-risk-safe" : "text-risk-critical"}
          hint={`${totals.available} abrigos recebendo`}
        />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-navy-700/70 pb-3">
        {TABS.map((option) => {
          const active = tab === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setTab(option.key)}
              aria-current={active ? "true" : undefined}
              className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                active ? "text-white" : "text-slate-400 hover:text-slate-100"
              }`}
            >
              {option.label}
              <span
                className={`absolute inset-x-2 -bottom-[13px] h-0.5 rounded-full transition-all ${
                  active ? "bg-accent shadow-[0_0_12px_var(--glow-accent)]" : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
        <SessionNote>{SESSION_NOTICE}</SessionNote>
      </div>

      {tab === "pedidos" && <SOSQueue requests={sosRequests} onAdvance={advanceSosStatus} />}

      {tab === "locais" && (
        <>
          {error && <ErrorState message={error} />}
          {loading && <EmptyState loading title="Carregando locais seguros…" />}
          {shelters.length > 0 && (
            <SectionCard title="Locais seguros" subtitle="Ajuste status e ocupação durante a operação.">
              <div className="flex flex-col">
                {shelters.map((shelter) => (
                  <ShelterRow
                    key={shelter.id}
                    shelter={shelter}
                    onOpen={setSelected}
                    onToggleAvailability={toggleAvailability}
                    onAdjust={adjustOccupancy}
                  />
                ))}
              </div>
            </SectionCard>
          )}
        </>
      )}

      <ShelterDetail shelter={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
