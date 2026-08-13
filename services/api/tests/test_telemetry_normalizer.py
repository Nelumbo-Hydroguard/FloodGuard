"""Testes unitários do normalizador de telemetria — sem banco, sem rede."""

import pytest

from app.engine import telemetry_normalizer


def test_normalizes_canonical_keys():
    reading = telemetry_normalizer.normalize(
        {
            "station_id": "sim-001",
            "latitude": -26.9,
            "longitude": -49.07,
            "rainfall_mm": 42.5,
            "water_level_m": 1.2,
            "communication_status": "ok",
        }
    )
    assert reading.station_id == "sim-001"
    assert reading.rainfall_mm == 42.5
    assert reading.water_level_m == 1.2
    assert reading.source == "simulation"
    assert reading.hardware_implemented is False


def test_accepts_aliased_keys():
    reading = telemetry_normalizer.normalize(
        {
            "device_id": "sim-002",
            "lat": -26.9,
            "lon": -49.07,
            "rainfall": 10,
            "water_level": 0.5,
        }
    )
    assert reading.station_id == "sim-002"
    assert reading.rainfall_mm == 10
    assert reading.water_level_m == 0.5


def test_negative_values_are_clamped_to_zero():
    reading = telemetry_normalizer.normalize(
        {"latitude": -26.9, "longitude": -49.07, "rainfall_mm": -5, "water_level_m": -1}
    )
    assert reading.rainfall_mm == 0.0
    assert reading.water_level_m == 0.0


def test_missing_required_field_raises_value_error():
    with pytest.raises(ValueError):
        telemetry_normalizer.normalize({"latitude": -26.9, "longitude": -49.07, "rainfall_mm": 10})


def test_missing_timestamp_defaults_to_now():
    reading = telemetry_normalizer.normalize(
        {"latitude": -26.9, "longitude": -49.07, "rainfall_mm": 0, "water_level_m": 0}
    )
    assert reading.timestamp is not None


def test_missing_communication_status_defaults_to_unknown():
    reading = telemetry_normalizer.normalize(
        {"latitude": -26.9, "longitude": -49.07, "rainfall_mm": 0, "water_level_m": 0}
    )
    assert reading.communication_status == "unknown"


# --- Campos enriquecidos opcionais (F6.1) --------------------------------


def test_enriched_fields_are_none_when_absent_minimal_payload_still_works():
    reading = telemetry_normalizer.normalize(
        {"latitude": -26.9, "longitude": -49.07, "rainfall_mm": 10, "water_level_m": 0.5}
    )
    assert reading.sensor_id is None
    assert reading.station_name is None
    assert reading.region is None
    assert reading.rainfall_mm_1h is None
    assert reading.water_level_delta_m is None
    assert reading.trend is None
    assert reading.battery_percent is None
    assert reading.signal_quality is None
    assert reading.reading_quality is None


def test_enriched_fields_are_normalized_when_present():
    reading = telemetry_normalizer.normalize(
        {
            "sensor_id": "sensor-42",
            "station_name": "Estação Velha",
            "region": "Velha",
            "latitude": -26.9,
            "longitude": -49.07,
            "rainfall_mm": 42.5,
            "rainfall_mm_15m": 3.1,
            "rainfall_mm_1h": 12.4,
            "rainfall_mm_6h": 30.0,
            "rainfall_mm_24h": 55.2,
            "water_level_m": 1.5,
            "previous_water_level_m": 1.2,
            "battery_percent": 87.5,
            "signal_quality": "boa",
            "reading_quality": "confiavel",
        }
    )
    assert reading.sensor_id == "sensor-42"
    assert reading.station_name == "Estação Velha"
    assert reading.region == "Velha"
    assert reading.rainfall_mm_15m == 3.1
    assert reading.rainfall_mm_1h == 12.4
    assert reading.rainfall_mm_6h == 30.0
    assert reading.rainfall_mm_24h == 55.2
    assert reading.battery_percent == 87.5
    assert reading.signal_quality == "boa"
    assert reading.reading_quality == "confiavel"


def test_water_level_delta_and_trend_are_derived_when_not_explicit():
    rising = telemetry_normalizer.normalize(
        {"latitude": -26.9, "longitude": -49.07, "rainfall_mm": 0, "water_level_m": 1.5, "previous_water_level_m": 1.0}
    )
    assert rising.water_level_delta_m == 0.5
    assert rising.trend == "subindo"

    falling = telemetry_normalizer.normalize(
        {"latitude": -26.9, "longitude": -49.07, "rainfall_mm": 0, "water_level_m": 1.0, "previous_water_level_m": 1.5}
    )
    assert falling.water_level_delta_m == -0.5
    assert falling.trend == "descendo"

    stable = telemetry_normalizer.normalize(
        {"latitude": -26.9, "longitude": -49.07, "rainfall_mm": 0, "water_level_m": 1.0, "previous_water_level_m": 1.01}
    )
    assert stable.trend == "estavel"


def test_battery_percent_is_clamped_to_0_100_range():
    reading = telemetry_normalizer.normalize(
        {"latitude": -26.9, "longitude": -49.07, "rainfall_mm": 0, "water_level_m": 0, "battery_percent": 150}
    )
    assert reading.battery_percent == 100.0


def test_hardware_implemented_is_always_false_even_if_payload_claims_otherwise():
    reading = telemetry_normalizer.normalize(
        {
            "latitude": -26.9,
            "longitude": -49.07,
            "rainfall_mm": 0,
            "water_level_m": 0,
            "hardware_implemented": True,
            "source": "real-sensor",
        }
    )
    assert reading.hardware_implemented is False
    assert reading.source == "simulation"
