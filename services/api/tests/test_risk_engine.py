"""Testes unitários do motor de risco — sem banco, sem rede."""

from app.engine import risk_engine
from app.schemas.risk import RiskEvaluationRequest


def _request(**overrides):
    defaults = dict(
        latitude=-26.9,
        longitude=-49.07,
        rainfall_mm=0,
        water_level_m=0,
    )
    defaults.update(overrides)
    return RiskEvaluationRequest(**defaults)


def test_score_never_below_zero_or_above_one():
    # rainfall_mm/water_level_m têm Field(ge=0) no schema — valores
    # negativos são rejeitados na validação, não neste teste. Aqui cobrimos
    # o intervalo de valores válidos, incluindo bem acima da referência de
    # normalização (deve saturar em 1.0, não estourar).
    cases = [
        _request(rainfall_mm=0, water_level_m=0, hand_class_id=3, hand_risk_weight=0.1),
        _request(rainfall_mm=1000, water_level_m=50, hand_class_id=0, hand_risk_weight=0.9, previous_water_level_m=0),
        _request(rainfall_mm=75, water_level_m=1.5),  # sem HAND — fallback
    ]

    for request in cases:
        result = risk_engine.evaluate(request)
        assert 0.0 <= result.risk_score <= 1.0


def test_critical_when_hand_rainfall_and_water_level_are_all_high():
    request = _request(
        rainfall_mm=140,
        water_level_m=2.8,
        previous_water_level_m=2.2,
        hand_class_id=0,
        hand_risk_weight=0.9,
        region="Itoupava Norte",
    )
    result = risk_engine.evaluate(request)
    assert result.risk_level == "critico"
    assert result.spatial_context_available is True


def test_safe_when_all_factors_are_low():
    request = _request(
        rainfall_mm=5,
        water_level_m=0.3,
        previous_water_level_m=0.3,
        hand_class_id=3,
        hand_risk_weight=0.1,
    )
    result = risk_engine.evaluate(request)
    assert result.risk_level == "seguro"


def test_fallback_works_without_hand():
    request = _request(rainfall_mm=50, water_level_m=1.0)  # sem hand_class_id/hand_risk_weight/region

    result = risk_engine.evaluate(request)

    assert result.spatial_context_available is False
    assert result.factors.hand_weight == 0.0
    assert 0.0 <= result.risk_score <= 1.0
    assert "HAND" in result.explanation
    assert "não estava disponível" in result.explanation


def test_fallback_has_lower_confidence_than_with_spatial_context():
    with_hand = risk_engine.evaluate(_request(rainfall_mm=50, water_level_m=1.0, hand_class_id=1, hand_risk_weight=0.6))
    without_hand = risk_engine.evaluate(_request(rainfall_mm=50, water_level_m=1.0))

    assert without_hand.confidence < with_hand.confidence


def test_explanation_changes_with_factors():
    low = risk_engine.evaluate(_request(rainfall_mm=5, water_level_m=0.2, hand_class_id=3, hand_risk_weight=0.1))
    high = risk_engine.evaluate(_request(rainfall_mm=140, water_level_m=2.9, hand_class_id=0, hand_risk_weight=0.9))

    assert low.explanation != high.explanation


def test_region_lookup_resolves_spatial_context_without_explicit_hand_fields():
    request = _request(rainfall_mm=90, water_level_m=1.8, region="Velha")

    result = risk_engine.evaluate(request)

    assert result.spatial_context_available is True
    assert result.factors.hand_weight == 0.6  # classe "Media suscetibilidade" mockada


def test_batch_evaluates_all_readings():
    requests = [
        _request(rainfall_mm=5, water_level_m=0.2, hand_class_id=3, hand_risk_weight=0.1),
        _request(rainfall_mm=140, water_level_m=2.9, hand_class_id=0, hand_risk_weight=0.9),
    ]
    results = risk_engine.evaluate_batch(requests)
    assert len(results) == 2
    assert results[0].risk_level == "seguro"
    assert results[1].risk_level == "critico"


def test_response_echoes_region_from_request():
    # F6: region passou a vir na resposta — o frontend usa isso em vez de
    # manter um mapa cenário->região duplicado à parte (ver Alertas.tsx).
    result = risk_engine.evaluate(_request(region="Itoupava Norte"))
    assert result.region == "Itoupava Norte"


def test_response_region_is_none_when_not_provided():
    result = risk_engine.evaluate(_request())
    assert result.region is None
