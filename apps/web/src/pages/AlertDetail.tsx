import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchDemoAlertById, type DemoAlert } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";
import { DemoNotice } from "../components/DemoNotice";
import { FactorBar } from "../components/FactorBar";
import { EmptyState } from "../components/EmptyState";

const STATUS_LABEL: Record<string, string> = {
  simulated_monitoring: "Em monitoramento",
  simulated_attention: "Em atenção",
  simulated_active: "Ativo",
  simulated_critical: "Crítico",
};

export function AlertDetail() {
  const { id } = useParams();
  const [alert, setAlert] = useState<DemoAlert | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setAlert(null);
    setNotFound(false);
    setError(null);

    fetchDemoAlertById(id).then(setAlert).catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("404")) {
        setNotFound(true);
      } else {
        setError("Não foi possível carregar o alerta. A API está rodando?");
      }
    });
  }, [id]);

  if (notFound) {
    return (
      <div>
        <PageHeader title="Alerta não encontrado" description={`Nenhum evento simulado com id "${id}".`} />
        <EmptyState
          title="Este alerta não existe"
          description="Os alertas simulados são fixos (seguro, alerta, critico) — verifique o link ou volte para a lista."
        />
        <Link to="/alertas" className="inline-block mt-4 text-sm text-accent hover:underline underline-offset-2">
          ← Voltar para Alertas
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Detalhe do alerta" />
        <p className="text-sm text-risk-critical mb-4">{error}</p>
        <Link to="/alertas" className="text-sm text-accent hover:underline underline-offset-2">
          ← Voltar para Alertas
        </Link>
      </div>
    );
  }

  if (!alert) {
    return (
      <div>
        <PageHeader title="Detalhe do alerta" />
        <EmptyState title="Carregando…" description={`Consultando /api/alerts/demo/${id}.`} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={alert.title}
        description={`Região: ${alert.region ?? "não informada"} · ${new Date(alert.timestamp).toLocaleString("pt-BR")}`}
        actions={<StatusBadge level={alert.risk_level} />}
      />

      <div className="mb-6">
        <DemoNotice>
          Origem simulada — este alerta vem de{" "}
          <code className="text-slate-400">/api/alerts/demo/{alert.id}</code>, derivado do motor de
          risco sobre um cenário fixo de demonstração. Não é uma emissão real da
          Defesa Civil e não há persistência em banco.
        </DemoNotice>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Avaliação de risco">
          <div className="flex items-baseline gap-3 mb-3">
            <span className="text-3xl font-bold font-mono tabular-nums text-white">
              {Math.round(alert.risk_score * 100)}%
            </span>
            <span className="text-xs text-slate-500">confiança {Math.round(alert.confidence * 100)}%</span>
          </div>
          <FactorBar label="Score de risco" value={alert.risk_score} />
        </SectionCard>

        <SectionCard title="Status do evento simulado">
          <p className="text-sm text-slate-200 mb-1">{STATUS_LABEL[alert.status] ?? alert.status}</p>
          <p className="text-xs text-slate-500 font-mono">{alert.status}</p>
          <p className="text-xs text-slate-600 mt-2">source: {alert.source} · simulated: {String(alert.simulated)}</p>
        </SectionCard>
      </div>

      <SectionCard title="Justificativa" className="mb-4">
        <p className="text-sm text-slate-400">{alert.explanation}</p>
      </SectionCard>

      <SectionCard title="Ação recomendada" className="mb-6">
        <p className="text-sm text-slate-200">{alert.recommended_action}</p>
      </SectionCard>

      <div className="flex flex-wrap gap-3">
        <Link to="/alertas" className="text-sm text-accent hover:underline underline-offset-2">
          ← Voltar para Alertas
        </Link>
        <Link to="/mapa" className="text-sm text-accent hover:underline underline-offset-2">
          Ver no Mapa
        </Link>
        <Link to="/telemetria" className="text-sm text-accent hover:underline underline-offset-2">
          Testar outros valores em Telemetria
        </Link>
      </div>
    </div>
  );
}
