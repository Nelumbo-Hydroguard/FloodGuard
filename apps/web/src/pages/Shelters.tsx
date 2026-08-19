import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchDemoShelters, type DemoShelter } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { DemoNotice } from "../components/DemoNotice";
import { MetricCard } from "../components/MetricCard";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";

/**
 * `/abrigos` — F7: consome `/api/shelters/demo` (lista fixa em memória no
 * backend, sem persistência — ver app/routers/shelters.py). Antes da F7
 * esta tela usava dados fixos no próprio frontend; agora o frontend só
 * exibe o que a API manda, mesmo que a API também seja "só" uma simulação.
 */

const STATUS_STYLE: Record<string, { label: string; className: string; barClass: string }> = {
  disponivel: { label: "Disponível", className: "bg-risk-safe/10 text-risk-safe border-risk-safe/40", barClass: "bg-risk-safe" },
  moderado: { label: "Ocupação moderada", className: "bg-risk-attention/10 text-risk-attention border-risk-attention/40", barClass: "bg-risk-attention" },
  quase_lotado: { label: "Quase lotado", className: "bg-risk-alert/10 text-risk-alert border-risk-alert/40", barClass: "bg-risk-alert" },
  indisponivel: { label: "Indisponível", className: "bg-slate-500/10 text-slate-400 border-slate-500/40", barClass: "bg-slate-600" },
};

function statusStyleFor(status: string) {
  return STATUS_STYLE[status] ?? { label: status, className: "bg-navy-700 text-slate-300 border-navy-600", barClass: "bg-slate-500" };
}

export function Shelters() {
  const [shelters, setShelters] = useState<DemoShelter[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDemoShelters()
      .then((data) => setShelters(data.shelters))
      .catch(() => setError("Não foi possível carregar os abrigos simulados. A API está rodando?"));
  }, []);

  if (error) {
    return (
      <div>
        <PageHeader title="Abrigos" description="Abrigos simulados para demonstração." />
        <ErrorState message={error} />
      </div>
    );
  }

  const list = shelters ?? [];
  const totalCapacity = list.reduce((sum, s) => sum + s.capacity_total, 0);
  const totalOccupancy = list.reduce((sum, s) => sum + s.capacity_used, 0);
  const available = list
    .filter((s) => s.status !== "indisponivel")
    .reduce((sum, s) => sum + (s.capacity_total - s.capacity_used), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Capacidade de acolhimento"
        title="Abrigos"
        description="Dados simulados para demonstração — capacidade e ocupação de abrigos de apoio, consumidos de /api/shelters/demo."
      />

      <div className="mb-4">
        <DemoNotice>
          Estes abrigos são <strong className="text-slate-300">inteiramente simulados</strong> — nomes
          genéricos, sem vínculo confirmado com instituição real, sem persistência em
          banco. Relacionados aos eventos simulados em{" "}
          <Link to="/alertas" className="text-accent underline underline-offset-2">
            Alertas
          </Link>
          .
        </DemoNotice>
      </div>

      {list.length === 0 && !error && (
        <EmptyState loading title="Carregando abrigos…" description="Consultando /api/shelters/demo." />
      )}

      {list.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Abrigos simulados" value={String(list.length)} hint="via API, sem persistência" />
          <MetricCard label="Capacidade total" value={String(totalCapacity)} hint="pessoas" />
          <MetricCard label="Ocupação atual" value={String(totalOccupancy)} hint="pessoas acolhidas" />
          <MetricCard
            label="Vagas restantes"
            value={String(available)}
            accentClass={available > 0 ? "text-risk-safe" : "text-risk-critical"}
            hint="exclui abrigos indisponíveis"
          />
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {list.map((shelter) => {
          const style = statusStyleFor(shelter.status);
          const free = shelter.capacity_total - shelter.capacity_used;
          return (
            <div key={shelter.id} className="panel panel-interactive flex flex-col p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display text-base font-semibold leading-snug text-white">
                    {shelter.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">{shelter.region}</p>
                </div>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${style.className}`}
                >
                  {style.label}
                </span>
              </div>

              {/* Vagas livres é o número que a Defesa Civil realmente precisa
                  na hora de encaminhar alguém — vem antes da ocupação. */}
              <div className="mb-4 flex items-end gap-5">
                <div>
                  <p className="data-label">Vagas livres</p>
                  <p
                    className={`mt-1 font-mono text-[32px] font-semibold leading-none ${
                      free > 0 ? "text-risk-safe" : "text-risk-critical"
                    }`}
                  >
                    {free}
                  </p>
                </div>
                <div className="pb-1">
                  <p className="data-label">Ocupação</p>
                  <p className="mt-1 font-mono text-base font-semibold leading-none text-slate-300">
                    {shelter.capacity_used}
                    <span className="text-slate-600">/{shelter.capacity_total}</span>
                  </p>
                </div>
              </div>

              <div className="mb-1.5 flex justify-between text-[11px] text-slate-500">
                <span>{shelter.occupancy_percent}% ocupado</span>
                <span className="font-mono uppercase tracking-wider text-slate-600">simulado</span>
              </div>
              <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-navy-800 ring-1 ring-inset ring-navy-700/80">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ${style.barClass}`}
                  style={{ width: `${Math.min(100, shelter.occupancy_percent)}%` }}
                />
              </div>

              <p className="mb-3 text-xs leading-relaxed text-slate-500">{shelter.notes}</p>
              <p className="mt-auto border-t border-navy-700/70 pt-3 text-[11px] leading-relaxed text-slate-600">
                {shelter.address}
              </p>
            </div>
          );
        })}
      </div>

      <SectionCard title="O que falta para isto virar funcionalidade real">
        <ul className="text-sm text-slate-400 space-y-1.5 list-disc list-inside">
          <li>
            Persistir abrigos na tabela <code className="text-slate-500">shelters</code>, que já
            existe no schema PostGIS (hoje a lista vive só em memória no backend).
          </li>
          <li>Fila de solicitações de cadastro enviadas por cidadãos, com triagem da Defesa Civil.</li>
          <li>Atualização de ocupação em tempo real pelo operador.</li>
          <li>
            Localização dos abrigos no <Link to="/mapa" className="text-accent underline underline-offset-2">mapa</Link>, cruzada com as zonas HAND.
          </li>
        </ul>
      </SectionCard>
    </div>
  );
}
