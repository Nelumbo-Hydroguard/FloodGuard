import { useEffect, useState } from "react";
import { fetchScenariosDemo, type ScenariosDemoResponse } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";

// Regiões dos 3 cenários fixos — espelha app/routers/scenarios.py
// (_DEMO_SCENARIOS) no backend. Não vem no RiskEvaluationResponse porque o
// motor de risco não carrega região na resposta; como os cenários de demo
// são fixos dos dois lados, mapear aqui é seguro (documentado, não é dado
// inventado — se o backend mudar a região do cenário, este mapa também
// precisa mudar).
const SCENARIO_REGION: Record<keyof ScenariosDemoResponse["scenarios"], string> = {
  seguro: "Garcia",
  alerta: "Velha",
  critico: "Itoupava Norte",
};

const SCENARIO_TITLES: Record<keyof ScenariosDemoResponse["scenarios"], string> = {
  seguro: "Alerta simulado — seguro",
  alerta: "Alerta simulado — atenção",
  critico: "Alerta simulado — crítico",
};

export function Alertas() {
  const [scenarios, setScenarios] = useState<ScenariosDemoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScenariosDemo()
      .then(setScenarios)
      .catch(() => setError("Não foi possível carregar os alertas simulados. A API está rodando?"));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Alertas</h1>
      <p className="text-slate-400 mb-4">
        Alertas simulados, derivados dos 3 cenários fixos do motor de risco
        (F3) — não há alertas reais emitidos pela Defesa Civil nesta PoC.
      </p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {scenarios && (
        <div className="flex flex-col gap-3">
          {(Object.keys(scenarios.scenarios) as Array<keyof ScenariosDemoResponse["scenarios"]>).map((key) => {
            const result = scenarios.scenarios[key];
            return (
              <div key={key} className="border border-slate-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold">{SCENARIO_TITLES[key]}</h3>
                    <p className="text-xs text-slate-500">
                      Região: {SCENARIO_REGION[key]} · {new Date(result.timestamp).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <StatusBadge level={result.risk_level} />
                </div>
                <p className="text-sm text-slate-400 mb-2">{result.explanation}</p>
                <p className="text-sm">
                  <span className="text-slate-500">Ação recomendada: </span>
                  {result.recommended_action}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {!scenarios && !error && <p className="text-slate-500 text-sm">Carregando alertas…</p>}
    </div>
  );
}
