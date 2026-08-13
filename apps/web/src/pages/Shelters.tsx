import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { DemoNotice } from "../components/DemoNotice";
import { MetricCard } from "../components/MetricCard";

/**
 * `/abrigos` — tela demonstrativa (F6.2.1).
 *
 * IMPORTANTE: estes abrigos são DADOS FIXOS DE FRONTEND, temporários. Não
 * vêm do banco e não passam pela API — o router `shelters.py` continua
 * placeholder e a tabela `shelters` (db/migrations/002_core_tables.sql)
 * continua vazia. O CRUD real (cadastro, ocupação em tempo real, triagem de
 * solicitações do cidadão) é item da F7.
 *
 * Até a F6.2 esta página era um parágrafo solto numa tela 90% vazia, mas
 * aparecia no menu com o mesmo peso das telas reais — a auditoria apontou
 * que isso passa impressão de produto quebrado. A escolha aqui foi mostrar
 * uma tela honesta e legível em vez de esconder o item do menu, deixando o
 * caráter simulado explícito em todos os pontos da interface.
 */

interface SimulatedShelter {
  id: string;
  name: string;
  address: string;
  capacity: number;
  currentOccupancy: number;
  status: "disponivel" | "lotando" | "lotado";
}

// Locais reais e conhecidos de Blumenau usados como rótulo plausível; a
// ocupação/capacidade abaixo é inventada para a demo, não é dado oficial da
// Defesa Civil nem reflete abrigo ativo.
const SIMULATED_SHELTERS: SimulatedShelter[] = [
  {
    id: "sim-abrigo-001",
    name: "Ginásio Sebastião Cruz (simulado)",
    address: "Bairro Velha, Blumenau/SC",
    capacity: 220,
    currentOccupancy: 84,
    status: "disponivel",
  },
  {
    id: "sim-abrigo-002",
    name: "Escola Municipal Itoupava (simulado)",
    address: "Itoupava Norte, Blumenau/SC",
    capacity: 150,
    currentOccupancy: 131,
    status: "lotando",
  },
  {
    id: "sim-abrigo-003",
    name: "Centro Comunitário Garcia (simulado)",
    address: "Bairro Garcia, Blumenau/SC",
    capacity: 90,
    currentOccupancy: 90,
    status: "lotado",
  },
];

const STATUS_STYLE: Record<SimulatedShelter["status"], { label: string; className: string }> = {
  disponivel: { label: "Disponível", className: "bg-risk-safe/10 text-risk-safe border-risk-safe/40" },
  lotando: { label: "Quase lotado", className: "bg-risk-alert/10 text-risk-alert border-risk-alert/40" },
  lotado: { label: "Lotado", className: "bg-risk-critical/10 text-risk-critical border-risk-critical/40" },
};

function occupancyBarClass(ratio: number): string {
  if (ratio >= 1) return "bg-risk-critical";
  if (ratio >= 0.8) return "bg-risk-alert";
  return "bg-risk-safe";
}

export function Shelters() {
  const totalCapacity = SIMULATED_SHELTERS.reduce((sum, s) => sum + s.capacity, 0);
  const totalOccupancy = SIMULATED_SHELTERS.reduce((sum, s) => sum + s.currentOccupancy, 0);
  const available = totalCapacity - totalOccupancy;

  return (
    <div>
      <PageHeader
        title="Abrigos e solicitações"
        description="Capacidade e ocupação de abrigos — tela demonstrativa com dados fixos, sem persistência."
      />

      <div className="mb-4">
        <DemoNotice>
          Os abrigos abaixo são <strong className="text-slate-300">inteiramente simulados</strong> e
          estão fixos no frontend — não vêm do banco, não passam pela API e não
          representam abrigos ativos da Defesa Civil de Blumenau. Cadastro real,
          ocupação em tempo real e triagem de solicitações são item da{" "}
          <strong className="text-slate-300">F7</strong>.
        </DemoNotice>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Abrigos simulados" value={String(SIMULATED_SHELTERS.length)} hint="dados fixos de demo" />
        <MetricCard label="Capacidade total" value={String(totalCapacity)} hint="pessoas" />
        <MetricCard label="Ocupação atual" value={String(totalOccupancy)} hint="pessoas acolhidas" />
        <MetricCard
          label="Vagas restantes"
          value={String(available)}
          accentClass={available > 0 ? "text-risk-safe" : "text-risk-critical"}
          hint="somando os 3 abrigos"
        />
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {SIMULATED_SHELTERS.map((shelter) => {
          const ratio = shelter.currentOccupancy / shelter.capacity;
          const percent = Math.round(ratio * 100);
          const status = STATUS_STYLE[shelter.status];

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
                  <p className="text-xs text-slate-500 mt-0.5">{shelter.address}</p>
                </div>
                <span
                  className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide shrink-0 ${status.className}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Ocupação</span>
                <span className="font-mono tabular-nums">
                  {shelter.currentOccupancy} / {shelter.capacity} ({percent}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-navy-700">
                <div
                  className={`h-1.5 rounded-full ${occupancyBarClass(ratio)}`}
                  style={{ width: `${Math.min(100, percent)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <SectionCard title="O que falta para isto virar funcionalidade real">
        <ul className="text-sm text-slate-400 space-y-1.5 list-disc list-inside">
          <li>
            Conectar <code className="text-slate-500">app/routers/shelters.py</code> (hoje placeholder)
            à tabela <code className="text-slate-500">shelters</code>, que já existe no schema PostGIS.
          </li>
          <li>Fila de solicitações de cadastro enviadas por cidadãos, com triagem da Defesa Civil.</li>
          <li>Atualização de ocupação em tempo real pelo operador.</li>
          <li>Localização dos abrigos no mapa, cruzada com as zonas HAND.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
