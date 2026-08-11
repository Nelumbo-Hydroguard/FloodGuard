# services/geo

Pipeline geoespacial HAND (Height Above Nearest Drainage) do FloodGuard.

**Status: F2 concluída.** Notebook e artefatos leves de Blumenau foram
copiados do repositório `HAND` (`PedroZanette/Hand`) e o script de
exportação está implementado. O pipeline de *cálculo* do HAND (WhiteboxTools
sobre DEM) continua vivendo no repositório `HAND` — este serviço só consome
os artefatos já publicados, não recalcula nada.

Metodologia completa, classes usadas e limitações:
[docs/metodologia-hand.md](../../docs/metodologia-hand.md).

## Estrutura

```
services/geo/
├─ notebooks/
│  └─ hand_whitebox_integrado_ANA_IBGE_BLUMENAU.ipynb   cópia de referência
└─ scripts/
   ├─ inspect_hand_artifacts.py    inspeciona o repo HAND (leitura, não copia)
   └─ export_to_postgis.py         exporta data/hand/*.gpkg para o PostGIS
```

Os dados propriamente ditos (`.gpkg`, previews) ficam em
[`data/hand/`](../../data/hand/README.md), não aqui — este diretório é
código, não dado.

## Ambiente

Este serviço precisa de uma stack geoespacial (geopandas, rasterio, shapely,
pyproj, sqlalchemy, geoalchemy2, psycopg) que **não** faz parte das
dependências da API (`services/api/requirements.txt` continua enxuto, sem
geopandas). Use um venv dedicado:

```bash
cd services/geo
python3 -m venv .venv
.venv/bin/pip install geopandas rasterio shapely pyproj sqlalchemy geoalchemy2 "psycopg[binary]"
```

`.venv/` é ignorado pelo git (ver `.gitignore` da raiz).

## Uso

```bash
# Inspecionar o repositório HAND legado (só leitura, não copia nada)
.venv/bin/python scripts/inspect_hand_artifacts.py --hand-dir /caminho/para/HAND/outputs/blumenau

# Exportar os artefatos já copiados em data/hand/ para o PostGIS
export DATABASE_URL="postgresql+psycopg://floodguard:floodguard@localhost:5432/floodguard"
.venv/bin/python scripts/export_to_postgis.py inspect
.venv/bin/python scripts/export_to_postgis.py export-all
```

Passo a passo completo, tabelas afetadas e contagens esperadas:
[db/seeds/import_hand_blumenau.md](../../db/seeds/import_hand_blumenau.md).

## Fonte de verdade

O repositório `HAND` continua sendo a fonte de verdade do pipeline de
cálculo (DEM → direção de fluxo → HAND). Se o raster de classes mudar lá, o
vetor em `data/hand/` precisa ser regenerado — procedimento documentado em
[docs/metodologia-hand.md](../../docs/metodologia-hand.md#como-regenerar).
