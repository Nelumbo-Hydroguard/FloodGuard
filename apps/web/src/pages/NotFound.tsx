import { Link, useLocation } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

/**
 * Rota catch-all (`*`) — renderizada dentro do Layout, então mantém o
 * header/nav do sistema.
 *
 * Antes da F6.2.1 não havia catch-all: qualquer URL desconhecida montava um
 * <body> vazio (tela preta, sem nav, sem saída). Achado bloqueador da
 * auditoria — ver docs/auditoria-demo-f6-2.md.
 */

const SUGGESTIONS = [
  { to: "/painel", label: "Painel operacional", description: "Risco por cenário e ação recomendada" },
  { to: "/mapa", label: "Mapa de risco", description: "Zonas HAND de Blumenau" },
  { to: "/telemetria", label: "Telemetria", description: "Testar o motor de risco" },
  { to: "/sobre", label: "Sobre", description: "O que é real e o que é simulado" },
];

export function NotFound() {
  const location = useLocation();

  return (
    <div>
      <PageHeader
        title="Página não encontrada"
        description="A rota acessada não existe nesta plataforma."
      />

      <div className="border border-navy-700 bg-navy-900 rounded p-4 mb-6">
        <p className="text-sm text-slate-400">
          Nenhuma tela responde por{" "}
          <code className="text-risk-attention font-mono break-all">{location.pathname}</code>.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Isso não é uma falha do sistema — a URL simplesmente não corresponde a
          nenhuma rota registrada. Escolha um destino abaixo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SUGGESTIONS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="group rounded border border-navy-700 bg-navy-900 p-4 transition-colors hover:border-accent-muted"
          >
            <span className="block font-semibold text-slate-100 group-hover:text-accent">
              {item.label} →
            </span>
            <span className="block text-sm text-slate-400 mt-1">{item.description}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
