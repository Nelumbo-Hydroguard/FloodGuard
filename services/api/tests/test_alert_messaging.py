"""
Testes das AÇÕES OPERACIONAIS do motor de risco.

Guardam uma regra de produto, não de implementação: o FloodGuard não tem
autoridade para determinar evacuação. O texto do nível crítico já disse
"considerar evacuação preventiva" — estes testes existem para que isso não
volte por descuido.

A camada de ORIENTAÇÃO À POPULAÇÃO é demonstrativa e vive só no frontend
(apps/web/src/lib/alertMessaging.ts, coberta por
apps/web/src/lib/__tests__/alertMessaging.test.ts). Ela não trafega por
este contrato de API nesta fase — por isso não é testada aqui.
"""

from typing import get_args

import pytest
from fastapi.testclient import TestClient

from app.engine import risk_rules
from app.main import app
from app.routers.scenarios import DEMO_SCENARIOS
from app.schemas.common import RiskLevel

client = TestClient(app)

ALL_LEVELS = ["seguro", "atencao", "alerta", "critico"]

# Ordens e garantias que o motor não pode emitir por conta própria.
FORBIDDEN_AUTOMATIC = [
    "evacue",
    "evacuar",
    "evacuação",
    "ordenar",
    "garantir segurança",
    "garantimos",
    "risco de morte",
]


def test_all_levels_have_operational_recommendation():
    assert set(risk_rules.RECOMMENDED_ACTIONS) == set(ALL_LEVELS)
    for level in ALL_LEVELS:
        action = risk_rules.recommended_action(level)
        assert isinstance(action, str)
        assert len(action) > 20


def test_levels_match_risk_level_contract():
    """Os 4 níveis das ações são exatamente os do schema — sem 5º nível.

    RiskLevel é um Literal, não Enum: os valores saem de get_args().
    """
    assert set(risk_rules.RECOMMENDED_ACTIONS) == set(get_args(RiskLevel))


def test_no_level_repeats_another_levels_action():
    actions = [risk_rules.recommended_action(level) for level in ALL_LEVELS]
    assert len(set(actions)) == len(ALL_LEVELS)


@pytest.mark.parametrize("level", ALL_LEVELS)
def test_no_automatic_evacuation_order(level):
    """Nenhuma ação automática ordena evacuação nem promete segurança."""
    action = risk_rules.recommended_action(level).lower()
    for phrase in FORBIDDEN_AUTOMATIC:
        assert phrase not in action, f"'{phrase}' em RECOMMENDED_ACTIONS['{level}']"


def test_critical_action_defers_to_defesa_civil():
    """O crítico aponta o plano de contingência e devolve a decisão a quem
    tem autoridade — não decide sozinho."""
    action = risk_rules.recommended_action("critico").lower()
    assert "plano de contingência" in action
    assert "defesa civil" in action


def test_safe_action_never_promises_absence_of_risk():
    """'Nenhuma ação necessária' era falsa garantia: o plantão nunca fica
    sem ação, ele mantém acompanhamento."""
    action = risk_rules.recommended_action("seguro").lower()
    assert "nenhuma ação necessária" not in action
    assert "sem risco" not in action
    assert "acompanhamento" in action


@pytest.mark.parametrize("level", ALL_LEVELS)
def test_tone_is_not_sensationalist(level):
    action = risk_rules.recommended_action(level)
    assert "!" not in action
    assert not any(word.isupper() and len(word) > 3 for word in action.split())


def test_unknown_level_raises_instead_of_guessing():
    """Nível fora do contrato é erro de programação — melhor estourar do
    que devolver silenciosamente a ação de 'seguro' e subestimar risco."""
    with pytest.raises(KeyError):
        risk_rules.recommended_action("emergencia")


@pytest.mark.parametrize("alert_id", list(DEMO_SCENARIOS))
def test_demo_alerts_expose_operational_action_only(alert_id):
    """A API continua devolvendo `recommended_action` (contrato intacto) e
    esse texto é o operacional — nunca uma ordem ao cidadão."""
    alert = client.get(f"/api/alerts/demo/{alert_id}").json()
    action = alert["recommended_action"]
    assert action == risk_rules.recommended_action(alert["risk_level"])
    for phrase in FORBIDDEN_AUTOMATIC:
        assert phrase not in action.lower()


def test_mesh_payload_marks_action_as_operational():
    """O payload UniMesh demonstrativo pode carregar a ação, mas a nota
    precisa dizer que ela não é mensagem pronta ao cidadão."""
    response = client.post(
        "/api/telemetry/mesh-payload",
        json=DEMO_SCENARIOS["critico"].model_dump(mode="json"),
    )
    assert response.status_code == 200
    payload = response.json()

    note = payload["note"].lower()
    assert "operacional" in note
    assert "cidadão" in note

    # Protocolo inalterado: compact_payload segue só nível + região, sem
    # texto de mensagem embutido.
    assert payload["compact_payload"].startswith("FG|")
    assert payload["recommended_action"] not in payload["compact_payload"]
