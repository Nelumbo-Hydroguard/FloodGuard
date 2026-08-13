"""
Rotas de alertas — F7: alertas simulados derivados do motor de risco.

Nenhum alerta aqui é uma emissão real da Defesa Civil. Todo alerta vem de
app.routers.scenarios.DEMO_SCENARIOS, os mesmos 3 cenários fixos usados por
/api/scenarios/demo e /api/geo/demo-points — mesma fonte de verdade, para
"cenário" e "alerta" nunca divergirem entre endpoints. Sem persistência:
cada chamada reavalia o motor de risco na hora (app.engine.risk_engine),
nada é gravado em banco — a tabela `alerts` (002_core_tables.sql) continua
vazia.
"""

from fastapi import APIRouter, HTTPException

from app.engine import risk_engine
from app.routers.scenarios import DEMO_SCENARIOS
from app.schemas.alerts import DemoAlert, DemoAlertsResponse

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

# status usa sempre o prefixo simulated_ — nunca "active"/"open" sozinho,
# pra não parecer um alerta real emitido pela Defesa Civil.
_STATUS_BY_LEVEL = {
    "seguro": "simulated_monitoring",
    "atencao": "simulated_attention",
    "alerta": "simulated_active",
    "critico": "simulated_critical",
}

_TITLE_BY_LEVEL = {
    "seguro": "Evento simulado — Seguro",
    "atencao": "Evento simulado — Atenção",
    "alerta": "Evento simulado — Alerta",
    "critico": "Evento simulado — Crítico",
}


@router.get("/status")
def alerts_status():
    return {
        "module": "alerts",
        "status": "demo",
        "source": "simulation",
        "persistence": False,
        "message": (
            "Alertas simulados, derivados dos 3 cenários fixos do motor de "
            "risco (mesma fonte de /api/scenarios/demo). Nenhum alerta é "
            "emitido pela Defesa Civil real e nada é persistido em banco — "
            "ver GET /api/alerts/demo."
        ),
    }


def _build_alert(alert_id: str) -> DemoAlert:
    request = DEMO_SCENARIOS[alert_id]
    result = risk_engine.evaluate(request)
    return DemoAlert(
        id=alert_id,
        title=_TITLE_BY_LEVEL[result.risk_level],
        region=result.region,
        latitude=request.latitude,
        longitude=request.longitude,
        risk_level=result.risk_level,
        risk_score=result.risk_score,
        confidence=result.confidence,
        explanation=result.explanation,
        recommended_action=result.recommended_action,
        status=_STATUS_BY_LEVEL[result.risk_level],
        timestamp=result.timestamp,
        suggested_next_step="/telemetria" if result.risk_level in ("alerta", "critico") else None,
    )


@router.get("/demo", response_model=DemoAlertsResponse)
def demo_alerts():
    return DemoAlertsResponse(alerts=[_build_alert(key) for key in DEMO_SCENARIOS])


@router.get("/demo/{alert_id}", response_model=DemoAlert)
def demo_alert_detail(alert_id: str):
    if alert_id not in DEMO_SCENARIOS:
        raise HTTPException(
            status_code=404,
            detail=(
                f"Alerta simulado '{alert_id}' não existe. Use um de: "
                f"{', '.join(DEMO_SCENARIOS.keys())} (ver GET /api/alerts/demo)."
            ),
        )
    return _build_alert(alert_id)
