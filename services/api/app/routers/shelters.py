"""Rotas de abrigos e solicitações de cadastro. Placeholder da F1."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/shelters", tags=["shelters"])


@router.get("/status")
def shelters_status():
    return {"module": "shelters", "status": "placeholder"}
