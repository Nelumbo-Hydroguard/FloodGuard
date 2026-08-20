import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchDemoAlerts,
  fetchRiskStatus,
  fetchScenariosDemo,
  type DemoAlert,
  type RiskEvaluationResponse,
  type RiskLevel,
  type ScenariosDemoResponse,
} from "../lib/api";
import { RISK_THEME, riskWeight } from "../lib/riskTheme";
import { RiskCard } from "../components/RiskCard";
import { PageHeader } from "../components/PageHeader";
import { MetricCard } from "../components/MetricCard";
import { SectionCard } from "../components/SectionCard";
import { RiskLegend } from "../components/RiskLegend";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { MiniMap } from "../components/MiniMap";
import { alertIcon, sosIcon } from "../lib/mapMarkers";
import { DEMO_SENSORS } from "../data/demoOperations";
import { sortSosQueue, waterLevelLabel } from "../lib/operations";
import { useOperations } from "../state/OperationsProvider";

/**
 * `/painel` — a pergunta é uma só: **o que merece minha atenção agora?**
 *
 * Estrutura: KPIs de estado → mapa dos eventos ao lado das situações
 * prioritárias → próxima ação → decomposição por cenário. Não é uma coleção
 * de cards: cada bloco responde uma pergunta e some da tela se não tiver o
 * que dizer.
 *
 * Título derivado do nível de risco que o motor devolveu — não da chave do
 * cenário (F9). A chave descreve a *intenção* do cenário fixo; o
 * `risk_level` é o resultado real da fórmula.
 */
function scenarioTitle(level: RiskLevel): string {
  return `Cenário ${RISK_THEME[level].label.toLowerCase()}`;
}

const BLUMENAU_CENTER: [number, number] = [-26.9194, -49.0661];

/** Alerta "ativo" = alerta ou crítico. Atenção/seguro é monitoramento. */
function isActiveAlert(level: RiskLevel): boolean {
  return riskWeight(level) >= riskWeight("alerta");
}

function PriorityRow({
  tone,
  label,
  title,
  detail,
  to,
}: {
  tone: string;
  label: string;
  title: string;
  detail: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 border-b border-navy-800/70 py-3 transition-colors last:border-b-0 hover:bg-navy-800/40"
    >
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${tone}`} />
      <span className="min-w-0 flex-1">
        <span className="data-label">{label}</span>
        <span className="mt-0.5 block truncate text-sm font-semibold text-white">{title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-slate-400">{detail}</span>
      </span>
      <span className="mt-1 shrink-0 text-xs text-accent">→</span>
    </Link>
  );
}

export function Dashboard() {
  const { sosRequests } = useOperations();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [scenarios, setScenarios] = useState<ScenariosDemoResponse | null>(null);
  const [alerts, setAlerts] = useState<DemoAlert[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRiskStatus()
      .then(() => setApiOnline(true))
      .catch(() => setApiOnline(false));

    fetchScenariosDemo()
      .then(setScenarios)
      .catch(() =>
        setError("Sem resposta do motor de risco. Verifique se a API está no ar (http://localhost:8000)."),
      );

    // Alertas alimentam KPI, mapa e prioridades. Se falharem, o painel
    // continua de pé com os cenários — não derruba a tela inteira.
    fetchDemoAlerts()
      .then((data) => setAlerts(data.alerts))
      .catch(() => {});
  }, []);

  const results = useMemo(
    () =>
      scenarios
        ? (Object.keys(scenarios.scenarios) as Array<keyof ScenariosDemoResponse["scenarios"]>).map((key) => ({
            key,
            result: scenarios.scenarios[key],
          }))
        : [],
    [scenarios],
  );

  const highest = results.reduce<{ key: string; result: RiskEvaluationResponse } | null>((acc, curr) => {
    if (!acc || riskWeight(curr.result.risk_level) > riskWeight(acc.result.risk_level)) return curr;
    return acc;
  }, null);

  const onlineSensors = DEMO_SENSORS.filter((sensor) => sensor.status === "online");
  const offlineSensors = DEMO_SENSORS.filter((sensor) => sensor.status === "offline");
  const wettestSensor = onlineSensors.reduce<(typeof DEMO_SENSORS)[number] | null>(
    (acc, sensor) => (!acc || sensor.waterLevelM > acc.waterLevelM ? sensor : acc),
    null,
  );
  const averageRainfall = onlineSensors.length
    ? Math.round(onlineSensors.reduce((sum, sensor) => sum + sensor.rainfallMm, 0) / onlineSensors.length)
    : 0;

  const activeAlerts = (alerts ?? []).filter((alert) => isActiveAlert(alert.risk_level));
  const topAlert = activeAlerts.reduce<DemoAlert | null>(
    (acc, alert) => (!acc || riskWeight(alert.risk_level) > riskWeight(acc.risk_level) ? alert : acc),
    null,
  );

  const waitingSos = sosRequests.filter((request) => request.status === "aguardando");
  const topSos = sortSosQueue(waitingSos)[0] ?? null;

  if (error) {
    return (
      <div>
        <PageHeader eyebrow="Defesa Civil · Blumenau/SC" title="Painel operacional" />
        <ErrorState message={error} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Defesa Civil · Blumenau/SC"
        title="Painel operacional"
        description="Situação atual da operação e o que precisa de decisão agora."
        actions={
          apiOnline !== null && (
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${
                apiOnline
                  ? "border-risk-safe/40 bg-risk-safe/10 text-risk-safe"
                  : "border-risk-critical/40 bg-risk-critical/10 text-risk-critical"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${apiOnline ? "animate-breathe bg-risk-safe" : "bg-risk-critical"}`}
                style={{ boxShadow: `0 0 8px var(${apiOnline ? "--glow-safe" : "--glow-critical"})` }}
              />
              motor de risco {apiOnline ? "online" : "offline"}
            </span>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Sensores ativos" value={String(onlineSensors.length)} hint={`de ${DEMO_SENSORS.length}`} />
        <MetricCard
          label="Sensores offline"
          value={String(offlineSensors.length)}
          accentClass={offlineSensors.length > 0 ? "text-risk-attention" : "text-risk-safe"}
          hint="sem comunicação"
        />
        <MetricCard
          label="Alertas ativos"
          value={String(activeAlerts.length)}
          accentClass={activeAlerts.length > 0 ? "text-risk-alert" : "text-risk-safe"}
          hint="alerta ou crítico"
        />
        <MetricCard
          label="Maior nível"
          value={wettestSensor ? `${wettestSensor.waterLevelM.toFixed(2)}m` : "—"}
          accentClass="text-risk-alert"
          hint={wettestSensor ? wettestSensor.region : undefined}
        />
        <MetricCard label="Chuva média" value={`${averageRainfall}mm`} hint="sensores ativos" />
        <MetricCard
          label="SOS aguardando"
          value={String(waitingSos.length)}
          accentClass={waitingSos.length > 0 ? "text-risk-critical" : "text-risk-safe"}
          hint="sem atendimento"
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <SectionCard title="Eventos no território" subtitle="Alertas ativos e pedidos SOS aguardando.">
          <MiniMap
            className="h-[300px]"
            center={BLUMENAU_CENTER}
            zoom={12}
            markers={[
              ...(alerts ?? []).map((alert) => ({
                id: `alert-${alert.id}`,
                latitude: alert.latitude,
                longitude: alert.longitude,
                icon: alertIcon(RISK_THEME[alert.risk_level], alert.risk_level),
                popup: (
                  <div className="min-w-[180px]">
                    <strong className="text-[13px] font-semibold text-white">{alert.title}</strong>
                    <p className="mt-1 text-[11px] text-slate-500">{alert.region}</p>
                    <Link
                      to={`/mapa?alert=${alert.id}`}
                      className="mt-2 inline-block text-[11px] font-semibold text-accent underline-offset-2 hover:underline"
                    >
                      Abrir no mapa →
                    </Link>
                  </div>
                ),
              })),
              ...waitingSos.map((request) => ({
                id: `sos-${request.id}`,
                latitude: request.latitude,
                longitude: request.longitude,
                icon: sosIcon(true),
                popup: (
                  <div className="min-w-[180px]">
                    <strong className="text-[13px] font-semibold text-white">{request.id}</strong>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {request.peopleCount} pessoas · {waterLevelLabel(request.waterLevel)}
                    </p>
                    <Link
                      to="/operacao"
                      className="mt-2 inline-block text-[11px] font-semibold text-accent underline-offset-2 hover:underline"
                    >
                      Abrir na central →
                    </Link>
                  </div>
                ),
              })),
            ]}
          />
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-risk-critical" />
              Alertas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-[#f472b6]" />
              SOS aguardando
            </span>
            <Link to="/mapa" className="ml-auto font-semibold text-accent underline-offset-2 hover:underline">
              Abrir mapa completo →
            </Link>
          </div>
        </SectionCard>

        <SectionCard title="Situações prioritárias" subtitle="O que precisa de decisão agora.">
          <div className="flex flex-col">
            {topAlert && (
              <PriorityRow
                tone={RISK_THEME[topAlert.risk_level].dotClass}
                label={`Alerta ${RISK_THEME[topAlert.risk_level].label.toLowerCase()}`}
                title={topAlert.region ?? topAlert.title}
                detail={topAlert.recommended_action}
                to={`/alertas/${topAlert.id}`}
              />
            )}
            {wettestSensor && (
              <PriorityRow
                tone="bg-risk-alert"
                label="Maior nível d'água"
                title={`${wettestSensor.id} · ${wettestSensor.region}`}
                detail={`${wettestSensor.waterLevelM.toFixed(2)} m · ${wettestSensor.rainfallMm} mm acumulados`}
                to="/telemetria"
              />
            )}
            {topSos && (
              <PriorityRow
                tone="bg-[#f472b6]"
                label="Pedido SOS prioritário"
                title={`${topSos.id} · ${topSos.peopleCount} pessoas`}
                detail={`${waterLevelLabel(topSos.waterLevel)}${
                  topSos.reducedMobility ? ` · ${topSos.reducedMobilityCount} com mobilidade reduzida` : ""
                }`}
                to="/operacao"
              />
            )}
            {offlineSensors.length > 0 && (
              <PriorityRow
                tone="bg-slate-500"
                label="Sensor sem comunicação"
                title={`${offlineSensors[0].id} · ${offlineSensors[0].region}`}
                detail="Última leitura desatualizada — verificar enlace."
                to="/telemetria"
              />
            )}
            {!topAlert && !topSos && !wettestSensor && (
              <EmptyState title="Nenhuma situação prioritária" description="Operação estável no momento." />
            )}
          </div>
        </SectionCard>
      </div>

      {highest && (
        <div className="panel relative mb-6 overflow-hidden p-5">
          {/* Filete na cor do maior risco: a ação recomendada é o que a
              Defesa Civil precisa ler primeiro. */}
          <span
            className={`absolute inset-y-0 left-0 w-[3px] ${RISK_THEME[highest.result.risk_level].barClass}`}
            style={{ boxShadow: `0 0 16px var(${RISK_THEME[highest.result.risk_level].glowVar})` }}
          />
          <div className="flex flex-col gap-2 pl-2">
            <p className="data-label">Próxima ação recomendada</p>
            <p className="font-display text-lg font-semibold leading-snug text-white">
              {highest.result.recommended_action}
            </p>
            <p className="text-xs text-slate-500">
              {scenarioTitle(highest.result.risk_level)} · maior risco no momento
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-4 border-b border-navy-700/70 pb-3">
        <p className="data-label">Cenários monitorados</p>
        <RiskLegend />
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {results.map(({ key, result }) => (
            <RiskCard key={key} title={scenarioTitle(result.risk_level)} result={result} />
          ))}
        </div>
      ) : (
        <EmptyState loading title="Carregando cenários…" description="Consultando o motor de risco." />
      )}
    </div>
  );
}
