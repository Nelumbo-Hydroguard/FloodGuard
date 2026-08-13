import { Link, Outlet, useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/painel", label: "Painel" },
  { to: "/mapa", label: "Mapa" },
  { to: "/alertas", label: "Alertas" },
  { to: "/telemetria", label: "Telemetria" },
  { to: "/abrigos", label: "Abrigos" },
  { to: "/sobre", label: "Sobre" },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-navy-700 bg-navy-950/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent shrink-0" />
              <span className="font-semibold text-white tracking-tight">FloodGuard</span>
            </Link>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const active = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                      active
                        ? "bg-navy-800 text-accent font-medium"
                        : "text-slate-400 hover:text-white hover:bg-navy-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded border border-accent-muted/40 bg-accent/5 px-2 py-1 text-[11px] font-mono uppercase tracking-wider text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            Modo demo — dados simulados
          </span>
        </div>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
