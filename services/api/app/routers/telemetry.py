"""
Rotas de telemetria — leituras simuladas de nível d'água e chuva.

Placeholder da F1. O simulador (services/simulator) ainda não está
conectado a este router.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


@router.get("/status")
def telemetry_status():
    return {"module": "telemetry", "status": "placeholder", "source": "simulation"}
