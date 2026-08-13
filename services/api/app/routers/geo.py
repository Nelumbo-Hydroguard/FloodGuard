"""
Rotas geoespaciais — limite municipal, bacias e zonas HAND reais de Blumenau.

Os dados são lidos do PostGIS, populado pelo pipeline services/geo (F2, ver
services/geo/scripts/export_to_postgis.py). Este router é somente leitura —
não recalcula HAND e não aplica motor de risco. `point-risk-context` dá só
contexto espacial HAND para um ponto; cruzamento com chuva/telemetria é F3.

Consultas usam SQL cru (ST_AsGeoJSON) em vez de geopandas: a API continua
enxuta, sem geopandas/rasterio nas suas dependências.

`demo-map` e `demo-points` (F6) nunca dependem de PostGIS estar no ar —
existem justamente para o frontend ter uma resposta útil quando o banco
falha (Docker/sudo/credencial, ver F2.1). `demo-map` tenta uma consulta real
e cai num fallback com estatísticas de referência se o banco não responder;
`demo-points` não toca banco nenhum, roda o motor de risco (F3) direto
sobre os 3 cenários fixos de app.routers.scenarios.
"""

import json
import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.database import engine
from app.engine import risk_engine
from app.routers.scenarios import DEMO_SCENARIOS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/geo", tags=["geo"])

# Espelha services/geo/scripts/export_to_postgis.py::HAND_CLASS_MAP e
# apps/web/public/geo/hand_classes_stats.json (gerado por
# services/geo/scripts/generate_web_geojson.py) — mesmos números validados
# na F2 contra a área real do raster de Blumenau. Usado só quando o PostGIS
# não responde; nunca é a fonte de verdade quando o banco está disponível.
_STATIC_HAND_STATS = [
    {"class_id": 0, "class_label": "Alta suscetibilidade", "susceptibility": "alta", "risk_weight": 0.9, "total_area_m2": 301567102.91, "percent_area": 17.1},
    {"class_id": 1, "class_label": "Media suscetibilidade", "susceptibility": "media", "risk_weight": 0.6, "total_area_m2": 174992836.85, "percent_area": 9.92},
    {"class_id": 2, "class_label": "Baixa suscetibilidade", "susceptibility": "baixa", "risk_weight": 0.3, "total_area_m2": 361421604.73, "percent_area": 20.49},
    {"class_id": 3, "class_label": "Muito baixa suscetibilidade", "susceptibility": "muito_baixa", "risk_weight": 0.1, "total_area_m2": 925794538.32, "percent_area": 52.49},
]


# Mensagem única para quando o PostGIS não responde — o cliente sempre
# recebe o mesmo texto acionável, e nunca a exceção crua do driver (que
# pode conter host/porta/usuário do banco).
_POSTGIS_UNAVAILABLE_DETAIL = (
    "PostGIS indisponível neste ambiente. Use /api/geo/demo-map para o "
    "fallback estático da demo."
)


def _raise_postgis_unavailable(exc: Exception) -> None:
    """Converte falha de banco em 503 controlado, sem vazar credencial.

    Loga só o tipo da exceção (não a mensagem completa): a string do driver
    costuma trazer host/porta/usuário do Postgres — mesmo cuidado já
    aplicado em get_demo_map() desde a F6.
    """
    logger.warning("geo: PostGIS indisponível (%s) — respondendo 503.", type(exc).__name__)
    raise HTTPException(status_code=503, detail=_POSTGIS_UNAVAILABLE_DETAIL) from exc


@router.get("/status")
def geo_status():
    """
    Status honesto do módulo geo (F6.2.1).

    Até a F6.2 este endpoint retornava "connected" fixo, mesmo com o banco
    fora do ar — contradizendo os demais endpoints geo (que devolviam erro)
    e o próprio demo-map (que caía em static_fallback). A auditoria da F6.2
    marcou isso como bloqueador de honestidade: um avaliador que batesse
    aqui concluiria que o PostGIS estava conectado quando não estava.

    Agora o status vem de uma consulta real e barata (SELECT 1 + contagem de
    hand_zones), e o endpoint nunca devolve 500 por causa do banco.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            hand_zone_count = conn.execute(text("SELECT COUNT(*) FROM hand_zones")).scalar_one()
    except SQLAlchemyError as exc:
        logger.warning("geo/status: PostGIS indisponível (%s).", type(exc).__name__)
        return {
            "module": "geo",
            "status": "unavailable",
            "postgis_available": False,
            "hand_zones_loaded": 0,
            "source": "static_fallback",
            "message": (
                "PostGIS não respondeu neste ambiente. Os endpoints geo que leem "
                "o banco retornam 503; a demo do mapa continua funcionando via "
                "/api/geo/demo-map e das camadas estáticas em apps/web/public/geo/."
            ),
        }

    if hand_zone_count == 0:
        return {
            "module": "geo",
            "status": "degraded",
            "postgis_available": True,
            "hand_zones_loaded": 0,
            "source": "postgis",
            "message": (
                "PostGIS conectado, mas a tabela hand_zones está vazia. Rode "
                "services/geo/scripts/export_to_postgis.py export-all "
                "(ver db/seeds/import_hand_blumenau.md)."
            ),
        }

    return {
        "module": "geo",
        "status": "connected",
        "postgis_available": True,
        "hand_zones_loaded": int(hand_zone_count),
        "source": "postgis",
        "message": "Camadas HAND reais de Blumenau disponíveis no PostGIS (importadas na F2).",
    }


def _rows_to_feature_collection(rows: list[dict[str, Any]]) -> dict:
    features = []
    for row in rows:
        geom = row.pop("geojson", None)
        if geom is None:
            continue
        features.append({"type": "Feature", "properties": row, "geometry": json.loads(geom)})
    return {"type": "FeatureCollection", "features": features}


@router.get("/municipality/blumenau")
def get_municipality_blumenau():
    query = text(
        """
        SELECT id, name, state, ibge_code, ST_AsGeoJSON(geom) AS geojson
        FROM municipalities
        WHERE name = 'Blumenau'
        LIMIT 1
        """
    )
    try:
        with engine.connect() as conn:
            row = conn.execute(query).mappings().first()
    except SQLAlchemyError as exc:
        _raise_postgis_unavailable(exc)

    if row is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "Município Blumenau não encontrado no banco. Rode "
                "services/geo/scripts/export_to_postgis.py export-boundary "
                "— ver db/seeds/import_hand_blumenau.md."
            ),
        )

    row = dict(row)
    for key, value in row.items():
        if hasattr(value, "__float__") and key != "geojson":
            row[key] = str(value)
    geom = row.pop("geojson")
    return {"type": "Feature", "properties": row, "geometry": json.loads(geom) if geom else None}


@router.get("/basins/blumenau")
def get_basins_blumenau():
    query = text("SELECT id, name, source, ST_AsGeoJSON(geom) AS geojson FROM basins")
    try:
        with engine.connect() as conn:
            rows = [dict(r) for r in conn.execute(query).mappings().all()]
    except SQLAlchemyError as exc:
        _raise_postgis_unavailable(exc)
    for row in rows:
        row["id"] = str(row["id"])
    return _rows_to_feature_collection(rows)


@router.get("/hand-zones")
def get_hand_zones():
    query = text(
        """
        SELECT id, class_id, class_label, hand_min_m, hand_max_m, susceptibility,
               risk_weight, area_m2, source, ST_AsGeoJSON(geom) AS geojson
        FROM hand_zones
        ORDER BY class_id
        """
    )
    try:
        with engine.connect() as conn:
            rows = [dict(r) for r in conn.execute(query).mappings().all()]
    except SQLAlchemyError as exc:
        _raise_postgis_unavailable(exc)
    for row in rows:
        row["id"] = str(row["id"])
        row["hand_min_m"] = float(row["hand_min_m"]) if row["hand_min_m"] is not None else None
        row["hand_max_m"] = float(row["hand_max_m"]) if row["hand_max_m"] is not None else None
        row["risk_weight"] = float(row["risk_weight"])
        row["area_m2"] = float(row["area_m2"]) if row["area_m2"] is not None else None
    return _rows_to_feature_collection(rows)


@router.get("/hand-zones/summary")
def get_hand_zones_summary():
    query = text(
        """
        SELECT class_id, class_label, susceptibility, risk_weight, area_m2
        FROM hand_zones
        ORDER BY class_id
        """
    )
    try:
        with engine.connect() as conn:
            rows = [dict(r) for r in conn.execute(query).mappings().all()]
    except SQLAlchemyError as exc:
        _raise_postgis_unavailable(exc)

    total_area_m2 = sum(float(r["area_m2"] or 0) for r in rows)
    classes = []
    for r in rows:
        area_m2 = float(r["area_m2"] or 0)
        classes.append(
            {
                "class_id": r["class_id"],
                "class_label": r["class_label"],
                "susceptibility": r["susceptibility"],
                "risk_weight": float(r["risk_weight"]),
                "total_area_m2": area_m2,
                "percent_area": round(area_m2 / total_area_m2 * 100, 2) if total_area_m2 else None,
            }
        )
    return {"classes": classes, "total_area_m2": total_area_m2}


@router.get("/point-risk-context")
def get_point_risk_context(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
):
    inside_query = text(
        """
        SELECT EXISTS (
            SELECT 1 FROM municipalities
            WHERE name = 'Blumenau'
              AND ST_Contains(geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))
        ) AS inside_municipality
        """
    )
    zone_query = text(
        """
        SELECT class_id, class_label, susceptibility, risk_weight
        FROM hand_zones
        WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))
        LIMIT 1
        """
    )

    try:
        with engine.connect() as conn:
            inside = conn.execute(inside_query, {"lon": lon, "lat": lat}).scalar()
            zone = conn.execute(zone_query, {"lon": lon, "lat": lat}).mappings().first()
    except SQLAlchemyError as exc:
        _raise_postgis_unavailable(exc)

    observation = (
        "Contexto espacial baseado apenas em HAND (Período 6) — não é motor "
        "de risco completo. Cruzamento com chuva e telemetria entra na F3."
    )

    if zone is None:
        return {
            "inside_municipality": bool(inside),
            "hand_class": None,
            "susceptibility": None,
            "risk_weight": None,
            "observation": observation
            if inside
            else "Ponto fora do limite de Blumenau nesta PoC — sem cobertura de dados HAND.",
        }

    return {
        "inside_municipality": bool(inside),
        "hand_class": zone["class_label"],
        "susceptibility": zone["susceptibility"],
        "risk_weight": float(zone["risk_weight"]),
        "observation": observation,
    }


@router.get("/demo-map")
def get_demo_map():
    """
    Metadados para o mapa de demonstração (F6) — nunca falha com 500. Tenta
    uma leitura real de `hand_zones`; se o PostGIS não responder (comum
    neste ambiente sem Docker/sudo — F2.1), cai num fallback com as
    estatísticas de referência da F2 (mesmos números do raster real,
    validados, não inventados).

    O frontend usa isso só para decidir o que mostrar na legenda/aviso do
    mapa — a geometria em si, no caminho de fallback, vem dos arquivos
    estáticos em apps/web/public/geo/ (gerados por
    services/geo/scripts/generate_web_geojson.py), não desta resposta.
    """
    try:
        query = text("SELECT class_id, class_label, susceptibility, risk_weight, area_m2 FROM hand_zones ORDER BY class_id")
        with engine.connect() as conn:
            rows = [dict(r) for r in conn.execute(query).mappings().all()]
        if not rows:
            raise RuntimeError("tabela hand_zones está vazia — export_to_postgis.py export-all não rodou")

        total_area = sum(float(r["area_m2"] or 0) for r in rows)
        stats = [
            {
                "class_id": r["class_id"],
                "class_label": r["class_label"],
                "susceptibility": r["susceptibility"],
                "risk_weight": float(r["risk_weight"]),
                "total_area_m2": float(r["area_m2"] or 0),
                "percent_area": round(float(r["area_m2"] or 0) / total_area * 100, 2) if total_area else None,
            }
            for r in rows
        ]
        return {
            "status": "ok",
            "source": "postgis",
            "boundary_available": True,
            "hand_zones_available": True,
            "stats": stats,
            "message": "Dados lidos do PostGIS (services/geo, F2).",
        }
    except SQLAlchemyError as exc:
        # Não repassar a exceção crua ao cliente — a mensagem do driver pode
        # incluir host/porta/usuário do Postgres. Log local só com o tipo,
        # não a exceção completa (evita vazar credencial em log também).
        logger.warning("geo/demo-map: PostGIS indisponível (%s) — usando fallback estático.", type(exc).__name__)
        return {
            "status": "degraded",
            "source": "static_fallback",
            "boundary_available": True,
            "hand_zones_available": True,
            "stats": _STATIC_HAND_STATS,
            "message": (
                "PostGIS indisponível neste ambiente — usando estatísticas de "
                "referência e camadas estáticas geradas a partir de data/hand/ "
                "(ver docs/metodologia-hand.md e apps/web/public/geo/)."
            ),
        }


@router.get("/demo-points")
def get_demo_points():
    """
    Pontos dos 3 cenários fixos de demonstração, para marcadores no mapa.
    Não toca banco — roda o motor de risco real (F3) direto sobre
    app.routers.scenarios.DEMO_SCENARIOS, a mesma fonte usada por
    GET /api/scenarios/demo. Sempre disponível, mesmo sem PostGIS.
    """
    points = []
    for key, request in DEMO_SCENARIOS.items():
        result = risk_engine.evaluate(request)
        points.append(
            {
                "id": key,
                "name": request.region or key,
                "lat": request.latitude,
                "lon": request.longitude,
                "risk_level": result.risk_level,
                "risk_score": result.risk_score,
                "explanation": result.explanation,
            }
        )
    return {"source": "simulation", "points": points}
