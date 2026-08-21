import { useState } from "react";
import { Link } from "react-router-dom";
import type { SosRequest } from "../data/demoOperations";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { SOSForm } from "../components/SOSForm";
import { SOSRequestCard } from "../components/SOSRequestCard";
import { DemoBadge, SessionNote } from "../components/DemoBadge";
import { useOperations } from "../state/OperationsProvider";
import { SESSION_NOTICE } from "../state/OperationsProvider";
import { useRole } from "../state/RoleProvider";
import { isOperator } from "../lib/roleAccess";
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
  const { role } = useRole();
  const [submitted, setSubmitted] = useState<SosRequest | null>(null);

  const recent = sortSosQueue(sosRequests).slice(0, RECENT_LIMIT);

  // A Defesa Civil não envia pedido — ela atende. Mostrar o formulário aqui
  // convidaria o operador a abrir uma ocorrência em nome de terceiros, que é
  // outro fluxo (e não existe). A porta certa é a central (F11.2).
  if (isOperator(role)) {
    const waiting = sosRequests.filter((request) => request.status === "aguardando").length;
    return (
      <div className="max-w-xl py-6">
        <section className="panel p-7">
          <p className="data-label mb-4">Experiência de cidadão</p>
          <h1 className="font-display text-xl font-semibold leading-snug text-white">
            O envio de pedido pertence à experiência do cidadão.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            No perfil da Defesa Civil, os pedidos chegam já na fila de triagem da central de
            operação — com protocolo, localização e situação informada.
            {waiting > 0 && (
              <>
                {" "}
                Há{" "}
                <strong className="text-risk-attention">
                  {waiting} {waiting === 1 ? "pedido aguardando" : "pedidos aguardando"}
                </strong>{" "}
                atendimento.
              </>
            )}
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              to="/operacao"
              className="rounded-lg bg-accent px-4 py-2.5 text-center text-sm font-semibold text-navy-950 shadow-[0_0_20px_var(--glow-accent)] transition-colors hover:bg-accent/90"
            >
              Ir para a central de operação
            </Link>
            <Link
              to="/mapa"
              className="rounded-lg border border-navy-600 px-4 py-2.5 text-center text-sm font-semibold text-slate-300 transition-colors hover:border-accent hover:text-accent"
            >
              Voltar ao mapa
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Pedido de ajuda"
        title="SOS"
        description="Informe sua situação e localização. O pedido entra na fila de triagem desta demonstração."
        actions={<DemoBadge label="simulado" />}
      />

      {/* Aviso acima da dobra, não só depois de enviar: quem chega nesta tela
          precisa saber ANTES de preencher que o pedido não aciona ninguém.
          Depois do envio já seria tarde para a informação importar. */}
      <div className="mb-6 rounded-xl border border-risk-attention/30 bg-risk-attention/[0.06] px-4 py-3">
        <p className="text-xs leading-relaxed text-slate-300">
          <strong className="text-risk-attention">Demonstração</strong> — este formulário simula o
          fluxo de pedido de ajuda. Nada é enviado à Defesa Civil e nenhum atendimento é acionado.
          Em uma emergência real, procure a Defesa Civil (199) ou os Bombeiros (193).
        </p>
      </div>

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
