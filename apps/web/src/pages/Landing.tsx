import { Link } from "react-router-dom";

/**
 * Página de entrada (`/`) — fora do Layout, sem a nav do sistema.
 *
 * Por isso ela precisa dos próprios CTAs: até a F6.2 esta página não tinha
 * nenhum link, e quem abrisse a raiz do produto ficava sem caminho para
 * entrar no sistema (achado bloqueador da auditoria — ver
 * docs/auditoria-demo-f6-2.md).
 */

const ENTRY_POINTS = [
  {
    to: "/painel",
    label: "Abrir painel operacional",
    description: "Visão da Defesa Civil: risco por cenário, fatores e ação recomendada.",
    primary: true,
  },
  {
    to: "/mapa",
    label: "Ver mapa de risco",
    description: "Zonas HAND reais de Blumenau sobre base cartográfica.",
    primary: false,
  },
  {
    to: "/telemetria",
    label: "Testar o motor de risco",
    description: "Formulário de leitura simulada — avalia risco na hora.",
    primary: false,
  },
  {
    to: "/sobre",
    label: "Entender o projeto",
    description: "O que é real, o que é simulado e o que é roadmap.",
    primary: false,
  },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        <header className="text-center flex flex-col items-center gap-4">
          <span className="inline-flex items-center gap-2 rounded border border-accent-muted/40 bg-accent/5 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Prova de conceito — dados simulados
          </span>

          <h1 className="text-5xl font-bold tracking-tight">FloodGuard</h1>

          <p className="text-lg text-slate-300 max-w-2xl">
            Plataforma <strong className="text-slate-100">GovTech B2G</strong> de apoio à
            tomada de decisão da <strong className="text-slate-100">Defesa Civil municipal</strong> em
            eventos de alagamento e inundação, com piloto em Blumenau/SC.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="border border-navy-700 bg-navy-900 rounded p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Diferencial</p>
            <p className="text-sm text-slate-300 mt-1">
              Camada <strong className="text-slate-100">HAND</strong> real de Blumenau — suscetibilidade
              topográfica cruzada com chuva e nível d'água.
            </p>
          </div>
          <div className="border border-navy-700 bg-navy-900 rounded p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Usuário</p>
            <p className="text-sm text-slate-300 mt-1">
              Operador da <strong className="text-slate-100">Defesa Civil</strong> — não é app de
              cidadão, é ferramenta de sala de operação.
            </p>
          </div>
          <div className="border border-navy-700 bg-navy-900 rounded p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Motor de risco</p>
            <p className="text-sm text-slate-300 mt-1">
              Fórmula <strong className="text-slate-100">explicável e auditável</strong> — toda avaliação
              vem com justificativa textual.
            </p>
          </div>
        </div>

        <nav className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ENTRY_POINTS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`group rounded border p-4 transition-colors ${
                item.primary
                  ? "border-accent bg-accent/10 hover:bg-accent/20"
                  : "border-navy-700 bg-navy-900 hover:border-accent-muted"
              }`}
            >
              <span
                className={`block font-semibold ${item.primary ? "text-accent" : "text-slate-100 group-hover:text-accent"}`}
              >
                {item.label} →
              </span>
              <span className="block text-sm text-slate-400 mt-1">{item.description}</span>
            </Link>
          ))}
        </nav>

        <footer className="border-t border-navy-700 pt-4 text-center">
          <p className="text-sm text-slate-500 max-w-2xl mx-auto">
            Prova de conceito <strong className="text-slate-400">software-only</strong> e{" "}
            <strong className="text-slate-400">hardware-agnóstica</strong>. Toda telemetria é
            simulada — não há sensores físicos, LoRaWAN, Meshtastic ou MQTT reais em operação.
            <strong className="text-slate-400"> Não substitui a Defesa Civil.</strong>
          </p>
        </footer>
      </div>
    </div>
  );
}
