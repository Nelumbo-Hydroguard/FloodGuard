"""
Rotas de cenários de simulação (chuva, região, horizonte).

Placeholder da F1. Alimenta o simulador de telemetria (services/simulator)
para fins de demonstração — não representa dados reais de campo.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/scenarios", tags=["scenarios"])


@router.get("/status")
def scenarios_status():
    return {"module": "scenarios", "status": "placeholder", "source": "simulation"}
