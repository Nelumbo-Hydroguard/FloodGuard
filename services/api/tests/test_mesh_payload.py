"""Testes unitários do payload UniMesh/LoRa simulado — sem rádio, sem socket."""

from app.engine import mesh_payload, risk_engine
from app.schemas.risk import RiskEvaluationRequest


def _risk_result(**overrides):
    defaults = dict(latitude=-26.9, longitude=-49.07, rainfall_mm=90, water_level_m=1.8, hand_class_id=1, hand_risk_weight=0.6)
    defaults.update(overrides)
    return risk_engine.evaluate(RiskEvaluationRequest(**defaults))


def test_mesh_payload_always_marks_implemented_false():
    payload = mesh_payload.build_mesh_payload(_risk_result(), region="Velha")
    assert payload.implemented is False


def test_mesh_payload_source_is_simulation():
    payload = mesh_payload.build_mesh_payload(_risk_result(), region="Velha")
    assert payload.source == "simulation"


def test_mesh_payload_carries_risk_level_and_region():
    result = _risk_result(rainfall_mm=140, water_level_m=2.9, hand_class_id=0, hand_risk_weight=0.9)
    payload = mesh_payload.build_mesh_payload(result, region="Itoupava Norte")

    assert payload.risk_level == "critico"
    assert payload.region == "Itoupava Norte"
    assert "CRITICO" in payload.compact_payload
    assert "Itoupava Norte" in payload.compact_payload


def test_mesh_payload_never_marks_implemented_true_even_for_critical_risk():
    result = _risk_result(rainfall_mm=150, water_level_m=3.0, hand_class_id=0, hand_risk_weight=0.9, previous_water_level_m=0)
    payload = mesh_payload.build_mesh_payload(result, region="Itoupava Norte")
    assert payload.implemented is False
