import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchDemoAlertById, type DemoAlert } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StatusBadge } from "../components/StatusBadge";
import { FactorBar } from "../components/FactorBar";
import { EmptyState } from "../components/EmptyState";
import { RISK_THEME } from "../lib/riskTheme";
import { OPERATIONAL_ACTION_LABEL, getOperationalRecommendation } from "../lib/alertMessaging";
import { PublicGuidanceCard } from "../components/PublicGuidanceCard";
import { showsTechnicalDetail } from "../lib/roleAccess";
import { useRole } from "../state/RoleProvider";

const STATUS_LABEL: Record<string, string> = {
  simulated_monitoring: "Em monitoramento",
  simulated_attention: "Em atenção",
  simulated_active: "Ativo",
  simulated_critical: "Crítico",
};

export function AlertDetail() {
  const { id } = useParams();
  const { role } = useRole();
  const technical = showsTechnicalDetail(role);
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
        setError("Sem resposta da API de alertas. Verifique se o backend está no ar.");
      }
    });
  }, [id]);

  if (notFound) {
    return (
      <div>
        <PageHeader title="Alerta não encontrado" />
        <EmptyState
          title="Este alerta não existe"
          description={`Nenhum evento com id "${id}". Volte para a lista.`}
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
        <EmptyState loading title="Carregando…" />
      </div>
    );
  }

  const theme = RISK_THEME[alert.risk_level];

  // Cidadão e visitante veem só a camada pública deste mesmo evento: o card
  // de orientação já traz nível, região, horário, o que está acontecendo e o
  // que fazer. Score, confiança, fatores e justificativa do motor ficam de
  // fora — são a leitura de quem opera, não de quem precisa decidir se sai
  // de casa (F11.2).
  if (!technical) {
    return (
      <div className="max-w-2xl">
        <PageHeader
          eyebrow="Situação da região"
          title={alert.region ?? "Região não informada"}
          description="Informação pública sobre o evento monitorado nesta região."
          actions={<StatusBadge level={alert.risk_level} />}
        />

        <PublicGuidanceCard
          level={alert.risk_level}
          region={alert.region}
          timestamp={alert.timestamp}
          actions={
            <>
              <Link
                to={`/mapa?alert=${alert.id}`}
                className="inline-flex items-center rounded-lg border border-accent/40 bg-accent/10 px-3.5 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
              >
                Ver no mapa →
              </Link>
              <Link
                to="/abrigos"
                className="inline-flex items-center rounded-lg border border-navy-600 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-500 hover:text-white"
              >
                Ver locais seguros
              </Link>
            </>
          }
        />

        <Link
          to="/alertas"
          className="mt-5 inline-flex items-center px-1 py-2 text-sm text-slate-400 underline-offset-2 transition-colors hover:text-white hover:underline"
        >
          ← Voltar para Alertas
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Evento simulado"
        title={alert.title}
        description={`${alert.region ?? "Região não informada"} · ${new Date(alert.timestamp).toLocaleString("pt-BR")}`}
        actions={<StatusBadge level={alert.risk_level} />}
      />

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
          <FactorBar label="Score de risco" value={alert.risk_score} />
        </SectionCard>

        <SectionCard title="Status do evento">
          <p className="text-sm font-medium text-slate-100">
            {STATUS_LABEL[alert.status] ?? alert.status}
          </p>
          <p className="mt-4 border-t border-navy-700/70 pt-4 text-xs text-slate-500">
            Região: <span className="text-slate-300">{alert.region ?? "não informada"}</span>
          </p>
          {alert.simulated && (
            <p className="mt-2 text-xs text-slate-500">
              Origem: <span className="text-risk-attention">simulada</span>
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Justificativa" className="mb-4">
        <p className="text-sm leading-relaxed text-slate-400">{alert.explanation}</p>
      </SectionCard>

      {/* As duas saídas do evento, lado a lado e explicitamente rotuladas:
          o que a EQUIPE faz e o que a POPULAÇÃO ouve. Ficarem juntas é
          proposital — é aqui que o operador confere se a comunicação
          preventiva bate com a decisão operacional antes de acionar. */}
      <div className="mb-6 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="panel relative overflow-hidden p-5">
          <span
            className={`absolute inset-y-0 left-0 w-[3px] ${theme.barClass}`}
            style={{ boxShadow: `0 0 16px var(${theme.glowVar})` }}
          />
          <div className="pl-2">
            <p className="data-label mb-2">{OPERATIONAL_ACTION_LABEL}</p>
            <p className="font-display text-lg font-semibold leading-snug text-white">
              {getOperationalRecommendation(alert.risk_level, alert.recommended_action)}
            </p>
            <p className="mt-3 border-t border-navy-700/70 pt-3 text-[11px] text-slate-600">
              Dirigida à Defesa Civil / operador.
            </p>
          </div>
        </div>

        <PublicGuidanceCard
          level={alert.risk_level}
          region={alert.region}
          timestamp={alert.timestamp}
        />
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
          Testar na Telemetria
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
