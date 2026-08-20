import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { SessionNote } from "../components/DemoBadge";

/**
 * `/acesso` — escolha de contexto, NÃO tela de login.
 *
 * A plataforma não tem autenticação. Desenhar um formulário de usuário e
 * senha aqui simularia um controle de acesso inexistente — é o tipo de
 * detalhe que vende bem numa demo e mente sobre o produto. Então a tela
 * apresenta os dois contextos de uso (operação e cidadão), diz em letras
 * claras que a autenticação não está habilitada, e entra direto.
 *
 * Quando houver autenticação de verdade, esta é a rota que ganha o formulário.
 */

const CONTEXTS = [
  {
    to: "/painel",
    eyebrow: "Acesso operacional",
    title: "Defesa Civil / operador",
    description: "Painel, mapa, alertas, telemetria, central de atendimento e abrigos.",
    cta: "Entrar na demonstração",
    primary: true,
    links: [
      { to: "/operacao", label: "Central de operação" },
      { to: "/telemetria", label: "Telemetria" },
    ],
  },
  {
    to: "/sos",
    eyebrow: "Acesso cidadão",
    title: "Serviços públicos do FloodGuard",
    description: "Enviar pedido de ajuda, consultar alertas e encontrar um local seguro.",
    cta: "Entrar na demonstração",
    primary: false,
    links: [
      { to: "/abrigos", label: "Locais seguros" },
      { to: "/alertas", label: "Alertas" },
    ],
  },
];

export function Acesso() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Contextos de uso"
        title="Acesso"
        description="Escolha o contexto para navegar na demonstração."
      />

      <div className="mb-6 rounded-xl border border-risk-attention/30 bg-risk-attention/[0.06] px-4 py-3">
        <p className="text-xs leading-relaxed text-slate-300">
          <strong className="text-risk-attention">Modo demonstração</strong> — autenticação não
          habilitada. Todas as telas ficam abertas e nenhum dado é persistido.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {CONTEXTS.map((context) => (
          <section
            key={context.to}
            className={`panel flex flex-col p-5 ${context.primary ? "border-accent/40" : ""}`}
          >
            <p className="data-label text-accent/80">{context.eyebrow}</p>
            <h2 className="mt-1.5 font-display text-lg font-semibold leading-tight text-white">
              {context.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{context.description}</p>

            <Link
              to={context.to}
              className={`mt-5 rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition-colors ${
                context.primary
                  ? "bg-accent text-navy-950 shadow-[0_0_20px_var(--glow-accent)] hover:bg-accent/90"
                  : "border border-navy-600 text-slate-200 hover:border-accent hover:text-accent"
              }`}
            >
              {context.cta}
            </Link>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-navy-700/70 pt-3">
              {context.links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-xs text-slate-400 underline-offset-2 transition-colors hover:text-accent hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6">
        <SessionNote>
          Perfis, permissões e trilha de auditoria estão no roadmap — ver Saiba mais.
        </SessionNote>
      </div>
    </div>
  );
}
