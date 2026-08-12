"""
Rotas de telemetria — leituras simuladas de nível d'água e chuva.

`normalize` e `mesh-payload` entraram na F3 (app.engine.telemetry_normalizer
e app.engine.mesh_payload). Nenhuma leitura real de hardware — tudo
simulado, `source="simulation"` e `implemented=False` sempre.
"""

from typing import Any

from fastapi import APIRouter, HTTPException

from app.engine import mesh_payload as mesh_payload_engine
from app.engine import risk_engine, telemetry_normalizer
from app.schemas.risk import RiskEvaluationRequest
from app.schemas.telemetry import MeshPayload, NormalizedTelemetryReading

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


@router.get("/status")
def telemetry_status():
    return {"module": "telemetry", "status": "active", "source": "simulation"}


@router.post("/normalize", response_model=NormalizedTelemetryReading)
def normalize_telemetry(payload: dict[str, Any]) -> NormalizedTelemetryReading:
    try:
        return telemetry_normalizer.normalize(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/mesh-payload", response_model=MeshPayload)
def build_mesh_payload(payload: dict[str, Any]) -> MeshPayload:
    """
    Aceita um payload bruto de telemetria (normalizado internamente),
    calcula o risco via app.engine.risk_engine e empacota o resultado como
    payload UniMesh/LoRa simulado. `region` é opcional no payload — usado só
    para contexto HAND mockado e para identificar a área no payload
    compacto; sem ele, cai no fallback do motor (sem contexto espacial).
    """
    region = payload.get("region", "regiao_nao_informada")
    try:
        normalized = telemetry_normalizer.normalize(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    risk_request = RiskEvaluationRequest(
        latitude=normalized.latitude,
        longitude=normalized.longitude,
        rainfall_mm=normalized.rainfall_mm,
        water_level_m=normalized.water_level_m,
        previous_water_level_m=normalized.previous_water_level_m,
        hand_class_id=payload.get("hand_class_id"),
        hand_risk_weight=payload.get("hand_risk_weight"),
        region=payload.get("region"),
        communication_status=normalized.communication_status,
        timestamp=normalized.timestamp,
        station_id=normalized.station_id,
    )
    risk = risk_engine.evaluate(risk_request)
    return mesh_payload_engine.build_mesh_payload(risk, region=region)
