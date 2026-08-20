import { Link } from "react-router-dom";
import { BrandMark } from "../components/BrandMark";

/**
 * Página de entrada (`/`) — fora do Layout, sem a nav do sistema, por isso
 * precisa dos próprios CTAs (achado bloqueador da F6.2: a raiz do produto
 * não tinha caminho para dentro do sistema).
 *
 * Vende o produto em poucos segundos: headline, dois CTAs e três blocos
 * curtos. Metodologia, limitações e origem dos dados vivem em /sobre — esta
 * página não é documentação (F11).
 */

const PILLARS = [
  {
    title: "Inteligência",
    description: "Risco calculado com terreno, chuva, nível e tendência — com o porquê junto.",
  },
  {
    title: "Resiliência",
    description: "Alertas, abrigos e capacidade de acolhimento numa só operação.",
  },
  {
    title: "Comunicação",
    description: "Ação recomendada pronta para acionar equipe de campo.",
  },
];

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-navy-950 px-6 py-12 text-slate-100">
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <header className="flex flex-col items-center gap-5 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
            <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-accent" />
            Modo demo — dados simulados
          </span>

          <div className="flex items-center gap-3">
            <BrandMark className="h-9 w-9 text-accent" />
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
              <span className="font-medium text-slate-400">Nelumbo</span> FloodGuard
            </h1>
          </div>

          <p className="max-w-2xl text-lg leading-snug text-slate-200">
            Inteligência e comunicação para decisões em eventos hidrológicos.
          </p>
          <p className="max-w-xl text-sm text-slate-400">
            Monitore riscos, visualize alertas e concentre informações críticas em uma
            única operação.
          </p>
        </header>

        <nav className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/painel"
            className="rounded-lg bg-accent px-6 py-3 text-center text-sm font-semibold text-navy-950 shadow-[0_0_24px_var(--glow-accent)] transition-colors hover:bg-accent/90"
          >
            Abrir painel
          </Link>
          <Link
            to="/mapa"
            className="rounded-lg border border-navy-600 px-6 py-3 text-center text-sm font-semibold text-slate-200 transition-colors hover:border-accent hover:text-accent"
          >
            Ver mapa
          </Link>
        </nav>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="panel p-4">
              <p className="data-label text-accent/80">{pillar.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{pillar.description}</p>
            </div>
          ))}
        </div>

        <footer className="border-t border-navy-700/70 pt-5 text-center">
          <p className="text-xs text-slate-500">
            Prova de conceito com dados simulados. Não substitui a Defesa Civil.{" "}
            <Link to="/sobre" className="text-accent underline-offset-2 hover:underline">
              Saiba mais
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
