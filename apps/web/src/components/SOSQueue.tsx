import { useMemo, useState } from "react";
import type { SosRequest, SosStatus } from "../data/demoOperations";
import { sortSosQueue } from "../lib/operations";
import { SOSRequestCard } from "./SOSRequestCard";
import { EmptyState } from "./EmptyState";

/**
 * Fila da central de atendimento.
 *
 * Ordenação padrão vem de `sortSosQueue`: abertos antes de resolvidos e,
 * dentro disso, vulnerabilidade → nível da água → mais antigo. O filtro é
 * de status porque é a pergunta que o operador faz ("o que ainda não foi
 * atendido?"), não de região.
 */

const FILTERS: Array<{ key: SosStatus | "todos"; label: string }> = [
  { key: "todos", label: "Todos" },
  { key: "aguardando", label: "Aguardando" },
  { key: "em_atendimento", label: "Em atendimento" },
  { key: "resolvido", label: "Resolvidos" },
];

export function SOSQueue({
  requests,
  onAdvance,
}: {
  requests: SosRequest[];
  onAdvance: (id: string) => void;
}) {
  const [filter, setFilter] = useState<SosStatus | "todos">("todos");

  const ordered = useMemo(() => sortSosQueue(requests), [requests]);
  const visible = filter === "todos" ? ordered : ordered.filter((r) => r.status === filter);

  const countFor = (key: SosStatus | "todos") =>
    key === "todos" ? requests.length : requests.filter((r) => r.status === key).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-navy-700/70 bg-navy-900/50 p-2">
        {FILTERS.map((option) => {
          const selected = filter === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-transparent text-slate-400 hover:bg-navy-800 hover:text-slate-100"
              }`}
            >
              {option.label} <span className="ml-1 font-mono text-slate-500">{countFor(option.key)}</span>
            </button>
          );
        })}
        <span className="ml-auto px-2 text-[11px] text-slate-600">
          Ordem: vulnerabilidade · nível da água · mais antigo
        </span>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="Nenhum pedido neste filtro" description="Selecione outro status." />
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((request) => (
            <SOSRequestCard key={request.id} request={request} onAdvance={onAdvance} />
          ))}
        </div>
      )}
    </div>
  );
}
