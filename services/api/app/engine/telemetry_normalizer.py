"""
Normalização de payloads brutos de telemetria simulada.

O simulador (services/simulator) e cenários de demo podem mandar campos com
nomes/unidades ligeiramente diferentes (ex.: "rainfall" vs "rainfall_mm",
"lat" vs "latitude"). Este módulo aceita esse payload solto e devolve uma
leitura normalizada, pronta para o motor de risco — sem exigir banco nem
validar contra um schema rígido de entrada (a validação rígida é na saída).

Nenhum dado real de hardware é lido aqui — tudo isso é simulado
(`source="simulation"`, `hardware_implemented=False` sempre, mesmo que o
payload bruto tente mandar outra coisa nesses dois campos — não são lidos
do `raw`, são fixados aqui).

F6.1: aceita também um conjunto de campos opcionais "enriquecidos"
(sensor_id, station_name, region, chuva em janelas de 15m/1h/6h/24h,
delta/tendência de nível d'água, bateria, qualidade de sinal/leitura — ver
docs/telemetria-detalhada.md). Nenhum desses campos é obrigatório e nenhum
deles alimenta o motor de risco hoje — são só normalizados e devolvidos,
preparando terreno para uma versão futura do motor sem quebrar o payload
mínimo que já funciona.
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

# --- Enriquecimento opcional (F6.1) — nenhuma chave aqui é obrigatória ---
_SENSOR_ID_KEYS = ("sensor_id",)
_STATION_NAME_KEYS = ("station_name", "nome_estacao")
_REGION_KEYS = ("region", "regiao", "bairro")
_RAINFALL_15M_KEYS = ("rainfall_mm_15m",)
_RAINFALL_1H_KEYS = ("rainfall_mm_1h",)
_RAINFALL_6H_KEYS = ("rainfall_mm_6h",)
_RAINFALL_24H_KEYS = ("rainfall_mm_24h",)
_WATER_LEVEL_DELTA_KEYS = ("water_level_delta_m",)
_TREND_KEYS = ("trend",)
_BATTERY_PERCENT_KEYS = ("battery_percent", "battery")
_SIGNAL_QUALITY_KEYS = ("signal_quality",)
_READING_QUALITY_KEYS = ("reading_quality",)

_TREND_DELTA_EPSILON_M = 0.05  # abaixo disso (m), tendência considerada "estavel"


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


def _optional_float(raw: dict[str, Any], keys: tuple[str, ...]) -> float | None:
    value = _first_present(raw, keys)
    return float(value) if value is not None else None


def _optional_str(raw: dict[str, Any], keys: tuple[str, ...]) -> str | None:
    value = _first_present(raw, keys)
    return str(value) if value is not None else None


def _trend_label(delta_m: float | None) -> str | None:
    """Rótulo simples a partir do delta de nível d'água — mesmo espírito do
    trend_factor em risk_rules.py, mas em texto em vez de fator numérico.
    None quando não há leitura anterior (sem delta calculável)."""
    if delta_m is None:
        return None
    if delta_m > _TREND_DELTA_EPSILON_M:
        return "subindo"
    if delta_m < -_TREND_DELTA_EPSILON_M:
        return "descendo"
    return "estavel"


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

    water_level_m = _clamp_non_negative(float(water_level))
    previous_water_level = _first_present(raw, _PREVIOUS_WATER_LEVEL_KEYS)
    previous_water_level_m = float(previous_water_level) if previous_water_level is not None else None

    water_level_delta_m = _optional_float(raw, _WATER_LEVEL_DELTA_KEYS)
    if water_level_delta_m is None and previous_water_level_m is not None:
        water_level_delta_m = round(water_level_m - previous_water_level_m, 4)

    trend = _optional_str(raw, _TREND_KEYS) or _trend_label(water_level_delta_m)

    battery_percent = _optional_float(raw, _BATTERY_PERCENT_KEYS)
    if battery_percent is not None:
        battery_percent = max(0.0, min(100.0, battery_percent))

    return NormalizedTelemetryReading(
        station_id=_first_present(raw, _STATION_ID_KEYS),
        latitude=float(latitude),
        longitude=float(longitude),
        rainfall_mm=_clamp_non_negative(float(rainfall)),
        water_level_m=water_level_m,
        previous_water_level_m=previous_water_level_m,
        communication_status=_first_present(raw, _COMMUNICATION_STATUS_KEYS) or "unknown",
        timestamp=_parse_timestamp(_first_present(raw, _TIMESTAMP_KEYS)),
        sensor_id=_optional_str(raw, _SENSOR_ID_KEYS),
        station_name=_optional_str(raw, _STATION_NAME_KEYS),
        region=_optional_str(raw, _REGION_KEYS),
        rainfall_mm_15m=_optional_float(raw, _RAINFALL_15M_KEYS),
        rainfall_mm_1h=_optional_float(raw, _RAINFALL_1H_KEYS),
        rainfall_mm_6h=_optional_float(raw, _RAINFALL_6H_KEYS),
        rainfall_mm_24h=_optional_float(raw, _RAINFALL_24H_KEYS),
        water_level_delta_m=water_level_delta_m,
        trend=trend,
        battery_percent=battery_percent,
        signal_quality=_optional_str(raw, _SIGNAL_QUALITY_KEYS),
        reading_quality=_optional_str(raw, _READING_QUALITY_KEYS),
    )
