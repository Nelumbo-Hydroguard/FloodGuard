"""
Normalização de payloads brutos de telemetria simulada.

O simulador (services/simulator) e cenários de demo podem mandar campos com
nomes/unidades ligeiramente diferentes (ex.: "rainfall" vs "rainfall_mm",
"lat" vs "latitude"). Este módulo aceita esse payload solto e devolve uma
leitura normalizada, pronta para o motor de risco — sem exigir banco nem
validar contra um schema rígido de entrada (a validação rígida é na saída).

Nenhum dado real de hardware é lido aqui — tudo isso é simulado
(`source="simulation"`, `hardware_implemented=False` sempre).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.schemas.telemetry import NormalizedTelemetryReading

_RAINFALL_KEYS = ("rainfall_mm", "rainfall", "precipitation_mm", "chuva_mm", "chuva_acumulada_mm")
_WATER_LEVEL_KEYS = ("water_level_m", "water_level", "nivel_agua_m", "nivel_agua")
_PREVIOUS_WATER_LEVEL_KEYS = ("previous_water_level_m", "previous_water_level", "nivel_agua_anterior_m")
_LATITUDE_KEYS = ("latitude", "lat")
_LONGITUDE_KEYS = ("longitude", "lon", "lng")
_COMMUNICATION_STATUS_KEYS = ("communication_status", "comm_status", "status_comunicacao")
_TIMESTAMP_KEYS = ("timestamp", "recorded_at", "datetime")
_STATION_ID_KEYS = ("station_id", "device_id", "id")


def _first_present(raw: dict[str, Any], keys: tuple[str, ...]) -> Any | None:
    for key in keys:
        if key in raw and raw[key] is not None:
            return raw[key]
    return None


def _clamp_non_negative(value: float) -> float:
    """Leituras físicas (chuva, nível d'água) não podem ser negativas — ruído
    de simulação/sensor vira 0, não descarta a leitura inteira."""
    return max(0.0, value)


def _parse_timestamp(value: Any | None) -> datetime:
    if value is None:
        return datetime.now(timezone.utc)
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def normalize(raw: dict[str, Any]) -> NormalizedTelemetryReading:
    rainfall = _first_present(raw, _RAINFALL_KEYS)
    water_level = _first_present(raw, _WATER_LEVEL_KEYS)
    latitude = _first_present(raw, _LATITUDE_KEYS)
    longitude = _first_present(raw, _LONGITUDE_KEYS)

    if rainfall is None or water_level is None or latitude is None or longitude is None:
        missing = [
            name
            for name, value in [
                ("rainfall_mm", rainfall),
                ("water_level_m", water_level),
                ("latitude", latitude),
                ("longitude", longitude),
            ]
            if value is None
        ]
        raise ValueError(f"Payload de telemetria incompleto — faltando: {', '.join(missing)}")

    previous_water_level = _first_present(raw, _PREVIOUS_WATER_LEVEL_KEYS)

    return NormalizedTelemetryReading(
        station_id=_first_present(raw, _STATION_ID_KEYS),
        latitude=float(latitude),
        longitude=float(longitude),
        rainfall_mm=_clamp_non_negative(float(rainfall)),
        water_level_m=_clamp_non_negative(float(water_level)),
        previous_water_level_m=float(previous_water_level) if previous_water_level is not None else None,
        communication_status=_first_present(raw, _COMMUNICATION_STATUS_KEYS) or "unknown",
        timestamp=_parse_timestamp(_first_present(raw, _TIMESTAMP_KEYS)),
    )
