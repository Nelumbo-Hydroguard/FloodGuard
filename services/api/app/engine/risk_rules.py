"""
Constantes e regras puras do motor de risco — pesos, referências de
normalização, limiares de classificação e ações operacionais recomendadas.

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

# AÇÃO OPERACIONAL RECOMENDADA — texto dirigido ao OPERADOR / Defesa Civil,
# nunca ao cidadão. É instrução de plantão: o que a equipe faz agora.
#
# O que a plataforma NÃO faz aqui, por decisão de projeto: determinar
# evacuação, ordenar deslocamento ou garantir segurança. O FloodGuard é um
# apoio à decisão — não tem autoridade para nenhuma dessas coisas. No nível
# crítico ele aponta o plano de contingência e devolve a decisão a quem a
# tem ("conforme validação da Defesa Civil"). O texto anterior deste nível
# dizia "considerar evacuação preventiva", o que colocava o motor decidindo
# evacuação sozinho.
#
# A orientação equivalente para o CIDADÃO é outra camada, demonstrativa e
# só no frontend — apps/web/src/lib/alertMessaging.ts::getPublicGuidance.
# Não trafega por este contrato de API nesta fase.
RECOMMENDED_ACTIONS = {
    "seguro": "Manter o acompanhamento da região e das fontes oficiais.",
    "atencao": "Acompanhar a evolução das condições e manter a equipe atenta a novas atualizações.",
    "alerta": (
        "Reforçar o monitoramento da área, verificar as informações "
        "disponíveis e preparar a comunicação preventiva à população."
    ),
    "critico": (
        "Priorizar a verificação da área e executar as medidas previstas no "
        "plano de contingência, conforme validação da Defesa Civil."
    ),
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
    """Ação OPERACIONAL (Defesa Civil / operador) para o nível informado."""
    return RECOMMENDED_ACTIONS[risk_level]
