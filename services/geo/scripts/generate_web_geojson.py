"""
Gera GeoJSON leve para o fallback estático do mapa web (F6).

O frontend (`/mapa`) tenta primeiro os endpoints reais do PostGIS
(`/api/geo/*`). Quando o banco não está disponível — cenário comum neste
ambiente de desenvolvimento, sem Docker/sudo (ver F2.1) — o mapa cai para
os arquivos gerados aqui, servidos como estático pelo Vite
(`apps/web/public/geo/`).

Lê os artefatos já existentes em `data/hand/` (nunca o repositório `HAND`
original nem nada acima de ~50 MB) e escreve:

    apps/web/public/geo/blumenau_boundary.geojson
    apps/web/public/geo/blumenau_basins.geojson
    apps/web/public/geo/blumenau_hand_zones_simplified.geojson
    apps/web/public/geo/hand_classes_stats.json

`blumenau_hand_classes_vector.gpkg` (19 MB) é simplificado com tolerância
maior (`preserve_topology=False`) antes de virar GeoJSON — testado nesta
fase: `preserve_topology=True` trava (>3 min sem terminar) na geometria
real, provavelmente por causa dos micro-vazios do polygonize original;
`preserve_topology=False` roda em segundos e ainda fica muito abaixo do
limite de 10 MB. Para um polígono de fundo em mapa de demonstração, pequenas
imperfeições topológicas são aceitáveis.

Uso:
    cd services/geo
    .venv/bin/python scripts/generate_web_geojson.py
"""

from __future__ import annotations

import json
from pathlib import Path

import geopandas as gpd

REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_HAND_DIR = REPO_ROOT / "data" / "hand"
OUT_DIR = REPO_ROOT / "apps" / "web" / "public" / "geo"

# Mesmo mapeamento de services/geo/scripts/export_to_postgis.py::HAND_CLASS_MAP
# — validado na F2 contra os percentuais de área do raster real. Duplicado
# aqui (não importado) porque export_to_postgis.py depende de sqlalchemy/
# geoalchemy2 para outras funções; este script só precisa da tabela.
HAND_CLASS_MAP = {
    0: {"class_label": "Alta suscetibilidade", "susceptibility": "alta", "risk_weight": 0.9},
    1: {"class_label": "Media suscetibilidade", "susceptibility": "media", "risk_weight": 0.6},
    2: {"class_label": "Baixa suscetibilidade", "susceptibility": "baixa", "risk_weight": 0.3},
    3: {"class_label": "Muito baixa suscetibilidade", "susceptibility": "muito_baixa", "risk_weight": 0.1},
}

# Tolerância de simplificação do GeoJSON de zonas HAND — graus (~55 m no
# equador). Escolhida por medição nesta fase: reduz ~48 MB brutos para
# ~6 MB, mantendo os limites de classe reconhecíveis num mapa pequeno.
HAND_ZONES_SIMPLIFY_TOLERANCE = 0.0005


def write_geojson(gdf: gpd.GeoDataFrame, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(gdf.to_json(), encoding="utf-8")
    size_mb = path.stat().st_size / (1024 * 1024)
    print(f"[OK] {path.relative_to(REPO_ROOT)} — {size_mb:.2f} MB")
    if size_mb > 10:
        print(f"    ⚠️  acima de 10 MB — considere aumentar a tolerância de simplificação")
    if size_mb > 50:
        raise SystemExit(f"{path.name} passou de 50 MB — não deve ser versionado assim.")


def generate_boundary() -> None:
    src = DATA_HAND_DIR / "blumenau_boundary.gpkg"
    if not src.exists():
        print(f"[FALTANDO] {src} — pulando boundary.")
        return
    gdf = gpd.read_file(src)
    out = gdf[["geometry"]].copy()
    out["name"] = gdf["NM_MUN"] if "NM_MUN" in gdf.columns else "Blumenau"
    out["ibge_code"] = gdf["CD_MUN"] if "CD_MUN" in gdf.columns else None
    write_geojson(out, OUT_DIR / "blumenau_boundary.geojson")


def generate_basins() -> None:
    src = DATA_HAND_DIR / "ottobacias_blumenau_union.gpkg"
    if not src.exists():
        print(f"[FALTANDO] {src} — pulando bacias.")
        return
    gdf = gpd.read_file(src)
    write_geojson(gdf, OUT_DIR / "blumenau_basins.geojson")


def generate_hand_zones() -> tuple[list[dict], float]:
    src = DATA_HAND_DIR / "blumenau_hand_classes_vector.gpkg"
    if not src.exists():
        print(f"[FALTANDO] {src} — pulando zonas HAND.")
        return [], 0.0

    gdf = gpd.read_file(src)
    gdf["geometry"] = gdf.geometry.simplify(HAND_ZONES_SIMPLIFY_TOLERANCE, preserve_topology=False)
    gdf = gdf.sort_values("class_id").reset_index(drop=True)

    total_area = float(gdf["area_m2"].sum())
    stats = []
    for class_id, mapping in HAND_CLASS_MAP.items():
        match = gdf[gdf["class_id"] == class_id]
        if match.empty:
            continue
        area_m2 = float(match.iloc[0]["area_m2"])
        stats.append(
            {
                "class_id": class_id,
                "class_label": mapping["class_label"],
                "susceptibility": mapping["susceptibility"],
                "risk_weight": mapping["risk_weight"],
                "total_area_m2": area_m2,
                "percent_area": round(area_m2 / total_area * 100, 2) if total_area else None,
            }
        )

    gdf["class_label"] = gdf["class_id"].map(lambda c: HAND_CLASS_MAP.get(c, {}).get("class_label", f"classe {c}"))
    gdf["susceptibility"] = gdf["class_id"].map(lambda c: HAND_CLASS_MAP.get(c, {}).get("susceptibility", "desconhecida"))
    gdf["risk_weight"] = gdf["class_id"].map(lambda c: HAND_CLASS_MAP.get(c, {}).get("risk_weight"))

    write_geojson(gdf, OUT_DIR / "blumenau_hand_zones_simplified.geojson")
    return stats, total_area


def write_stats(stats: list[dict], total_area_m2: float) -> None:
    if not stats:
        print("[AVISO] sem estatísticas de zonas HAND — hand_classes_stats.json não gerado.")
        return
    path = OUT_DIR / "hand_classes_stats.json"
    payload = {
        "source": "static_fallback",
        "classes": stats,
        "total_area_m2": total_area_m2,
    }
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[OK] {path.relative_to(REPO_ROOT)} — {path.stat().st_size / 1024:.1f} KB")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    generate_boundary()
    generate_basins()
    stats, total_area_m2 = generate_hand_zones()
    write_stats(stats, total_area_m2)
    print("\nArquivos gerados em apps/web/public/geo/ — servidos como estático pelo Vite (/geo/*.geojson).")


if __name__ == "__main__":
    main()
