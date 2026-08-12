"""
Constantes e regras puras do motor de risco — pesos, referências de
normalização, limiares de classificação e ações recomendadas.

Nada aqui depende de banco, rede ou I/O — só números e funções puras, para
ficar fácil de testar e auditar (mesmo espírito de transparência do motor
demonstrativo em americas_techguard_final_poc/src/risk_engine.py, de onde
vem RAINFALL_REFERENCE_MM).

IMPORTANTE: pesos, referências e limiares são valores demonstrativos de PoC
— não calibrados com dados reais de campo. Ver docs/motor-de-risco.md e
docs/limitacoes.md.
"""

from __future__ import annotations

# Pesos da fórmula de fusão — somam 1.0.
WEIGHT_HAND = 0.45
WEIGHT_RAINFALL = 0.30
WEIGHT_WATER_LEVEL = 0.20
WEIGHT_TREND = 0.05

# Chuva acumulada (mm) considerada "extrema" para normalização — mesmo valor
# de referência usado em americas_techguard_final_poc/src/risk_engine.py
# (RAINFALL_REFERENCE_MM), mantido para consistência entre as duas PoCs.
RAINFALL_REFERENCE_MM = 150.0

# Nível d'água (m) considerado crítico para normalização. Valor demonstrativo
# de PoC para a bacia do Itajaí em Blumenau — não é uma cota de alerta oficial
# da Defesa Civil.
WATER_LEVEL_REFERENCE_M = 3.0

# Variação de nível d'água (m, entre duas leituras) que empurra o fator de
# tendência para o extremo (1.0 = subindo forte, 0.0 = descendo forte).
# 0.5 é o centro neutro (nível estável ou tendência desconhecida).
TREND_NEUTRAL = 0.5
TREND_REFERENCE_DELTA_M = 0.5

# Confiança da análise — demonstrativa, não estatística. Cai quando o
# contexto espacial HAND não está disponível (fallback), porque a fusão
# passa a depender só de chuva + nível d'água + tendência.
CONFIDENCE_WITH_SPATIAL_CONTEXT = 0.95
CONFIDENCE_FALLBACK = 0.55

RISK_THRESHOLDS = [
    (0.25, "seguro"),
    (0.50, "atencao"),
    (0.75, "alerta"),
    (1.01, "critico"),  # 1.01 para incluir 1.0 na faixa crítica com <
]

RECOMMENDED_ACTIONS = {
    "seguro": "Nenhuma ação necessária. Manter monitoramento de rotina.",
    "atencao": "Acompanhar a evolução da chuva e do nível d'água nas próximas horas.",
    "alerta": "Monitorar área e preparar comunicação preventiva à população.",
    "critico": "Acionar protocolo de emergência da Defesa Civil e considerar evacuação preventiva.",
}


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def classify_risk(score: float) -> str:
    for threshold, label in RISK_THRESHOLDS:
        if score < threshold:
            return label
    return "critico"


def rainfall_factor(rainfall_mm: float) -> float:
    return clamp(rainfall_mm / RAINFALL_REFERENCE_MM)


def water_level_factor(water_level_m: float) -> float:
    return clamp(water_level_m / WATER_LEVEL_REFERENCE_M)


def trend_factor(water_level_m: float, previous_water_level_m: float | None) -> float:
    """
    0.5 = estável ou tendência desconhecida (sem leitura anterior).
    > 0.5 = nível subindo; < 0.5 = nível descendo.
    """
    if previous_water_level_m is None:
        return TREND_NEUTRAL
    delta = water_level_m - previous_water_level_m
    return clamp(TREND_NEUTRAL + (delta / TREND_REFERENCE_DELTA_M) * TREND_NEUTRAL)


def recommended_action(risk_level: str) -> str:
    return RECOMMENDED_ACTIONS[risk_level]
