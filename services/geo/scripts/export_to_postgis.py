"""
Exportação dos artefatos HAND reais de Blumenau para PostGIS.

Lê os arquivos leves já copiados para FloodGuard/data/hand/ (nunca os
repositórios legados) e grava nas tabelas espaciais criadas em
db/migrations/003_hand_layers.sql. Todos os caminhos são relativos à raiz
do repositório FloodGuard — nada aqui depende de um caminho absoluto do
computador de quem roda o script.

Uso:
    python export_to_postgis.py inspect
    python export_to_postgis.py export-boundary
    python export_to_postgis.py export-basins
    python export_to_postgis.py export-hand-zones
    python export_to_postgis.py export-all

Requer DATABASE_URL no ambiente (ver .env.example na raiz do FloodGuard) e
as dependências geoespaciais de services/geo (geopandas, rasterio,
sqlalchemy, geoalchemy2, psycopg) — não fazem parte de requirements.txt da
API, que continua enxuto e não sabe nada sobre geopandas.

Este script não implementa o motor de risco nem recalcula HAND — apenas
transporta os artefatos já publicados (ver docs/metodologia-hand.md).
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import geopandas as gpd
from shapely.geometry import MultiPolygon
from sqlalchemy import create_engine, text

# services/geo/scripts/export_to_postgis.py -> sobe 3 níveis até a raiz do FloodGuard
REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_HAND_DIR = REPO_ROOT / "data" / "hand"

BOUNDARY_PATH = DATA_HAND_DIR / "blumenau_boundary.gpkg"
BASINS_PATH = DATA_HAND_DIR / "ottobacias_blumenau_union.gpkg"
HAND_ZONES_PATH = DATA_HAND_DIR / "blumenau_hand_classes_vector.gpkg"

HAND_ZONES_SOURCE = "HAND Blumenau (Periodo 6) - repositorio PedroZanette/Hand"
BASINS_SOURCE = "ANA - Ottobacias (SNIRH), uniao de sub-bacias contribuintes"

# Mapeamento das classes do raster real blumenau_hand_classes.tif.
#
# O raster tem 4 classes de pixel (0-3), não as 5 sugeridas genericamente no
# planejamento da F2 — usamos o que existe de fato, sem inventar classe.
# A correspondência class_id -> rótulo foi validada cruzando o percentual de
# área de cada classe (calculado aqui via polygonize + reprojeção para
# SIRGAS2000/UTM22S) com os percentuais já publicados em
# americas_techguard_final_poc/src/hand_reference.py (Período 6): 17,08% /
# 9,92% / 20,49% / 52,51% — bate na ordem class_id 0,1,2,3.
HAND_CLASS_MAP = {
    0: {
        "class_label": "Alta suscetibilidade",
        "hand_min_m": 0.0,
        "hand_max_m": 3.0,
        "susceptibility": "alta",
        "risk_weight": 0.9,
    },
    1: {
        "class_label": "Media suscetibilidade",
        "hand_min_m": 3.0,
        "hand_max_m": 10.0,
        "susceptibility": "media",
        "risk_weight": 0.6,
    },
    2: {
        "class_label": "Baixa suscetibilidade",
        "hand_min_m": 10.0,
        "hand_max_m": 30.0,
        "susceptibility": "baixa",
        "risk_weight": 0.3,
    },
    3: {
        "class_label": "Muito baixa suscetibilidade",
        "hand_min_m": 30.0,
        "hand_max_m": None,
        "susceptibility": "muito_baixa",
        "risk_weight": 0.1,
    },
}

STATE_BY_UF_NAME = {"Santa Catarina": "SC"}


def get_engine():
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        sys.exit(
            "DATABASE_URL não definido. Copie .env.example para .env na raiz "
            "do FloodGuard e exporte a variável (ou rode via docker compose)."
        )
    return create_engine(database_url)


def _require(path: Path) -> Path:
    if not path.exists():
        sys.exit(
            f"Artefato não encontrado: {path}\n"
            "Rode 'inspect' primeiro e confira data/hand/README.md — o "
            "artefato precisa ser copiado do repositório HAND antes de exportar."
        )
    return path


def _to_multipolygon(geom):
    if geom is None:
        return None
    if geom.geom_type == "MultiPolygon":
        return geom
    return MultiPolygon([geom])


def cmd_inspect(_args: argparse.Namespace) -> None:
    for label, path in [
        ("boundary", BOUNDARY_PATH),
        ("basins", BASINS_PATH),
        ("hand_zones", HAND_ZONES_PATH),
    ]:
        if not path.exists():
            print(f"[FALTANDO] {label}: {path}")
            continue
        size_mb = path.stat().st_size / (1024 * 1024)
        gdf = gpd.read_file(path)
        print(f"[OK] {label}: {path.name} — {size_mb:.1f} MB, {len(gdf)} feature(s), CRS={gdf.crs}")


def cmd_export_boundary(_args: argparse.Namespace) -> None:
    gdf = gpd.read_file(_require(BOUNDARY_PATH))
    row = gdf.iloc[0]
    uf_name = row.get("NM_UF", "Santa Catarina")

    out = gpd.GeoDataFrame(
        {
            "name": [row.get("NM_MUN", "Blumenau")],
            "state": [STATE_BY_UF_NAME.get(uf_name, uf_name)],
            "ibge_code": [str(row.get("CD_MUN")) if row.get("CD_MUN") is not None else None],
        },
        geometry=[_to_multipolygon(row.geometry)],
        crs=gdf.crs,
    ).to_crs(4326)
    out = out.rename_geometry("geom")  # tabela usa a coluna "geom", não "geometry"

    engine = get_engine()
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM municipalities WHERE name = :name"), {"name": out["name"].iloc[0]})
    out.to_postgis("municipalities", engine, if_exists="append", index=False)
    print(f"municipalities: {len(out)} linha(s) exportada(s) ({out['name'].iloc[0]}/{out['state'].iloc[0]}).")


def cmd_export_basins(_args: argparse.Namespace) -> None:
    gdf = gpd.read_file(_require(BASINS_PATH))

    out = gpd.GeoDataFrame(
        {
            "name": ["Bacias contribuintes (Blumenau)"] * len(gdf),
            "source": [BASINS_SOURCE] * len(gdf),
        },
        geometry=[_to_multipolygon(g) for g in gdf.geometry],
        crs=gdf.crs,
    ).to_crs(4326)
    out = out.rename_geometry("geom")

    engine = get_engine()
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM basins WHERE source = :source"), {"source": BASINS_SOURCE})
    out.to_postgis("basins", engine, if_exists="append", index=False)
    print(f"basins: {len(out)} linha(s) exportada(s).")


def cmd_export_hand_zones(_args: argparse.Namespace) -> None:
    gdf = gpd.read_file(_require(HAND_ZONES_PATH))

    rows = []
    geoms = []
    for _, feature in gdf.iterrows():
        class_id = int(feature["class_id"])
        mapping = HAND_CLASS_MAP.get(class_id)
        if mapping is None:
            print(f"[AVISO] class_id {class_id} não mapeado em HAND_CLASS_MAP — pulando, sem inventar rótulo.")
            continue
        rows.append(
            {
                "class_id": class_id,
                "class_label": mapping["class_label"],
                "hand_min_m": mapping["hand_min_m"],
                "hand_max_m": mapping["hand_max_m"],
                "susceptibility": mapping["susceptibility"],
                "risk_weight": mapping["risk_weight"],
                "area_m2": float(feature["area_m2"]),
                "source": HAND_ZONES_SOURCE,
            }
        )
        geoms.append(_to_multipolygon(feature.geometry))

    out = gpd.GeoDataFrame(rows, geometry=geoms, crs=gdf.crs).to_crs(4326)
    out = out.rename_geometry("geom")

    engine = get_engine()
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM hand_zones WHERE source = :source"), {"source": HAND_ZONES_SOURCE})
    out.to_postgis("hand_zones", engine, if_exists="append", index=False)
    print(f"hand_zones: {len(out)} linha(s) exportada(s).")


def cmd_export_all(args: argparse.Namespace) -> None:
    cmd_export_boundary(args)
    cmd_export_basins(args)
    cmd_export_hand_zones(args)


COMMANDS = {
    "inspect": cmd_inspect,
    "export-boundary": cmd_export_boundary,
    "export-basins": cmd_export_basins,
    "export-hand-zones": cmd_export_hand_zones,
    "export-all": cmd_export_all,
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", choices=COMMANDS.keys())
    args = parser.parse_args()
    COMMANDS[args.command](args)


if __name__ == "__main__":
    main()
