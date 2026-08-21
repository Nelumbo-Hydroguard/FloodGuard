import { Link, Outlet, useLocation } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { RoleSwitcher } from "./RoleSwitcher";
import { useOperations } from "../state/OperationsProvider";
import { useRole } from "../state/RoleProvider";
import { NAV_BY_ROLE, isOperator } from "../lib/roleAccess";

/**
 * A navegação principal carrega SÓ operação. "Sobre / Saiba mais" é
 * documentação: vive à direita, em peso visual secundário, para não
 * competir com Painel/Mapa/Alertas na hora de uma ocorrência (F11).
 *
 * Desde a F11.2 os itens vêm de `NAV_BY_ROLE` — a mesma declaração que o
 * portão de rota lê, para menu e bloqueio nunca discordarem.
 */

/**
 * Rotas que assumem a viewport inteira em vez de viver na coluna central.
 * Hoje só o mapa: ele é a peça central da demonstração e, enquadrado numa
 * caixa de 560px entre blocos de texto, lia como figura de relatório em vez
 * de tela operacional (auditoria F10).
 */
const FULL_BLEED_ROUTES = new Set(["/mapa"]);

export function Layout() {
  const location = useLocation();
  const { role } = useRole();
  const { sosRequests } = useOperations();
  const fullBleed = FULL_BLEED_ROUTES.has(location.pathname);
  const aboutActive = location.pathname.startsWith("/sobre");

  const navItems = NAV_BY_ROLE[role];

  // Contador na nav só para pedido SEM atendimento: é a única pendência que
  // exige alguém agir agora. "Em atendimento" já tem dono. Só a operação vê
  // a fila — para o cidadão, o volume de pedidos de terceiros não é dado dele.
  const waitingSos = isOperator(role)
    ? sosRequests.filter((request) => request.status === "aguardando").length
    : 0;

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      {/* h-14 é altura fixa de propósito: o mapa calcula a própria altura a
          partir dela (calc(100vh-3.5rem)). Se mudar aqui, muda lá. */}
      <header className="sticky top-0 z-[1200] h-14 border-b border-navy-700/80 bg-navy-950/85 backdrop-blur-xl">
        <div className="flex h-full items-center gap-3 px-4 sm:gap-6 sm:px-5">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 group">
            <BrandMark className="h-6 w-6 text-accent transition-transform duration-200 group-hover:scale-105" />
            <span className="font-display text-[15px] font-bold tracking-tight text-white">
              <span className="mr-1 hidden font-medium text-slate-400 sm:inline">Nelumbo</span>
              Flood<span className="text-accent">Guard</span>
            </span>
          </Link>

          <div className="hidden h-6 w-px shrink-0 bg-navy-700 sm:block" />

          <nav className="no-scrollbar flex h-full flex-1 items-stretch gap-0.5 overflow-x-auto">
            {navItems.map((item) => {
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
                  className={`relative flex items-center whitespace-nowrap px-3 text-[13px] font-medium transition-colors sm:px-3.5 ${
                    active ? "text-white" : "text-slate-400 hover:text-slate-100"
                  }`}
                >
                  {item.label}
                  {item.to === "/operacao" && waitingSos > 0 && (
                    <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-risk-critical px-1 font-mono text-[10px] font-bold text-white">
                      {waitingSos}
                    </span>
                  )}
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

          {/* O selo "modo demo" some a partir do seletor de perfil: ele já
              carrega o rótulo DEMO e a nota de autenticação, e dois avisos
              lado a lado no header viram ruído. */}
          <RoleSwitcher />

          <Link
            to="/acesso"
            className="hidden shrink-0 whitespace-nowrap text-[12px] text-slate-500 transition-colors hover:text-slate-300 xl:inline"
          >
            Acesso
          </Link>

          <Link
            to="/sobre"
            aria-current={aboutActive ? "page" : undefined}
            className={`hidden shrink-0 whitespace-nowrap text-[12px] transition-colors sm:inline ${
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
