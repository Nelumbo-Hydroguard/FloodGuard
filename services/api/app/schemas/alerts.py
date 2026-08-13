from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import RiskLevel


class Alert(BaseModel):
    """Schema legado (F1) — alinhado à tabela `alerts` do PostGIS
    (db/migrations/002_core_tables.sql), para quando alertas persistidos de
    verdade existirem. Não usado pelos endpoints de demo da F7."""

    id: str
    title: str
    description: str
    severity: str
    status: str = "active"
    created_at: datetime | None = None
    expires_at: datetime | None = None


class DemoAlert(BaseModel):
    """
    Alerta simulado (F7) — derivado em tempo real do motor de risco sobre
    app.routers.scenarios.DEMO_SCENARIOS (mesma fonte de /api/scenarios/demo
    e /api/geo/demo-points). Recalculado a cada chamada; nada é persistido.

    `status` usa prefixo `simulated_` de propósito — nunca "active"/"open"
    sozinho, para não parecer um alerta real emitido pela Defesa Civil.
    """

    id: str
    title: str
    region: str | None
    latitude: float
    longitude: float
    risk_level: RiskLevel
    risk_score: float
    confidence: float
    explanation: str
    recommended_action: str
    status: str
    timestamp: datetime
    source: str = "simulation"
    simulated: bool = True
    suggested_next_step: str | None = None


class DemoAlertsResponse(BaseModel):
    source: str = "simulation"
    alerts: list[DemoAlert]
