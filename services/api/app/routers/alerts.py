"""Rotas de alertas da Defesa Civil. Placeholder da F1."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("/status")
def alerts_status():
    return {"module": "alerts", "status": "placeholder"}
