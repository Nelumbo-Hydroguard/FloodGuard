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
