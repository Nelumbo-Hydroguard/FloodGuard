"""
Rotas de cenários de simulação (chuva, região, horizonte).

`GET /demo` roda 3 leituras fixas pelo motor de risco real
(app.engine.risk_engine) — não são respostas hardcoded, são o resultado de
verdade da fórmula para 3 combinações representativas de fatores. Não
representa dados reais de campo — `source="simulation"` sempre.
"""

from fastapi import APIRouter

from app.engine import risk_engine
from app.schemas.risk import RiskEvaluationRequest

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])


@router.get("/status")
def scenarios_status():
    return {"module": "scenarios", "status": "active", "source": "simulation"}


_DEMO_SCENARIOS = {
    "seguro": RiskEvaluationRequest(
        latitude=-26.914,
        longitude=-49.077,
        rainfall_mm=5,
        water_level_m=0.3,
        previous_water_level_m=0.3,
        hand_class_id=3,
        hand_risk_weight=0.1,
        region="Garcia",
        communication_status="ok",
        station_id="sim-demo-seguro",
    ),
    "alerta": RiskEvaluationRequest(
        latitude=-26.925,
        longitude=-49.073,
        rainfall_mm=90,
        water_level_m=1.8,
        previous_water_level_m=1.5,
        hand_class_id=1,
        hand_risk_weight=0.6,
        region="Velha",
        communication_status="ok",
        station_id="sim-demo-alerta",
    ),
    "critico": RiskEvaluationRequest(
        latitude=-26.898,
        longitude=-49.081,
        rainfall_mm=140,
        water_level_m=2.8,
        previous_water_level_m=2.2,
        hand_class_id=0,
        hand_risk_weight=0.9,
        region="Itoupava Norte",
        communication_status="degraded",
        station_id="sim-demo-critico",
    ),
}


@router.get("/demo")
def demo_scenarios():
    return {
        "source": "simulation",
        "scenarios": {
            label: risk_engine.evaluate(request).model_dump(mode="json")
            for label, request in _DEMO_SCENARIOS.items()
        },
    }
