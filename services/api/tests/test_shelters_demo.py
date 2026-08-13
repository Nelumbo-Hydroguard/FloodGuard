"""Testes de /api/shelters/status e /demo (F7) — sem banco."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_shelters_status_returns_simulation_source():
    response = client.get("/api/shelters/status")
    assert response.status_code == 200
    body = response.json()
    assert body["module"] == "shelters"
    assert body["status"] == "demo"
    assert body["source"] == "simulation"
    assert body["persistence"] is False
    assert "simulad" in body["message"].lower()


def test_demo_shelters_returns_at_least_four():
    response = client.get("/api/shelters/demo")
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "simulation"
    assert len(body["shelters"]) >= 4


def test_demo_shelters_are_all_marked_simulated():
    shelters = client.get("/api/shelters/demo").json()["shelters"]
    for shelter in shelters:
        assert shelter["source"] == "simulation"
        assert shelter["simulated"] is True


def test_demo_shelters_occupancy_percent_matches_capacity_ratio():
    shelters = client.get("/api/shelters/demo").json()["shelters"]
    for shelter in shelters:
        if shelter["capacity_total"] == 0:
            continue
        expected = round(shelter["capacity_used"] / shelter["capacity_total"] * 100, 1)
        assert shelter["occupancy_percent"] == expected
        assert shelter["capacity_used"] <= shelter["capacity_total"]


def test_demo_shelters_cover_the_four_required_occupancy_profiles():
    shelters = client.get("/api/shelters/demo").json()["shelters"]
    statuses = {s["status"] for s in shelters}
    # baixa, média, quase lotado, indisponível — os 4 perfis pedidos na F7.
    assert "disponivel" in statuses
    assert "moderado" in statuses
    assert "quase_lotado" in statuses
    assert "indisponivel" in statuses


def test_unavailable_shelter_has_zero_usable_occupancy_and_explanatory_note():
    shelters = client.get("/api/shelters/demo").json()["shelters"]
    unavailable = next(s for s in shelters if s["status"] == "indisponivel")
    assert unavailable["capacity_used"] == 0
    assert len(unavailable["notes"]) > 0


def test_demo_shelters_names_are_generic_not_specific_institutions():
    """Nomes devem sinalizar 'simulado' — não afirmar vínculo com
    instituição real específica sem confirmação."""
    shelters = client.get("/api/shelters/demo").json()["shelters"]
    for shelter in shelters:
        assert "simulad" in shelter["name"].lower()
