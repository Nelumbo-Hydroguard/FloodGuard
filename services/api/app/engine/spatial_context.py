"""
Contexto espacial HAND para o motor de risco — sem dependência obrigatória
de banco.

O motor de risco (risk_engine.py) recebe hand_class_id/hand_risk_weight já
resolvidos sempre que o cliente os informa diretamente no payload. Este
módulo só entra em ação quando o cliente manda um `region` (nome de bairro
simulado) em vez das classes já resolvidas — faz um lookup mockado, sem
tocar em PostGIS. Se nem `region` nem os campos HAND vierem, não há contexto
espacial disponível e o motor cai no fallback (ver risk_engine.py).

O mock usa as mesmas 4 classes reais do pipeline HAND de Blumenau
importadas na F2 (services/geo, db/migrations/003_hand_layers.sql) — não
inventa classe nova. A associação bairro → classe é ilustrativa (mesmo
espírito de americas_techguard_final_poc/src/hand_reference.py, que faz a
mesma ressalva): serve para contar uma história geográfica coerente na
demo, não é o raster HAND real recortado por bairro oficial.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class HandSpatialContext:
    hand_class_id: int
    hand_class_label: str
    hand_risk_weight: float


# Mesmas 4 classes de services/geo/scripts/export_to_postgis.py::HAND_CLASS_MAP
# (validadas na F2 contra a área real do raster de Blumenau).
HAND_CLASSES_BY_ID: dict[int, HandSpatialContext] = {
    0: HandSpatialContext(0, "Alta suscetibilidade", 0.9),
    1: HandSpatialContext(1, "Media suscetibilidade", 0.6),
    2: HandSpatialContext(2, "Baixa suscetibilidade", 0.3),
    3: HandSpatialContext(3, "Muito baixa suscetibilidade", 0.1),
}

# Bairros/regiões simuladas de Blumenau associadas a uma classe HAND para
# fins de demonstração — mesma lista de
# americas_techguard_final_poc/src/hand_reference.py::SIMULATED_REGION_HAND.
MOCK_REGION_TO_HAND_CLASS: dict[str, int] = {
    "Itoupava Norte": 0,
    "Velha": 1,
    "Centro": 1,
    "Garcia": 2,
    "Vale do Itajai (regiao ampliada)": 0,
}


def resolve_hand_class(class_id: int) -> HandSpatialContext | None:
    return HAND_CLASSES_BY_ID.get(class_id)


def lookup_mock_region(region: str) -> HandSpatialContext | None:
    class_id = MOCK_REGION_TO_HAND_CLASS.get(region)
    if class_id is None:
        return None
    return HAND_CLASSES_BY_ID[class_id]
