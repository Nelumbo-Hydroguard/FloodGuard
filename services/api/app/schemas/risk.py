"""
Schemas do motor de risco (F3).

RiskAssessment (F1) é o que fica gravado em risk_assessments no PostGIS —
mantido para não quebrar a tabela existente. RiskEvaluationRequest/Response
são os schemas do motor em si (services/api/app/engine/risk_engine.py),
usados pelos endpoints /api/risk/evaluate e /api/risk/evaluate-batch.
"""

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import RiskLevel


class RiskAssessment(BaseModel):
    station_id: str
    hand_zone_id: str | None = None
    risk_score: float
    risk_level: str
    source: str = "simulation"


class RiskEvaluationRequest(BaseModel):
    """Entrada mínima do motor — lat/lon, chuva e nível d'água são
    obrigatórios. Contexto HAND é opcional: se nem hand_class_id/
    hand_risk_weight nem region vierem, o motor cai no fallback."""

    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    rainfall_mm: float = Field(..., ge=0)
    water_level_m: float = Field(..., ge=0)
    previous_water_level_m: float | None = Field(default=None, ge=0)
    hand_class_id: int | None = None
    hand_risk_weight: float | None = Field(default=None, ge=0, le=1)
    region: str | None = None
    communication_status: str = "unknown"
    timestamp: datetime | None = None
    station_id: str | None = None


class RiskFactors(BaseModel):
    hand_weight: float
    rainfall_factor: float
    water_level_factor: float
    trend_factor: float


class RiskEvaluationResponse(BaseModel):
    risk_level: RiskLevel
    risk_score: float
    confidence: float
    spatial_context_available: bool
    factors: RiskFactors
    explanation: str
    recommended_action: str
    station_id: str | None = None
    timestamp: datetime


class RiskBatchRequest(BaseModel):
    readings: list[RiskEvaluationRequest]


class RiskBatchResponse(BaseModel):
    results: list[RiskEvaluationResponse]
