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
    motor de risco (nomes de campo alinhados com RiskEvaluationRequest).

    Os campos abaixo de "enriquecimento opcional" (F6.1) não alimentam o
    motor de risco hoje — ele continua usando só rainfall_mm, water_level_m
    e a tendência calculada internamente em risk_rules.trend_factor(). Eles
    existem para (a) não descartar metadado que um payload mais rico já
    manda e (b) preparar o terreno para uma versão futura do motor que use
    chuva em janelas de tempo e qualidade de sinal — ver
    docs/telemetria-detalhada.md. Continuam 100% simulados: hardware_implemented
    é sempre False aqui, independente do que o payload bruto mandar (ver
    telemetry_normalizer.normalize — decisão deliberada, não lê esse campo
    do payload de entrada)."""

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

    # --- Enriquecimento opcional (F6.1) — None quando o payload bruto não informa ---
    sensor_id: str | None = None
    station_name: str | None = None
    region: str | None = None
    rainfall_mm_15m: float | None = None
    rainfall_mm_1h: float | None = None
    rainfall_mm_6h: float | None = None
    rainfall_mm_24h: float | None = None
    water_level_delta_m: float | None = None
    trend: str | None = None
    battery_percent: float | None = None
    signal_quality: str | None = None
    reading_quality: str | None = None


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
