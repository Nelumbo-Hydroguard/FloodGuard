"""
Testes de /api/geo/demo-map e /api/geo/demo-points (F6).

demo-points nunca toca banco — testável sem ressalva. demo-map tenta
PostGIS de verdade; nesta suíte não há banco disponível (nem deveria
precisar), então o teste aceita os dois caminhos válidos (postgis ou
fallback) em vez de travar num deles — o que importa é nunca 500 e sempre
ter as chaves esperadas.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# Endpoints geo que leem PostGIS de verdade. Sem banco no ar eles devem
# responder 503 controlado (F6.2.1) — nunca 500 cru, nunca vazando
# credencial. Com banco no ar respondem 200 (ou 404, no caso do município
# quando a tabela está vazia).
_POSTGIS_BACKED_ENDPOINTS = [
    "/api/geo/municipality/blumenau",
    "/api/geo/basins/blumenau",
    "/api/geo/hand-zones",
    "/api/geo/hand-zones/summary",
    "/api/geo/point-risk-context?lat=-26.918&lon=-49.066",
]


def test_demo_map_never_returns_500():
    response = client.get("/api/geo/demo-map")
    assert response.status_code == 200


def test_demo_map_has_expected_shape_regardless_of_source():
    body = client.get("/api/geo/demo-map").json()
    assert body["source"] in ("postgis", "static_fallback")
    assert body["status"] in ("ok", "degraded")
    assert isinstance(body["boundary_available"], bool)
    assert isinstance(body["hand_zones_available"], bool)
    assert isinstance(body["stats"], list)
    assert len(body["stats"]) == 4
    assert isinstance(body["message"], str) and body["message"]


def test_demo_map_never_leaks_database_credentials_in_message():
    body = client.get("/api/geo/demo-map").json()
    assert "floodguard" not in body["message"].lower()
    assert "password" not in body["message"].lower()


def test_demo_points_returns_three_fixed_points():
    response = client.get("/api/geo/demo-points")
    assert response.status_code == 200
    body = response.json()
    assert body["source"] == "simulation"
    points = body["points"]
    assert len(points) == 3
    ids = {p["id"] for p in points}
    assert ids == {"seguro", "alerta", "critico"}


def test_demo_points_risk_levels_match_scenario_labels():
    points = client.get("/api/geo/demo-points").json()["points"]
    by_id = {p["id"]: p for p in points}
    assert by_id["seguro"]["risk_level"] == "seguro"
    assert by_id["alerta"]["risk_level"] == "alerta"
    assert by_id["critico"]["risk_level"] == "critico"


def test_demo_points_have_valid_coordinates_and_explanation():
    points = client.get("/api/geo/demo-points").json()["points"]
    for point in points:
        assert -90 <= point["lat"] <= 90
        assert -180 <= point["lon"] <= 180
        assert isinstance(point["explanation"], str) and point["explanation"]
        assert isinstance(point["name"], str) and point["name"]


# --- /api/geo/status honesto (F6.2.1) ------------------------------------
#
# Até a F6.2 este endpoint devolvia "connected" fixo, mesmo sem banco — a
# auditoria classificou isso como bloqueador de honestidade. Os testes
# abaixo valem nos dois ambientes (com e sem PostGIS): o que se garante é
# que o status *corresponde à realidade* e que o endpoint nunca quebra.


def test_geo_status_never_returns_500_without_postgis():
    response = client.get("/api/geo/status")
    assert response.status_code == 200


def test_geo_status_has_expected_shape():
    body = client.get("/api/geo/status").json()
    for key in ["module", "status", "postgis_available", "hand_zones_loaded", "source", "message"]:
        assert key in body, f"chave ausente na resposta de /api/geo/status: {key}"
    assert body["module"] == "geo"
    assert body["status"] in ("connected", "degraded", "unavailable")
    assert isinstance(body["postgis_available"], bool)
    assert isinstance(body["hand_zones_loaded"], int)


def test_geo_status_never_claims_connected_without_postgis():
    """O coração da correção: 'connected' só pode aparecer se o banco
    respondeu E tem zonas HAND carregadas."""
    body = client.get("/api/geo/status").json()

    if body["status"] == "connected":
        assert body["postgis_available"] is True
        assert body["hand_zones_loaded"] > 0
        assert body["source"] == "postgis"
    else:
        # Sem banco (ou banco vazio) o endpoint não pode se dizer conectado.
        assert body["status"] in ("degraded", "unavailable")
        assert not (body["postgis_available"] and body["hand_zones_loaded"] > 0)


def test_geo_status_is_consistent_with_demo_map_source():
    """status e demo-map não podem se contradizer — foi exatamente a
    contradição que a auditoria pegou (status dizia 'connected' enquanto
    demo-map caía em static_fallback)."""
    status = client.get("/api/geo/status").json()
    demo_map = client.get("/api/geo/demo-map").json()

    if demo_map["source"] == "static_fallback":
        assert status["status"] != "connected"
    if status["status"] == "connected":
        assert demo_map["source"] == "postgis"


def test_geo_status_never_leaks_credentials():
    body = client.get("/api/geo/status").json()
    message = body["message"].lower()
    assert "password" not in message
    assert "floodguard:" not in message  # user:senha da DATABASE_URL
    assert "postgresql://" not in message
    assert "psycopg" not in message


# --- Endpoints PostGIS: 503 controlado em vez de 500 cru (F6.2.1) --------


def test_postgis_endpoints_never_return_500():
    """Sem banco, esses endpoints devem devolver 503 (indisponibilidade
    honesta), não 500 (bug). Com banco, 200/404 são aceitáveis."""
    for endpoint in _POSTGIS_BACKED_ENDPOINTS:
        response = client.get(endpoint)
        assert response.status_code != 500, f"{endpoint} devolveu 500 cru"
        assert response.status_code in (200, 404, 503), f"{endpoint} devolveu {response.status_code}"


def test_postgis_endpoints_give_actionable_message_when_unavailable():
    for endpoint in _POSTGIS_BACKED_ENDPOINTS:
        response = client.get(endpoint)
        if response.status_code != 503:
            continue
        detail = response.json()["detail"]
        assert "PostGIS" in detail
        assert "/api/geo/demo-map" in detail, "mensagem deve apontar o fallback da demo"


def test_postgis_endpoints_never_leak_credentials_in_error():
    for endpoint in _POSTGIS_BACKED_ENDPOINTS:
        response = client.get(endpoint)
        if response.status_code != 503:
            continue
        detail = response.json()["detail"].lower()
        assert "password" not in detail
        assert "floodguard:" not in detail
        assert "psycopg" not in detail
        assert "localhost:5432" not in detail
