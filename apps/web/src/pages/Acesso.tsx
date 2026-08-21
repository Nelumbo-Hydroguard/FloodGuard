import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { SessionNote } from "../components/DemoBadge";
import {
  HOME_BY_ROLE,
  ROLES,
  ROLE_DEMO_NOTICE,
  ROLE_LABEL,
  ROLE_SUMMARY,
  type Role,
} from "../lib/roleAccess";
import { useRole } from "../state/RoleProvider";

/**
 * `/acesso` — escolha de EXPERIÊNCIA, não tela de login.
 *
 * A plataforma não tem autenticação. Desenhar um formulário de usuário e
 * senha aqui simularia um controle de acesso inexistente — é o tipo de
 * detalhe que vende bem numa demo e mente sobre o produto. Então a tela
 * apresenta os três perfis de demonstração, diz em letras claras que a
 * autenticação não está habilitada, e entra direto.
 *
 * Desde a F11.2 esta tela *define* o perfil ativo, em vez de só apontar
 * links: era estranho a tela chamada "Acesso" ser a única que não mudava
 * nada. O mesmo perfil pode ser trocado a qualquer momento no header.
 *
 * Quando houver autenticação de verdade, esta é a rota que ganha o formulário.
 */

const DETAIL: Record<Role, { eyebrow: string; entry: string; highlights: string[] }> = {
  visitor: {
    eyebrow: "Acesso público",
    entry: "Sem identificação",
    highlights: ["Mapa de risco", "Alertas da região", "Locais seguros"],
  },
  citizen: {
    eyebrow: "Acesso cidadão",
    entry: "Cidadão cadastrado",
    highlights: ["Tudo do visitante", "Pedido de ajuda (SOS)", "Acompanhamento do protocolo"],
  },
  civil_defense: {
    eyebrow: "Acesso operacional",
    entry: "Defesa Civil / operador",
    highlights: ["Painel e telemetria", "Score, confiança e fatores", "Central de operação"],
  },
};

export function Acesso() {
  const { role, setRole } = useRole();
  const navigate = useNavigate();

  function enter(next: Role) {
    setRole(next);
    navigate(HOME_BY_ROLE[next]);
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Perfis de demonstração"
        title="Escolha uma experiência de demonstração"
        description="O FloodGuard atende públicos diferentes. Escolha por qual deles quer navegar."
      />

      <div className="mb-6 rounded-xl border border-risk-attention/30 bg-risk-attention/[0.06] px-4 py-3">
        <p className="text-xs leading-relaxed text-slate-300">
          <strong className="text-risk-attention">Modo demonstração</strong> — autenticação real não
          habilitada. A troca de perfil muda apenas o que a interface exibe; nenhuma tela fica
          protegida de verdade e nenhum dado é persistido.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {ROLES.map((option) => {
          const detail = DETAIL[option];
          const active = option === role;
          return (
            <section
              key={option}
              className={`panel flex flex-col p-5 ${active ? "border-accent/50" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="data-label text-accent/80">{detail.eyebrow}</p>
                {active && (
                  <span className="rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
                    atual
                  </span>
                )}
              </div>

              <h2 className="mt-1.5 font-display text-lg font-semibold leading-tight text-white">
                {ROLE_LABEL[option]}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{ROLE_SUMMARY[option]}</p>

              <ul className="mt-4 flex flex-col gap-1.5 border-t border-navy-700/70 pt-4">
                {detail.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/70" />
                    {item}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => enter(option)}
                className={`mt-5 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                  active
                    ? "bg-accent text-navy-950 shadow-[0_0_20px_var(--glow-accent)] hover:bg-accent/90"
                    : "border border-navy-600 text-slate-200 hover:border-accent hover:text-accent"
                }`}
              >
                {active ? "Continuar" : `Entrar como ${ROLE_LABEL[option]}`}
              </button>

              <p className="mt-3 text-center text-[10px] uppercase tracking-[0.12em] text-slate-600">
                {detail.entry}
              </p>
            </section>
          );
        })}
      </div>

      <div className="mt-6">
        <SessionNote>
          {ROLE_DEMO_NOTICE} Autenticação, cadastro e trilha de auditoria estão no roadmap — ver
          Saiba mais.
        </SessionNote>
      </div>
    </div>
  );
}
