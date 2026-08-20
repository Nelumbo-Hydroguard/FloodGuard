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
  { to: "/painel", label: "Painel", description: "Situação atual e próxima ação" },
  { to: "/mapa", label: "Mapa", description: "Onde estão os alertas e abrigos" },
  { to: "/alertas", label: "Alertas", description: "Fila de eventos em monitoramento" },
  { to: "/telemetria", label: "Telemetria", description: "Avaliar uma leitura" },
];

export function NotFound() {
  const location = useLocation();

  return (
    <div>
      <PageHeader
        title="Página não encontrada"
        description="Escolha um destino abaixo."
      />

      <div className="panel p-4 mb-6">
        <p className="text-sm text-slate-400">
          Nenhuma tela responde por{" "}
          <code className="text-risk-attention font-mono break-all">{location.pathname}</code>.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SUGGESTIONS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="panel panel-interactive group p-4"
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
