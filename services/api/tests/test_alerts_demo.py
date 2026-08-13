"""Testes de /api/alerts/status, /demo e /demo/{id} (F7) — sem banco."""

from fastapi.testclient import TestClient

from app.main import app
from app.routers.scenarios import DEMO_SCENARIOS

client = TestClient(app)


def test_alerts_status_returns_simulation_source():
    response = client.get("/api/alerts/status")
    assert response.status_code == 200
    body = response.json()
    assert body["module"] == "alerts"
    assert body["status"] == "demo"
    assert body["source"] == "simulation"
    assert body["persistence"] is False
    assert "simulad" in body["message"].lower()


def test_demo_alerts_returns_one_per_scenario():
    response = client.get("/api/alerts/demo")
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "simulation"
    ids = {a["id"] for a in body["alerts"]}
    assert ids == set(DEMO_SCENARIOS.keys())


def test_demo_alerts_are_all_marked_simulated():
    alerts = client.get("/api/alerts/demo").json()["alerts"]
    for alert in alerts:
        assert alert["source"] == "simulation"
        assert alert["simulated"] is True
        assert alert["status"].startswith("simulated_")


def test_demo_alerts_never_claim_real_emission():
    """Nenhum texto pode sugerir emissão real da Defesa Civil."""
    alerts = client.get("/api/alerts/demo").json()["alerts"]
    forbidden = ["defesa civil emitiu", "alerta oficial", "ocorrência real"]
    for alert in alerts:
        text = f"{alert['title']} {alert['explanation']} {alert['recommended_action']}".lower()
        for phrase in forbidden:
            assert phrase not in text


def test_demo_alert_detail_matches_list_entry():
    alerts = client.get("/api/alerts/demo").json()["alerts"]
    critical = next(a for a in alerts if a["id"] == "critico")

    detail = client.get("/api/alerts/demo/critico").json()

    assert detail["risk_level"] == critical["risk_level"] == "critico"
    assert detail["region"] == critical["region"]


def test_demo_alert_detail_unknown_id_returns_404():
    response = client.get("/api/alerts/demo/nao-existe")
    assert response.status_code == 404
    assert "não existe" in response.json()["detail"]


def test_demo_alert_suggests_next_step_when_risky():
    critical = client.get("/api/alerts/demo/critico").json()
    safe = client.get("/api/alerts/demo/seguro").json()
    assert critical["suggested_next_step"] == "/telemetria"
    assert safe["suggested_next_step"] is None
