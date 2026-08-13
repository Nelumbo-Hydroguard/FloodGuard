"""
Rotas de abrigos — F7: abrigos simulados para demonstração.

Nenhum abrigo aqui está vinculado a uma instituição real confirmada — nomes
genéricos de propósito ("Abrigo Municipal Simulado", não o nome de uma
escola/ginásio específico). Localizados nas mesmas 4 regiões simuladas
usadas pelos cenários de risco (app.routers.scenarios.DEMO_SCENARIOS) e
pelo lookup HAND mockado (app.engine.spatial_context) — mesma geografia de
demonstração em todo o produto, não coordenadas soltas. Sem persistência:
lista fixa em memória; a tabela `shelters` (002_core_tables.sql) continua
vazia.
"""

from fastapi import APIRouter

from app.schemas.shelters import DemoShelter, DemoSheltersResponse

router = APIRouter(prefix="/api/shelters", tags=["shelters"])


@router.get("/status")
def shelters_status():
    return {
        "module": "shelters",
        "status": "demo",
        "source": "simulation",
        "persistence": False,
        "message": (
            "Abrigos simulados para demonstração — nomes genéricos, sem "
            "vínculo confirmado com instituição real. Nada é persistido em "
            "banco; ver GET /api/shelters/demo."
        ),
    }


def _shelter(
    id_: str,
    name: str,
    region: str,
    address: str,
    lat: float,
    lon: float,
    capacity_total: int,
    capacity_used: int,
    status: str,
    notes: str,
) -> DemoShelter:
    occupancy_percent = round(capacity_used / capacity_total * 100, 1) if capacity_total else 0.0
    return DemoShelter(
        id=id_,
        name=name,
        region=region,
        address=address,
        latitude=lat,
        longitude=lon,
        capacity_total=capacity_total,
        capacity_used=capacity_used,
        occupancy_percent=occupancy_percent,
        status=status,
        notes=notes,
    )


# Coordenadas reaproveitadas das mesmas 4 regiões de
# app.routers.scenarios.DEMO_SCENARIOS / app.engine.spatial_context — liga
# abrigos, alertas e mapa na mesma geografia simulada, não pontos soltos.
DEMO_SHELTERS: list[DemoShelter] = [
    _shelter(
        "sim-abrigo-centro",
        "Abrigo Municipal Simulado — Centro",
        "Centro",
        "Endereço simulado, região Centro, Blumenau/SC",
        -26.9194,
        -49.0661,
        150,
        30,
        "disponivel",
        "Ocupação baixa — dados fictícios para demonstração.",
    ),
    _shelter(
        "sim-abrigo-velha",
        "Ponto de Apoio Simulado — Velha",
        "Velha",
        "Endereço simulado, região Velha, Blumenau/SC",
        -26.925,
        -49.073,
        200,
        110,
        "moderado",
        "Ocupação em nível médio — dados fictícios para demonstração.",
    ),
    _shelter(
        "sim-abrigo-itoupava-norte",
        "Abrigo Comunitário Simulado — Itoupava Norte",
        "Itoupava Norte",
        "Endereço simulado, região Itoupava Norte, Blumenau/SC",
        -26.898,
        -49.081,
        80,
        76,
        "quase_lotado",
        "Ocupação próxima da capacidade máxima — dados fictícios para demonstração.",
    ),
    _shelter(
        "sim-abrigo-garcia",
        "Unidade Temporária Simulada — Garcia",
        "Garcia",
        "Endereço simulado, região Garcia, Blumenau/SC",
        -26.914,
        -49.077,
        60,
        0,
        "indisponivel",
        "Indisponível — manutenção simulada, sem recepção no momento.",
    ),
]


@router.get("/demo", response_model=DemoSheltersResponse)
def demo_shelters():
    return DemoSheltersResponse(shelters=DEMO_SHELTERS)
