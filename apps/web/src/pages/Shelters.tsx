import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { MetricCard } from "../components/MetricCard";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { ShelterCard } from "../components/ShelterCard";
import { ShelterDetail } from "../components/ShelterDetail";
import { ShelterMap } from "../components/ShelterMap";
import { useOperationalShelters, type OperationalShelter } from "../lib/shelters";

/**
 * `/abrigos` — para onde encaminhar quem precisa sair de casa.
 *
 * Layout mapa | lista: o operador precisa da resposta espacial ("qual o mais
 * perto do evento") e da numérica ("onde ainda cabe") ao mesmo tempo. Dados
 * de capacidade vêm de `/api/shelters/demo`; telefone, acessibilidade e
 * observação são fixtures locais (a API ainda não expõe esses campos).
 */
export function Shelters() {
  const { shelters, loading, error, totals } = useOperationalShelters();
  const [selected, setSelected] = useState<OperationalShelter | null>(null);

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Capacidade de acolhimento" title="Abrigos" />
        <ErrorState message={error} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Capacidade de acolhimento"
        title="Abrigos"
        description="Vagas disponíveis para encaminhamento. Dados simulados."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Abrigos disponíveis"
          value={String(totals.available)}
          accentClass={totals.available > 0 ? "text-risk-safe" : "text-risk-critical"}
          hint={`de ${shelters.length} cadastrados`}
        />
        <MetricCard label="Capacidade total" value={String(totals.capacity)} hint="pessoas" />
        <MetricCard label="Pessoas abrigadas" value={String(totals.occupied)} hint="ocupação atual" />
        <MetricCard
          label="Vagas disponíveis"
          value={String(totals.free)}
          accentClass={totals.free > 0 ? "text-risk-safe" : "text-risk-critical"}
          hint="exclui indisponíveis"
        />
      </div>

      {loading && <EmptyState loading title="Carregando abrigos…" />}

      {shelters.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,5fr)_minmax(0,4fr)]">
          <div className="lg:sticky lg:top-[4.5rem] lg:self-start">
            <ShelterMap shelters={shelters} onSelect={setSelected} className="h-[300px] lg:h-[560px]" />
          </div>

          <div className="flex flex-col gap-4">
            {shelters.map((shelter) => (
              <ShelterCard key={shelter.id} shelter={shelter} onOpen={setSelected} />
            ))}
          </div>
        </div>
      )}

      <ShelterDetail shelter={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
