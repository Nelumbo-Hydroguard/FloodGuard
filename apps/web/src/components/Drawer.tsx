import { useEffect } from "react";
import type { ReactNode } from "react";

/**
 * Painel lateral para detalhe (abrigo, sensor).
 *
 * Drawer e não página nova: o operador está consultando um item sem sair da
 * lista que estava lendo — trocar de rota faria perder o filtro e o
 * contexto. Fecha no Esc e no clique fora, e trava o scroll do fundo
 * enquanto está aberto.
 */
export function Drawer({
  open,
  title,
  eyebrow,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1400] flex justify-end">
      <button
        type="button"
        aria-label="Fechar detalhe"
        onClick={onClose}
        className="absolute inset-0 bg-navy-950/70 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="panel-glass relative flex h-full w-full max-w-md animate-rise-in flex-col rounded-none border-y-0 border-r-0"
      >
        <header className="flex items-start justify-between gap-3 border-b border-navy-700/70 px-5 py-4">
          <div className="min-w-0">
            {eyebrow && <p className="data-label text-accent/80">{eyebrow}</p>}
            <h2 className="mt-1 font-display text-lg font-semibold leading-tight text-white">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-navy-600 px-2.5 py-1 text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-white"
          >
            Fechar
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && <footer className="border-t border-navy-700/70 px-5 py-4">{footer}</footer>}
      </aside>
    </div>
  );
}
