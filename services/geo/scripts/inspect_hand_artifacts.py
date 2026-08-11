"""
Inspeção somente-leitura dos artefatos HAND no repositório legado.

Este script NÃO copia, move nem altera nada — apenas lista o que existe no
repositório `HAND` (PedroZanette/Hand), com tamanho, CRS e (para o raster de
classes) as classes de pixel presentes. Serve para decidir, antes de copiar
qualquer coisa para FloodGuard/data/hand/, o que é leve o bastante para
versionar e o que precisa virar um artefato derivado.

Uso:
    python inspect_hand_artifacts.py --hand-dir /caminho/para/HAND/outputs/blumenau
    python inspect_hand_artifacts.py --hand-dir /caminho/para/HAND/outputs/blumenau --max-mb 50

Requer geopandas e rasterio (ambiente services/geo/.venv — não é dependência
da API). Se não estiverem instalados, o script ainda lista nome/tamanho dos
arquivos, só pula a inspeção de CRS/classes.
"""

from __future__ import annotations

import argparse
from pathlib import Path

try:
    import geopandas as gpd
except ImportError:
    gpd = None

try:
    import numpy as np
    import rasterio
except ImportError:
    rasterio = None
    np = None

VECTOR_FILES = [
    "blumenau_boundary.gpkg",
    "ottobacias_blumenau_union.gpkg",
    "ottobacias_blumenau_raw.gpkg",
    "ottobacias_blumenau_by_level.gpkg",
]
RASTER_FILES = [
    "blumenau_hand.tif",
    "blumenau_hand_classes.tif",
    "dem_contrib_clipped.tif",
    "dem_source.tif",
]
PREVIEW_FILES = [
    "mapa_hand_cropped.png",
    "mapa_hand_transparent.png",
    "mapa_suscetibilidade_blumenau.png",
    "mapa_suscetibilidade_blumenau_relatorio.png",
]


def _size_mb(path: Path) -> float:
    return path.stat().st_size / (1024 * 1024)


def inspect_vector(path: Path) -> None:
    if gpd is None:
        print("    (geopandas não instalado — pulando inspeção de CRS/colunas)")
        return
    gdf = gpd.read_file(path)
    print(f"    CRS: {gdf.crs}")
    print(f"    linhas: {len(gdf)}  colunas: {list(gdf.columns)}")


def inspect_raster(path: Path) -> None:
    if rasterio is None:
        print("    (rasterio não instalado — pulando inspeção de CRS/classes)")
        return
    with rasterio.open(path) as src:
        dtype = src.dtypes[0]
        print(f"    CRS: {src.crs}")
        print(f"    dimensões: {src.width}x{src.height}  dtype: {dtype}  nodata: {src.nodata}")
        # só lê pixels para rasters pequenos — evita ler de propósito um
        # GeoTIFF gigante (ex.: dem_source.tif) só para inspecionar.
        if _size_mb(path) > 50:
            print("    (raster > 50 MB — não lido pixel a pixel nesta inspeção)")
            return
        data = src.read(1)
        mask = data != src.nodata if src.nodata is not None else np.ones_like(data, dtype=bool)
        valid = data[mask]
        is_categorical = np.issubdtype(np.dtype(dtype), np.integer)
        if is_categorical:
            # raster de classes (poucos valores inteiros) — histograma completo faz sentido.
            vals, counts = np.unique(valid, return_counts=True)
            print(f"    classes de pixel presentes: {dict(zip(vals.tolist(), counts.tolist()))}")
        else:
            # raster contínuo (ex.: HAND em metros) — histograma por valor não
            # faz sentido (quase um valor por pixel). Mostra estatísticas.
            print(
                f"    valores contínuos — min: {valid.min():.2f}  max: {valid.max():.2f}  "
                f"media: {valid.mean():.2f}  pixels válidos: {valid.size}"
            )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--hand-dir",
        required=True,
        help="Caminho para HAND/outputs/blumenau no repositório legado (não é copiado, só lido).",
    )
    parser.add_argument("--max-mb", type=float, default=50.0, help="Limite de alerta de tamanho, em MB.")
    args = parser.parse_args()

    hand_dir = Path(args.hand_dir)
    if not hand_dir.is_dir():
        raise SystemExit(f"Diretório não encontrado: {hand_dir}")

    print(f"Inspecionando (somente leitura): {hand_dir}\n")

    for group_name, files, inspector in [
        ("Vetores", VECTOR_FILES, inspect_vector),
        ("Rasters", RASTER_FILES, inspect_raster),
        ("Previews (PNG)", PREVIEW_FILES, None),
    ]:
        print(f"=== {group_name} ===")
        for filename in files:
            path = hand_dir / filename
            if not path.exists():
                print(f"  [ausente] {filename}")
                continue
            size_mb = _size_mb(path)
            flag = " ⚠️  ACIMA DO LIMITE — não copiar bruto" if size_mb > args.max_mb else ""
            print(f"  {filename} — {size_mb:.1f} MB{flag}")
            if inspector:
                inspector(path)
        print()

    print(
        "Nota: este script não altera nada no repositório legado. Decisões de "
        "cópia (o que vai para data/hand/) são tomadas manualmente com base "
        "nesta inspeção — ver services/geo/README.md e data/hand/README.md."
    )


if __name__ == "__main__":
    main()
