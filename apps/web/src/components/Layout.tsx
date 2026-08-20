import { Link, Outlet, useLocation } from "react-router-dom";
import { BrandMark } from "./BrandMark";

/**
 * A navegação principal carrega SÓ operação. "Sobre / Saiba mais" é
 * documentação: vive à direita, em peso visual secundário, para não
 * competir com Painel/Mapa/Alertas na hora de uma ocorrência (F11).
 */
const NAV_ITEMS = [
  { to: "/painel", label: "Painel" },
  { to: "/mapa", label: "Mapa" },
  { to: "/alertas", label: "Alertas" },
  { to: "/telemetria", label: "Telemetria" },
  { to: "/abrigos", label: "Abrigos" },
];

/**
 * Rotas que assumem a viewport inteira em vez de viver na coluna central.
 * Hoje só o mapa: ele é a peça central da demonstração e, enquadrado numa
 * caixa de 560px entre blocos de texto, lia como figura de relatório em vez
 * de tela operacional (auditoria F10).
 */
const FULL_BLEED_ROUTES = new Set(["/mapa"]);

export function Layout() {
  const location = useLocation();
  const fullBleed = FULL_BLEED_ROUTES.has(location.pathname);
  const aboutActive = location.pathname.startsWith("/sobre");

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      {/* h-14 é altura fixa de propósito: o mapa calcula a própria altura a
          partir dela (calc(100vh-3.5rem)). Se mudar aqui, muda lá. */}
      <header className="sticky top-0 z-[1200] h-14 border-b border-navy-700/80 bg-navy-950/85 backdrop-blur-xl">
        <div className="flex h-full items-center gap-6 px-5">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
            <BrandMark className="h-6 w-6 text-accent transition-transform duration-200 group-hover:scale-105" />
            <span className="font-display text-[15px] font-bold tracking-tight text-white">
              <span className="mr-1 font-medium text-slate-400">Nelumbo</span>
              Flood<span className="text-accent">Guard</span>
            </span>
          </Link>

          <div className="h-6 w-px shrink-0 bg-navy-700" />

          <nav className="no-scrollbar flex h-full flex-1 items-stretch gap-0.5 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              // Prefixo, não igualdade: em /alertas/critico o item
              // "Alertas" continua destacado (F9). Com igualdade exata a
              // navegação perdia o "você está aqui" ao abrir um detalhe.
              const active =
                location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center whitespace-nowrap px-3.5 text-[13px] font-medium transition-colors ${
                    active ? "text-white" : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {item.label}
                  {/* Indicador na base do header, não pílula de fundo: lê
                      como aba de console e não desloca o texto. */}
                  <span
                    className={`absolute inset-x-2.5 bottom-0 h-0.5 rounded-full transition-all duration-200 ${
                      active ? "bg-accent shadow-[0_0_12px_var(--glow-accent)]" : "bg-transparent"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          <span className="hidden shrink-0 items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.07] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent lg:inline-flex">
            <span className="h-1.5 w-1.5 animate-breathe rounded-full bg-accent shadow-[0_0_8px_var(--glow-accent)]" />
            Modo demo — dados simulados
          </span>

          <Link
            to="/sobre"
            aria-current={aboutActive ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap text-[12px] transition-colors ${
              aboutActive ? "text-slate-200" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Saiba mais
          </Link>
        </div>
      </header>

      <main>
        {fullBleed ? (
          <Outlet />
        ) : (
          <div className="mx-auto w-full max-w-7xl p-6">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
