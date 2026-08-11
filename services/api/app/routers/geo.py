"""
Rotas geoespaciais — limite municipal, bacias e zonas HAND reais de Blumenau.

Os dados são lidos do PostGIS, populado pelo pipeline services/geo (F2, ver
services/geo/scripts/export_to_postgis.py). Este router é somente leitura —
não recalcula HAND e não aplica motor de risco. `point-risk-context` dá só
contexto espacial HAND para um ponto; cruzamento com chuva/telemetria é F3.

Consultas usam SQL cru (ST_AsGeoJSON) em vez de geopandas: a API continua
enxuta, sem geopandas/rasterio nas suas dependências.
"""

import json
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import text

from app.database import engine

router = APIRouter(prefix="/api/geo", tags=["geo"])


@router.get("/status")
def geo_status():
    return {
        "module": "geo",
        "status": "connected",
        "note": "camadas HAND reais de Blumenau importadas na F2 (services/geo)",
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
    with engine.connect() as conn:
        row = conn.execute(query).mappings().first()

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
    with engine.connect() as conn:
        rows = [dict(r) for r in conn.execute(query).mappings().all()]
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
    with engine.connect() as conn:
        rows = [dict(r) for r in conn.execute(query).mappings().all()]
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
    with engine.connect() as conn:
        rows = [dict(r) for r in conn.execute(query).mappings().all()]

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

    with engine.connect() as conn:
        inside = conn.execute(inside_query, {"lon": lon, "lat": lat}).scalar()
        zone = conn.execute(zone_query, {"lon": lon, "lat": lat}).mappings().first()

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
