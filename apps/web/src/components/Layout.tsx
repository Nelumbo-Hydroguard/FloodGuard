import { Link, Outlet } from "react-router-dom";

export function Layout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <nav className="flex items-center gap-6">
          <Link to="/" className="font-semibold text-lg">
            FloodGuard
          </Link>
          <Link to="/painel" className="text-slate-300 hover:text-white">
            Painel
          </Link>
          <Link to="/mapa" className="text-slate-300 hover:text-white">
            Mapa de risco
          </Link>
          <Link to="/abrigos" className="text-slate-300 hover:text-white">
            Abrigos
          </Link>
        </nav>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
