import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchDemoAlertById, type DemoAlert } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";
import { DemoNotice } from "../components/DemoNotice";
import { FactorBar } from "../components/FactorBar";
import { EmptyState } from "../components/EmptyState";
import { RISK_THEME } from "../lib/riskTheme";

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

  const theme = RISK_THEME[alert.risk_level];

  return (
    <div>
      <PageHeader
        eyebrow="Evento simulado"
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

      <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SectionCard title="Avaliação de risco" className="md:col-span-2">
          <div className="mb-5 flex items-end gap-6">
            <div>
              <p className="data-label">Score de risco</p>
              <p className={`mt-1 font-mono text-[44px] font-semibold leading-none ${theme.textClass}`}>
                {Math.round(alert.risk_score * 100)}
                <span className="ml-0.5 text-xl text-slate-500">%</span>
              </p>
            </div>
            <div className="pb-1.5">
              <p className="data-label">Confiança</p>
              <p className="mt-1 font-mono text-xl font-semibold leading-none text-slate-300">
                {Math.round(alert.confidence * 100)}%
              </p>
            </div>
          </div>
          <FactorBar label="Score de risco" value={alert.risk_score} hint="composto pelo motor" />
        </SectionCard>

        <SectionCard title="Status do evento">
          <p className="mb-1 text-sm font-medium text-slate-100">
            {STATUS_LABEL[alert.status] ?? alert.status}
          </p>
          <p className="font-mono text-xs text-slate-500">{alert.status}</p>
          <dl className="mt-4 flex flex-col gap-2 border-t border-navy-700/70 pt-4 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">source</dt>
              <dd className="font-mono text-slate-300">{alert.source}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">simulated</dt>
              <dd className="font-mono text-risk-attention">{String(alert.simulated)}</dd>
            </div>
          </dl>
        </SectionCard>
      </div>

      <SectionCard title="Justificativa do motor" className="mb-4">
        <p className="text-sm leading-relaxed text-slate-400">{alert.explanation}</p>
      </SectionCard>

      {/* Ação recomendada com o peso visual da severidade do próprio alerta —
          é a saída acionável da tela, não mais um bloco de texto igual aos
          outros. */}
      <div className="panel relative mb-6 overflow-hidden p-5">
        <span
          className={`absolute inset-y-0 left-0 w-[3px] ${theme.barClass}`}
          style={{ boxShadow: `0 0 16px var(${theme.glowVar})` }}
        />
        <div className="pl-2">
          <p className="data-label mb-2">Ação recomendada</p>
          <p className="font-display text-lg font-semibold leading-snug text-white">
            {alert.recommended_action}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to={`/mapa?alert=${alert.id}`}
          className="inline-flex items-center rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/20"
        >
          Ver no mapa →
        </Link>
        <Link
          to="/telemetria"
          className="inline-flex items-center rounded-lg border border-navy-600 px-4 py-2 text-sm font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
        >
          Testar outros valores em Telemetria
        </Link>
        <Link
          to="/alertas"
          className="inline-flex items-center px-2 py-2 text-sm text-slate-400 underline-offset-2 transition-colors hover:text-white hover:underline"
        >
          ← Voltar para Alertas
        </Link>
      </div>
    </div>
  );
}
