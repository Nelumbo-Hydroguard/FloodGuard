"""
Schema de leitura de telemetria simulada.

Espelha o formato de services/simulator/simulated_payload_example.json.
"""

from datetime import datetime

from pydantic import BaseModel


class TelemetryReading(BaseModel):
    station_id: str
    water_level: float
    rainfall: float
    latitude: float
    longitude: float
    battery: float
    communication_status: str
    source: str = "simulation"
    hardware_implemented: bool = False
    recorded_at: datetime | None = None


class NormalizedTelemetryReading(BaseModel):
    """Saída de app.engine.telemetry_normalizer.normalize() — pronta para o
    motor de risco (nomes de campo alinhados com RiskEvaluationRequest)."""

    station_id: str | None = None
    latitude: float
    longitude: float
    rainfall_mm: float
    water_level_m: float
    previous_water_level_m: float | None = None
    communication_status: str = "unknown"
    source: str = "simulation"
    hardware_implemented: bool = False
    timestamp: datetime


class MeshPayload(BaseModel):
    """Saída de app.engine.mesh_payload.build_mesh_payload() — payload
    compacto UniMesh/LoRa simulado (implemented sempre False)."""

    protocol: str
    channel: str
    status: str
    risk_level: str
    risk_score: float
    region: str
    recommended_action: str
    compact_payload: str
    latency_seconds_simulated: float
    timestamp: datetime
    source: str = "simulation"
    implemented: bool = False
    note: str = "Camada de comunicação simulada. Não houve transmissão LoRa física."
