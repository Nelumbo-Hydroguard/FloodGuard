"""Testes de integração da API — via TestClient, sem banco (endpoints de
risco/telemetria/cenários não dependem de PostGIS)."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_risk_status_endpoint():
    response = client.get("/api/risk/status")
    assert response.status_code == 200
    assert response.json()["module"] == "risk"


def test_risk_evaluate_endpoint_returns_200_with_expected_shape():
    response = client.post(
        "/api/risk/evaluate",
        json={
            "latitude": -26.9,
            "longitude": -49.07,
            "rainfall_mm": 90,
            "water_level_m": 1.8,
            "previous_water_level_m": 1.5,
            "hand_class_id": 1,
            "hand_risk_weight": 0.6,
        },
    )
    assert response.status_code == 200
    body = response.json()
    for key in ["risk_level", "risk_score", "confidence", "spatial_context_available", "factors", "explanation", "recommended_action"]:
        assert key in body
    assert 0.0 <= body["risk_score"] <= 1.0


def test_risk_evaluate_endpoint_rejects_missing_required_fields():
    response = client.post("/api/risk/evaluate", json={"latitude": -26.9, "longitude": -49.07})
    assert response.status_code == 422


def test_risk_evaluate_batch_endpoint():
    response = client.post(
        "/api/risk/evaluate-batch",
        json={
            "readings": [
                {"latitude": -26.9, "longitude": -49.07, "rainfall_mm": 5, "water_level_m": 0.2, "hand_class_id": 3, "hand_risk_weight": 0.1},
                {"latitude": -26.9, "longitude": -49.07, "rainfall_mm": 140, "water_level_m": 2.9, "hand_class_id": 0, "hand_risk_weight": 0.9},
            ]
        },
    )
    assert response.status_code == 200
    results = response.json()["results"]
    assert len(results) == 2
    assert results[0]["risk_level"] == "seguro"
    assert results[1]["risk_level"] == "critico"


def test_scenarios_demo_returns_three_fixed_scenarios():
    response = client.get("/api/scenarios/demo")
    assert response.status_code == 200
    scenarios = response.json()["scenarios"]
    assert set(scenarios.keys()) == {"seguro", "alerta", "critico"}
    assert scenarios["seguro"]["risk_level"] == "seguro"
    assert scenarios["alerta"]["risk_level"] == "alerta"
    assert scenarios["critico"]["risk_level"] == "critico"


def test_telemetry_normalize_endpoint():
    response = client.post(
        "/api/telemetry/normalize",
        json={"latitude": -26.9, "longitude": -49.07, "rainfall_mm": 20, "water_level_m": 0.8},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["rainfall_mm"] == 20
    assert body["source"] == "simulation"


def test_telemetry_normalize_endpoint_rejects_incomplete_payload():
    response = client.post("/api/telemetry/normalize", json={"latitude": -26.9})
    assert response.status_code == 422


def test_telemetry_mesh_payload_endpoint_always_simulated():
    response = client.post(
        "/api/telemetry/mesh-payload",
        json={
            "latitude": -26.9,
            "longitude": -49.07,
            "rainfall_mm": 140,
            "water_level_m": 2.9,
            "hand_class_id": 0,
            "hand_risk_weight": 0.9,
            "region": "Itoupava Norte",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["implemented"] is False
    assert body["source"] == "simulation"
    assert body["risk_level"] == "critico"
