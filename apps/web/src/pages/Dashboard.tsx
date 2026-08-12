import { useEffect, useState } from "react";
import { fetchRiskStatus, fetchScenariosDemo, type ScenariosDemoResponse } from "../lib/api";
import { RiskCard } from "../components/RiskCard";

const SCENARIO_TITLES: Record<keyof ScenariosDemoResponse["scenarios"], string> = {
  seguro: "Cenário seguro",
  alerta: "Cenário alerta",
  critico: "Cenário crítico",
};

export function Dashboard() {
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [scenarios, setScenarios] = useState<ScenariosDemoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRiskStatus()
      .then((data) => setStatusNote(data.note))
      .catch(() => setError("Não foi possível falar com o motor de risco. A API está rodando?"));

    fetchScenariosDemo()
      .then(setScenarios)
      .catch(() => setError("Não foi possível carregar os cenários simulados. A API está rodando?"));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Painel operacional</h1>
      <p className="text-slate-400 mb-1">
        Resumo do motor de risco para a Defesa Civil — 3 cenários simulados
        avaliados pelo motor real (F3), não hardcoded.
      </p>
      {statusNote && <p className="text-slate-600 text-xs mb-4">{statusNote}</p>}
      {!statusNote && <div className="mb-4" />}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {scenarios && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(scenarios.scenarios) as Array<keyof ScenariosDemoResponse["scenarios"]>).map((key) => (
            <RiskCard key={key} title={SCENARIO_TITLES[key]} result={scenarios.scenarios[key]} />
          ))}
        </div>
      )}

      {!scenarios && !error && <p className="text-slate-500 text-sm">Carregando cenários…</p>}

      <p className="text-slate-600 text-xs mt-6">
        Todos os dados desta tela são simulados — telemetria sintética
        avaliada pelo motor de risco PoC. Não representam leituras de campo
        reais.
      </p>
    </div>
  );
}
