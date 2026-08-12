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
