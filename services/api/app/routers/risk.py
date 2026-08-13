"""
Rotas do motor de risco (F3).

Motor explicável, sem dependência obrigatória de banco — contexto HAND vem
do payload (hand_class_id/hand_risk_weight) ou de um lookup mockado por
região (app.engine.spatial_context). Fórmula, fatores e limitações:
docs/motor-de-risco.md.
"""

from fastapi import APIRouter

from app.engine import risk_engine
from app.schemas.risk import RiskBatchRequest, RiskBatchResponse, RiskEvaluationRequest, RiskEvaluationResponse

router = APIRouter(prefix="/api/risk", tags=["risk"])


@router.get("/status")
def risk_status():
    return {
        "module": "risk",
        "status": "active",
        "note": "motor de risco explicável (F3) — HAND + chuva + nível d'água + tendência",
    }


@router.post("/evaluate", response_model=RiskEvaluationResponse)
def evaluate_risk(request: RiskEvaluationRequest) -> RiskEvaluationResponse:
    return risk_engine.evaluate(request)


@router.post("/evaluate-batch", response_model=RiskBatchResponse)
def evaluate_risk_batch(request: RiskBatchRequest) -> RiskBatchResponse:
    return RiskBatchResponse(results=risk_engine.evaluate_batch(request.readings))
