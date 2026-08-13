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
        <EmptyState title="Carregando abrigos…" description="Consultando /api/shelters/demo." />
      )}

      {list.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
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

      <div className="flex flex-col gap-3 mb-6">
        {list.map((shelter) => {
          const style = statusStyleFor(shelter.status);
          return (
            <div key={shelter.id} className="border border-navy-700 bg-navy-900 rounded p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{shelter.name}</h3>
                    <span className="text-[10px] font-mono uppercase text-slate-600 border border-navy-600 rounded px-1.5 py-0.5">
                      simulado
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {shelter.address} · Região: {shelter.region}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide shrink-0 ${style.className}`}
                >
                  {style.label}
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Ocupação</span>
                <span className="font-mono tabular-nums">
                  {shelter.capacity_used} / {shelter.capacity_total} ({shelter.occupancy_percent}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-navy-700 mb-2">
                <div
                  className={`h-1.5 rounded-full ${style.barClass}`}
                  style={{ width: `${Math.min(100, shelter.occupancy_percent)}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">{shelter.notes}</p>
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
