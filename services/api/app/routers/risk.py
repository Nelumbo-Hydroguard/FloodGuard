"""
Rotas do motor de risco.

Placeholder da F1/F2. O motor de risco canônico (baseado no
techguard-sentinela) já está autorizado sob acordo de equipe — ver
docs/autoria-licenca.md — mas ainda não foi movido/implementado aqui.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/risk", tags=["risk"])


@router.get("/status")
def risk_status():
    return {
        "module": "risk",
        "status": "placeholder",
        "note": "motor de risco autorizado (acordo de equipe), ainda não implementado — ver docs/autoria-licenca.md",
    }
