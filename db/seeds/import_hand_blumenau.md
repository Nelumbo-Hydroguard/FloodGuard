# Importação dos dados reais de Blumenau (F2)

Diferente das outras tabelas do FloodGuard, `municipalities`, `basins` e
`hand_zones` não são populadas por um arquivo `.sql` de seed — são
geometrias reais (polígonos com milhares de vértices), e escrever isso à
mão em `INSERT` seria inviável e propenso a erro. A importação é feita pelo
script `services/geo/scripts/export_to_postgis.py`, que lê os artefatos já
copiados para `data/hand/` e grava no PostGIS.

## Pré-requisitos

1. Banco rodando com as migrations aplicadas (`001_postgis.sql` até
   `003_hand_layers.sql` — automático se você usa `docker compose up`, já
   que `db/migrations/` está montado em `docker-entrypoint-initdb.d/`).
2. Ambiente Python com as dependências geoespaciais — **não** é o mesmo
   ambiente da API (que fica enxuta, sem geopandas). Crie um venv dedicado:

   ```bash
   cd services/geo
   python3 -m venv .venv
   .venv/bin/pip install geopandas rasterio shapely pyproj sqlalchemy geoalchemy2 "psycopg[binary]"
   ```

3. `DATABASE_URL` exportado no ambiente (mesmo valor do `.env` da raiz do
   FloodGuard, mas apontando para `localhost` em vez de `postgis` se você
   estiver rodando o script fora do Docker):

   ```bash
   export DATABASE_URL="postgresql+psycopg://floodguard:floodguard@localhost:5432/floodguard"
   ```

## Passo a passo

```bash
cd services/geo
.venv/bin/python scripts/export_to_postgis.py inspect
.venv/bin/python scripts/export_to_postgis.py export-all
```

`export-all` roda, nesta ordem: `export-boundary` → `export-basins` →
`export-hand-zones`. Pode ser rodado de novo sem duplicar linhas — cada
comando apaga antes de inserir (`DELETE ... WHERE name/source = ...`),
então rodar duas vezes só re-sincroniza os dados, não duplica.

## O que é gravado

| Tabela | Linhas esperadas | Fonte |
|---|---|---|
| `municipalities` | 1 (Blumenau/SC) | `data/hand/blumenau_boundary.gpkg` (IBGE) |
| `basins` | 1 (bacias contribuintes, união) | `data/hand/ottobacias_blumenau_union.gpkg` (ANA) |
| `hand_zones` | 4 (uma por classe HAND) | `data/hand/blumenau_hand_classes_vector.gpkg` |

Detalhes de proveniência, metodologia e limitações do HAND em
[docs/metodologia-hand.md](../../docs/metodologia-hand.md).

## rivers — ainda vazia

A tabela `rivers` existe (`003_hand_layers.sql`) mas não é populada nesta
fase: o repositório HAND não tem um artefato de hidrografia linear (as
ottobacias são bacias/polígonos, não linhas de rio). Importador de rios é
item de F3, condicionado a uma fonte de dados ainda não definida.
