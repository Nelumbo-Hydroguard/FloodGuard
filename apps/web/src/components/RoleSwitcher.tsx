import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  HOME_BY_ROLE,
  ROLES,
  ROLE_DEMO_NOTICE,
  ROLE_LABEL,
  ROLE_SUMMARY,
  canAccess,
  type Role,
} from "../lib/roleAccess";
import { useRole } from "../state/RoleProvider";
import { DemoBadge } from "./DemoBadge";

/**
 * Seletor de perfil da demonstração.
 *
 * Menu próprio em vez de `<select>`: o select nativo renderiza a lista com o
 * chrome do sistema operacional — fundo branco, fonte do sistema — no meio de
 * um header escuro, e não comporta a linha de descrição que faz o seletor se
 * explicar sozinho.
 *
 * Ao trocar de perfil, se a rota atual não pertencer ao novo perfil, navega
 * para a casa dele. Sem isso o usuário trocava para "Visitante" dentro de
 * /telemetria e caía no portão de bloqueio — tecnicamente correto, mas lê
 * como erro logo após uma ação bem-sucedida.
 */
export function RoleSwitcher({ className = "" }: { className?: string }) {
  const { role, setRole } = useRole();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(next: Role) {
    setRole(next);
    setOpen(false);
    if (!canAccess(next, window.location.pathname)) {
      navigate(HOME_BY_ROLE[next]);
    }
  }

  return (
    <div ref={containerRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={ROLE_DEMO_NOTICE}
        className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-colors ${
          open
            ? "border-accent/50 bg-accent/10"
            : "border-navy-600/80 bg-navy-900/60 hover:border-navy-600 hover:bg-navy-800"
        }`}
      >
        <span className="hidden text-[10px] uppercase tracking-[0.12em] text-slate-500 sm:inline">
          Ver como
        </span>
        <span className="text-[13px] font-semibold text-slate-100">{ROLE_LABEL[role]}</span>
        <svg
          viewBox="0 0 12 12"
          aria-hidden="true"
          className={`h-2.5 w-2.5 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="panel-glass absolute right-0 top-[calc(100%+8px)] z-[1300] w-[264px] animate-rise-in overflow-hidden p-1.5"
        >
          <div className="flex items-center gap-2 px-2.5 pb-2 pt-1.5">
            <p className="data-label">Visualizar como</p>
            <DemoBadge label="demo" />
          </div>

          {ROLES.map((option) => {
            const active = option === role;
            return (
              <button
                key={option}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(option)}
                className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  active ? "bg-accent/10" : "hover:bg-navy-800/70"
                }`}
              >
                <span
                  className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                    active ? "bg-accent shadow-[0_0_8px_var(--glow-accent)]" : "bg-navy-600"
                  }`}
                />
                <span className="min-w-0">
                  <span className={`block text-[13px] font-semibold ${active ? "text-accent" : "text-slate-200"}`}>
                    {ROLE_LABEL[option]}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">
                    {ROLE_SUMMARY[option]}
                  </span>
                </span>
              </button>
            );
          })}

          <p className="border-t border-navy-700/70 px-2.5 pb-1.5 pt-2.5 text-[10px] leading-relaxed text-slate-600">
            {ROLE_DEMO_NOTICE}
          </p>
        </div>
      )}
    </div>
  );
}
