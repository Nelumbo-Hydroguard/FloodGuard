"""
Motor de risco explicável do FloodGuard.

Combina contexto espacial HAND (Período 6, ver docs/metodologia-hand.md)
com chuva acumulada, nível d'água e tendência temporal numa fórmula de
fusão simples e auditável — não um modelo estatístico treinado.

Créditos: o padrão de fusão espacial + risco explicável nasceu no
`techguard-sentinela` (autoria de João Benvenutti, reaproveitado sob acordo
de equipe — ver docs/autoria-licenca.md). A fórmula implementada aqui é uma
versão simplificada e própria da F3 (4 fatores, pesos fixos), não uma cópia
do motor NDVI/NDBI/Tc original do sentinela.

IMPORTANTE (PoC, não operacional):
    score = 0.45*hand_weight + 0.30*rainfall_factor + 0.20*water_level_factor + 0.05*trend_factor

Pesos e referências de normalização são demonstrativos — não calibrados com
dados reais de campo. Não substitui a análise da Defesa Civil. Ver
docs/motor-de-risco.md e docs/limitacoes.md.
"""

from __future__ import annotations

from datetime import datetime, timezone

from app.engine import risk_rules
from app.engine.risk_explanation import build_explanation
from app.engine.spatial_context import lookup_mock_region, resolve_hand_class
from app.schemas.risk import RiskEvaluationRequest, RiskEvaluationResponse, RiskFactors


def _resolve_spatial_context(request: RiskEvaluationRequest) -> tuple[float | None, str | None]:
    """Retorna (hand_risk_weight, hand_class_label) ou (None, None) se não
    houver contexto espacial disponível — nessa ordem de prioridade:

    1. hand_risk_weight informado explicitamente no payload;
    2. hand_class_id informado — resolvido contra as classes HAND conhecidas;
    3. region informada — lookup mockado (sem banco), ver spatial_context.py;
    4. nenhum dos três — sem contexto espacial, motor cai no fallback.
    """
    if request.hand_risk_weight is not None:
        label = None
        if request.hand_class_id is not None:
            resolved = resolve_hand_class(request.hand_class_id)
            label = resolved.hand_class_label if resolved else None
        return request.hand_risk_weight, label

    if request.hand_class_id is not None:
        resolved = resolve_hand_class(request.hand_class_id)
        if resolved is not None:
            return resolved.hand_risk_weight, resolved.hand_class_label

    if request.region is not None:
        resolved = lookup_mock_region(request.region)
        if resolved is not None:
            return resolved.hand_risk_weight, resolved.hand_class_label

    return None, None


def evaluate(request: RiskEvaluationRequest) -> RiskEvaluationResponse:
    hand_weight, hand_class_label = _resolve_spatial_context(request)
    spatial_context_available = hand_weight is not None

    rainfall = risk_rules.rainfall_factor(request.rainfall_mm)
    water_level = risk_rules.water_level_factor(request.water_level_m)
    trend = risk_rules.trend_factor(request.water_level_m, request.previous_water_level_m)

    if spatial_context_available:
        score = (
            risk_rules.WEIGHT_HAND * hand_weight
            + risk_rules.WEIGHT_RAINFALL * rainfall
            + risk_rules.WEIGHT_WATER_LEVEL * water_level
            + risk_rules.WEIGHT_TREND * trend
        )
        confidence = risk_rules.CONFIDENCE_WITH_SPATIAL_CONTEXT
    else:
        # Fallback: sem HAND, redistribui o peso do HAND proporcionalmente
        # entre chuva/nível d'água/tendência (mantém a soma dos pesos em 1.0
        # e a mesma prioridade relativa entre os três fatores restantes).
        remaining_weight = risk_rules.WEIGHT_RAINFALL + risk_rules.WEIGHT_WATER_LEVEL + risk_rules.WEIGHT_TREND
        score = (
            (risk_rules.WEIGHT_RAINFALL / remaining_weight) * rainfall
            + (risk_rules.WEIGHT_WATER_LEVEL / remaining_weight) * water_level
            + (risk_rules.WEIGHT_TREND / remaining_weight) * trend
        )
        hand_weight = 0.0
        confidence = risk_rules.CONFIDENCE_FALLBACK

    score = risk_rules.clamp(score)
    risk_level = risk_rules.classify_risk(score)

    explanation = build_explanation(
        risk_level=risk_level,
        hand_weight=hand_weight,
        rainfall_factor=rainfall,
        water_level_factor=water_level,
        trend_factor=trend,
        spatial_context_available=spatial_context_available,
        hand_class_label=hand_class_label,
    )

    return RiskEvaluationResponse(
        risk_level=risk_level,
        risk_score=round(score, 4),
        confidence=confidence,
        spatial_context_available=spatial_context_available,
        factors=RiskFactors(
            hand_weight=round(hand_weight, 4),
            rainfall_factor=round(rainfall, 4),
            water_level_factor=round(water_level, 4),
            trend_factor=round(trend, 4),
        ),
        explanation=explanation,
        recommended_action=risk_rules.recommended_action(risk_level),
        station_id=request.station_id,
        timestamp=request.timestamp or datetime.now(timezone.utc),
    )


def evaluate_batch(requests: list[RiskEvaluationRequest]) -> list[RiskEvaluationResponse]:
    return [evaluate(request) for request in requests]
