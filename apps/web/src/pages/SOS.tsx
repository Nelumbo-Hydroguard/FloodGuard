import { useState } from "react";
import { Link } from "react-router-dom";
import type { SosRequest } from "../data/demoOperations";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { SOSForm } from "../components/SOSForm";
import { SOSRequestCard } from "../components/SOSRequestCard";
import { SessionNote } from "../components/DemoBadge";
import { useOperations } from "../state/OperationsProvider";
import { SESSION_NOTICE } from "../state/OperationsProvider";
import { sortSosQueue } from "../lib/operations";

/**
 * `/sos` — contexto de ENVIO (a pessoa que precisa de ajuda).
 *
 * A gestão dos mesmos pedidos fica em `/operacao`: são públicos-alvo
 * diferentes e juntar tudo numa tela só deixaria as duas piores. O que
 * aparece aqui da fila é o mínimo — protocolo, quantas pessoas, nível da
 * água, horário e status — sem descrição nem coordenada de terceiros.
 */

const RECENT_LIMIT = 5;

export function SOS() {
  const { sosRequests } = useOperations();
  const [submitted, setSubmitted] = useState<SosRequest | null>(null);

  const recent = sortSosQueue(sosRequests).slice(0, RECENT_LIMIT);

  return (
    <div>
      <PageHeader
        eyebrow="Pedido de ajuda"
        title="SOS"
        description="Informe sua situação e localização. O pedido entra na fila de triagem da operação."
        actions={
          <Link
            to="/operacao"
            className="rounded-lg border border-navy-600 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-accent hover:text-accent"
          >
            Central de operação →
          </Link>
        }
      />

      {submitted && (
        <div className="panel relative mb-6 overflow-hidden p-5">
          <span className="absolute inset-y-0 left-0 w-[3px] bg-risk-safe shadow-[0_0_16px_var(--glow-safe)]" />
          <div className="flex flex-wrap items-start justify-between gap-4 pl-2">
            <div>
              <p className="data-label">Protocolo</p>
              <p className="mt-1 font-mono text-2xl font-semibold leading-none text-white">
                {submitted.id}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                Status: <span className="font-semibold text-risk-attention">Aguardando atendimento</span>
              </p>
              <SessionNote>Pedido simulado para demonstração do fluxo operacional.</SessionNote>
            </div>
            <button
              type="button"
              onClick={() => setSubmitted(null)}
              className="rounded-lg border border-navy-600 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
            >
              Enviar outro pedido
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <SOSForm onSubmitted={setSubmitted} />
      </div>

      <SectionCard
        title="Pedidos recentes"
        subtitle="Fila desta sessão de demonstração."
        actions={<SessionNote>{SESSION_NOTICE}</SessionNote>}
      >
        <div className="flex flex-col">
          {recent.map((request) => (
            <SOSRequestCard key={request.id} request={request} variant="compact" />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
