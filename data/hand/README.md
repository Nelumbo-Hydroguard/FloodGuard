# data/hand

Artefatos geoespaciais leves de Blumenau, copiados do repositório `HAND`
(`PedroZanette/Hand`) na F2. Todos em EPSG:4326.

| Arquivo | Tamanho | Conteúdo | Origem |
|---|---|---|---|
| `blumenau_boundary.gpkg` | ~0,25 MB | Limite municipal de Blumenau (1 polígono) | IBGE, via `HAND/outputs/blumenau/blumenau_boundary.gpkg` |
| `ottobacias_blumenau_union.gpkg` | ~0,15 MB | União das sub-bacias contribuintes (1 polígono) | ANA/SNIRH, via `HAND/outputs/blumenau/ottobacias_blumenau_union.gpkg` |
| `blumenau_hand_classes_vector.gpkg` | ~19 MB | 4 zonas HAND vetorizadas (classes 0–3), com `area_m2` e `percent_area` | Derivado de `HAND/outputs/blumenau/blumenau_hand_classes.tif` — ver abaixo |
| `hand_classes_stats.json` | <1 KB | Estatísticas de área por classe, geradas junto com o vetor acima | Derivado, mesma origem |
| `previews/mapa_hand_transparent.png` | ~0,7 MB | Mapa estático do raster HAND, fundo transparente | `HAND/outputs/blumenau/mapa_hand_transparent.png` |
| `previews/mapa_suscetibilidade_blumenau.png` | ~0,85 MB | Mapa estático de suscetibilidade (Período 6) | `HAND/outputs/blumenau/mapa_suscetibilidade_blumenau.png` |

## Por que `blumenau_hand_classes.tif` não está aqui

O raster original (3 MB, uint8, 4 classes) é pequeno o bastante para
versionar, mas o PostGIS e a API do FloodGuard trabalham com **geometrias**,
não rasters. Em vez de guardar o `.tif` e processá-lo em runtime, ele foi
convertido uma única vez em `blumenau_hand_classes_vector.gpkg`
(polygonize + dissolve por classe + reprojeção). O procedimento completo,
incluindo por que os percentuais de área batem com
`americas_techguard_final_poc/src/hand_reference.py`, está documentado em
[docs/metodologia-hand.md](../../docs/metodologia-hand.md).

## O que não está aqui (fica só no repositório `HAND`)

- `dem_source.tif` (~1,5 GB) — DEM bruto, muito grande, regenerável a
  partir do Copernicus DEM via Microsoft Planetary Computer.
- `dem_contrib_clipped.tif`, `blumenau_hand.tif` — intermediários e raster
  HAND contínuo (float64), não usados pela aplicação diretamente.
- `ottobacias_blumenau_raw.gpkg`, `ottobacias_blumenau_by_level.gpkg` — o
  FloodGuard usa apenas a versão já unida (`_union`); as versões
  desagregadas continuam no repositório de origem.
- Notebooks antigos (`Olds/`), venvs, caches.

## Como esses arquivos chegam no banco

Não é `INSERT` manual — são geometrias grandes demais para SQL escrito à
mão. Use `services/geo/scripts/export_to_postgis.py`. Passo a passo:
[db/seeds/import_hand_blumenau.md](../../db/seeds/import_hand_blumenau.md).

## Licença/autoria

Estes artefatos são derivados de dados públicos (IBGE, ANA, Copernicus DEM)
processados no repositório `HAND`, de autoria de Pedro Henrique Nunes
Zanette (mesmo autor do FloodGuard) — sem pendência de autorização, ao
contrário do código do `techguard-sentinela` (ver
[docs/autoria-licenca.md](../../docs/autoria-licenca.md)).
