import { useLocation, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import {
  HOME_BY_ROLE,
  ROLE_DEMO_NOTICE,
  ROLE_LABEL,
  audienceFor,
  canAccess,
  suggestedRoleFor,
} from "../lib/roleAccess";
import { useRole } from "../state/RoleProvider";
import { DemoBadge } from "./DemoBadge";

/**
 * Portão de EXPERIÊNCIA — não de segurança.
 *
 * O que ele faz: quando a rota não pertence ao perfil selecionado, troca o
 * conteúdo por um convite para ver a mesma área com o perfil certo. O que ele
 * não faz: proteger nada. O dado já chegou ao navegador, a rota continua
 * acessível e o próprio painel oferece o botão que remove o bloqueio. Chamar
 * isso de permissão seria descrever mal o que o código faz.
 *
 * Por que não um 403: 403 é a resposta a "você não pode". Aqui a resposta é
 * "isto é de outro público — quer ver como ele?". A tela nomeia o público,
 * oferece a troca e oferece a saída. Ninguém fica sem caminho.
 */
export function RoleGate({ children }: { children: ReactNode }) {
  const { role, setRole } = useRole();
  const location = useLocation();
  const navigate = useNavigate();

  if (canAccess(role, location.pathname)) return <>{children}</>;

  const suggested = suggestedRoleFor(location.pathname);
  const operational = audienceFor(location.pathname) === "operational";

  const message = operational
    ? "Esta área pertence à experiência operacional da Defesa Civil."
    : "Solicitações identificadas estão disponíveis para cidadãos cadastrados.";

  const detail = operational
    ? "Painel, telemetria e central de operação reúnem os dados técnicos usados por quem monitora e responde às ocorrências."
    : "O envio de pedido de ajuda faz parte da experiência do cidadão cadastrado. As informações públicas de risco continuam abertas a todos.";

  return (
    <div className="mx-auto max-w-xl py-10">
      <section className="panel p-7">
        <div className="mb-4 flex items-center gap-2">
          <p className="data-label">Experiência de {ROLE_LABEL[suggested]}</p>
          <DemoBadge label="demo" />
        </div>

        <h1 className="font-display text-xl font-semibold leading-snug text-white">{message}</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{detail}</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setRole(suggested)}
            className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-navy-950 shadow-[0_0_20px_var(--glow-accent)] transition-colors hover:bg-accent/90"
          >
            Visualizar como {ROLE_LABEL[suggested]}
          </button>
          <button
            type="button"
            onClick={() => navigate(HOME_BY_ROLE[role])}
            className="rounded-lg border border-navy-600 px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:border-accent hover:text-accent"
          >
            Voltar ao mapa
          </button>
        </div>

        <p className="mt-5 border-t border-navy-700/70 pt-4 text-[11px] leading-relaxed text-slate-600">
          {ROLE_DEMO_NOTICE} Trocar de perfil aqui muda apenas o que a interface exibe.
        </p>
      </section>
    </div>
  );
}
