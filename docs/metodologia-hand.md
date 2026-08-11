# Metodologia HAND — FloodGuard

## O que é HAND

HAND (**Height Above Nearest Drainage** — Altura Acima da Drenagem Mais
Próxima) é um modelo topográfico derivado de um Modelo Digital de Elevação
(DEM). Para cada célula do terreno, calcula a diferença de altitude entre
essa célula e o canal de drenagem mais próximo a que ela está
hidrologicamente conectada.

```
Ponto do terreno
      ↓
Identificação da drenagem associada
      ↓
Diferença de elevação
      ↓
Valor HAND (metros)
```

Valores baixos de HAND indicam pontos topograficamente próximos da
drenagem — maior suscetibilidade a inundação. Valores altos indicam pontos
elevados em relação ao canal — menor suscetibilidade.

## Por que HAND não é previsão completa

HAND é uma variável **topográfica estática**. Ele não incorpora:

- chuva (intensidade, acumulado, previsão);
- vazão do rio no momento do evento;
- exposição (o que existe naquele ponto — moradias, infraestrutura);
- vulnerabilidade (quem está exposto e sua capacidade de resposta);
- mudanças de uso do solo, urbanização, drenagem artificial.

Por isso o FloodGuard trata HAND como **suscetibilidade**, não como risco
completo. O motor de risco (autorizado sob acordo de equipe, código ainda
não movido — ver [autoria-licenca.md](autoria-licenca.md)) é o que cruza
HAND com chuva e telemetria para gerar um nível de risco. O endpoint
`GET /api/geo/point-risk-context` desta fase entrega só o contexto espacial
HAND de um ponto — não é o motor de risco.

## Origem dos dados

Pipeline executado no repositório `HAND` (`PedroZanette/Hand`), notebook
`hand_whitebox_integrado_ANA_IBGE_BLUMENAU.ipynb` (Período 6 do projeto,
anterior à consolidação do FloodGuard). Fontes de entrada:

| Dado | Fonte | Uso no pipeline |
|---|---|---|
| Limite municipal | IBGE (`BR_Municipios_2023`) | Recorte da área de estudo (Blumenau) |
| Bacias hidrográficas | ANA/SNIRH (Ottobacias) | Delimitação da área de contribuição |
| Modelo Digital de Elevação | Copernicus DEM (~30 m), via Microsoft Planetary Computer | Base para direção de fluxo e cálculo HAND |
| Processamento hidrológico | WhiteboxTools | Direção de fluxo, rede de drenagem, cálculo HAND |

O DEM bruto (`dem_source.tif`, ~1,5 GB) e os intermediários de
processamento **não** foram trazidos para o FloodGuard — ficam no
repositório `HAND`, que continua sendo a fonte de verdade do pipeline.

## Classes HAND usadas no FloodGuard

O raster de classes (`blumenau_hand_classes.tif`) tem **4 classes de
pixel** (valores 0 a 3), não as 5 ou 6 usadas em outras partes do histórico
do projeto (`techguard-sentinela` usa 6 classes contínuas de 2/5/10/20/50 m
— motor ainda não movido para cá, não usado nesta fase). A F2 mapeou os 4
valores existentes sem
inventar classe, cruzando o percentual de área de cada um com os
percentuais já publicados em
`americas_techguard_final_poc/src/hand_reference.py` (mesma entrega,
Período 6) para confirmar a correspondência:

| class_id | Rótulo | Faixa HAND | Suscetibilidade | Peso | % da área (Blumenau) |
|---|---|---|---|---|---|
| 0 | Alta suscetibilidade | 0–3 m | alta | 0.90 | 17,08–17,10% |
| 1 | Média suscetibilidade | 3–10 m | media | 0.60 | 9,92% |
| 2 | Baixa suscetibilidade | 10–30 m | baixa | 0.30 | 20,49% |
| 3 | Muito baixa suscetibilidade | > 30 m | muito_baixa | 0.10 | 52,49–52,51% |

A pequena diferença entre os percentuais (ex.: 17,08% vs. 17,10%) vem da
simplificação de geometria aplicada na vetorização (ver abaixo) — dentro da
margem esperada, confirma que o mapeamento está correto.

## Artefatos importados na F2

Copiados de `HAND/outputs/blumenau/` para `FloodGuard/data/hand/`:

| Arquivo | Tamanho | O que é |
|---|---|---|
| `blumenau_boundary.gpkg` | ~0,25 MB | Limite municipal de Blumenau (IBGE), EPSG:4326 |
| `ottobacias_blumenau_union.gpkg` | ~0,15 MB | União das sub-bacias contribuintes (ANA), EPSG:4326 |
| `blumenau_hand_classes_vector.gpkg` | ~19 MB | Classes HAND **vetorizadas** (ver abaixo) |
| `previews/*.png` | ~1,5 MB total | Mapas estáticos de referência visual |

**Não copiados** (ficam só no repositório `HAND`):

- `dem_source.tif` (~1,5 GB) — DEM bruto, muito grande, regenerável;
- `dem_contrib_clipped.tif`, `blumenau_hand.tif` — intermediários e raster
  HAND contínuo (float, 26 MB), não usados diretamente pela aplicação —
  o que a aplicação consulta são as classes já discretizadas;
- notebooks antigos (`Olds/`), venvs, caches.

### Por que vetor, não raster

`blumenau_hand_classes.tif` (3 MB) é pequeno o bastante para versionar, mas
o banco espacial do FloodGuard (PostGIS) e a API servem **geometrias**
(`GEOMETRY(MultiPolygon, 4326)`), não rasters. Em vez de guardar o `.tif` e
processá-lo em runtime, a F2 gerou um derivado vetorial uma única vez:

1. `rasterio.features.shapes()` sobre o raster de classes (EPSG:3857, 4
   valores de pixel) — poligoniza cada célula.
2. `dissolve` por `class_id` — une todos os fragmentos da mesma classe em
   um único `MultiPolygon`.
3. Área calculada em EPSG:32722 (SIRGAS2000 / UTM 22S — mesma projeção
   citada no restante do projeto para a região de Blumenau).
4. Geometria simplificada (`simplify(0.00005)`, preservando topologia) e
   reprojetada para EPSG:4326 — reduz o arquivo de ~90 MB (sem simplificar)
   para ~19 MB, mantendo os limites de classe reconhecíveis num mapa.

## Como regenerar

O raster de classes não é recalculado pelo FloodGuard — isso é
responsabilidade do repositório `HAND`. Se o raster mudar lá (novo DEM,
novo threshold), regenere o vetor com:

```bash
cd services/geo
.venv/bin/pip install geopandas rasterio shapely pyproj
.venv/bin/python -c "
import rasterio
from rasterio.features import shapes
import geopandas as gpd

with rasterio.open('/caminho/para/HAND/outputs/blumenau/blumenau_hand_classes.tif') as src:
    data, transform, crs, nodata = src.read(1), src.transform, src.crs, src.nodata

mask = data != nodata
geoms = [{'properties': {'class_id': int(v)}, 'geometry': g} for g, v in shapes(data, mask=mask, transform=transform)]
gdf = gpd.GeoDataFrame.from_features(geoms, crs=crs)
dissolved = gdf.dissolve(by='class_id', as_index=False)
dissolved['area_m2'] = dissolved.to_crs(32722).geometry.area
out = dissolved.to_crs(4326)
out['geometry'] = out.geometry.simplify(0.00005, preserve_topology=True)
out.to_file('../../data/hand/blumenau_hand_classes_vector.gpkg', driver='GPKG')
"
```

Se o raster real tiver classes diferentes das 4 documentadas acima,
**não adapte os rótulos cegamente** — confira as novas classes e atualize
o mapeamento `HAND_CLASS_MAP` em
`services/geo/scripts/export_to_postgis.py` e esta tabela.

## Como exportar para PostGIS

```bash
cd services/geo
.venv/bin/python scripts/export_to_postgis.py export-all
```

Detalhes em [db/seeds/import_hand_blumenau.md](../db/seeds/import_hand_blumenau.md).

## Limitações

- Piloto único: só Blumenau/SC.
- Resolução do DEM ~30 m (Copernicus DEM) — não captura microtopografia
  urbana (guias, muros, drenagem artificial).
- HAND não substitui modelo hidrodinâmico nem incorpora vazão real.
- Classes de suscetibilidade são um proxy, calibrado visualmente/pela área
  histórica de eventos, não validado contra registros de inundação reais.
- A tabela `rivers` existe no banco mas está vazia — não há artefato de
  hidrografia linear no repositório `HAND` (ver
  [db/seeds/import_hand_blumenau.md](../db/seeds/import_hand_blumenau.md)).

## Próximos passos (F3)

- Cruzar `hand_zones` com telemetria simulada (chuva, nível d'água) para
  compor o motor de risco real — código do `techguard-sentinela` já
  autorizado sob acordo de equipe, falta mover/adaptar para
  `services/api/app/engine/` (ver [autoria-licenca.md](autoria-licenca.md)).
- Popular `rivers` a partir de uma fonte de hidrografia linear (a definir).
- Substituir `GET /api/geo/point-risk-context` por um endpoint de risco
  completo, quando o motor estiver liberado.
