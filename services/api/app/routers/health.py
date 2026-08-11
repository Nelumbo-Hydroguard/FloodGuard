from fastapi import APIRouter

from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "FloodGuard API",
        "mode": "simulation" if settings.simulation_mode else "production",
    }
