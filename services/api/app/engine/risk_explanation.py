"""
Justificativa textual do motor de risco.

Gera uma frase explicando por que o motor chegou naquele nível de risco,
descrevendo cada fator em faixas qualitativas (baixo/moderado/elevado) em
vez de só devolver os números — é o que torna o motor "explicável".
"""

from __future__ import annotations


def _bucket(value: float, low_label: str, mid_label: str, high_label: str) -> str:
    if value >= 0.7:
        return high_label
    if value >= 0.4:
        return mid_label
    return low_label


def _hand_description(hand_class_label: str | None, hand_weight: float) -> str:
    if hand_class_label:
        return hand_class_label.lower()
    return _bucket(hand_weight, "baixa suscetibilidade HAND", "média suscetibilidade HAND", "alta suscetibilidade HAND")


def _rainfall_description(rainfall_factor: float) -> str:
    return _bucket(rainfall_factor, "chuva acumulada baixa", "chuva acumulada moderada", "chuva acumulada elevada")


def _water_level_description(water_level_factor: float, trend_factor: float) -> str:
    magnitude = _bucket(water_level_factor, "nível d'água baixo", "nível d'água moderado", "nível d'água elevado")
    if trend_factor >= 0.6:
        trend = "em crescimento"
    elif trend_factor <= 0.4:
        trend = "em queda"
    else:
        trend = "estável"
    return f"{magnitude} e {trend}"


def build_explanation(
    *,
    risk_level: str,
    hand_weight: float,
    rainfall_factor: float,
    water_level_factor: float,
    trend_factor: float,
    spatial_context_available: bool,
    hand_class_label: str | None = None,
) -> str:
    parts: list[str] = []

    if spatial_context_available:
        parts.append(_hand_description(hand_class_label, hand_weight))
    parts.append(_rainfall_description(rainfall_factor))
    parts.append(_water_level_description(water_level_factor, trend_factor))

    factors_text = f"{', '.join(parts[:-1])} e {parts[-1]}" if len(parts) > 1 else parts[0]

    sentence = f"A região apresenta {factors_text}, resultando em risco {risk_level}."

    if not spatial_context_available:
        sentence += (
            " Contexto espacial HAND não estava disponível para este ponto — "
            "avaliação considerou apenas chuva, nível d'água e tendência, "
            "com confiança reduzida."
        )

    return sentence
