# HAND — Processamento Detalhado (F6.0)

> Aprofunda `docs/metodologia-hand.md` (que já existia) respondendo
> diretamente às duas perguntas que motivaram esta rodada: **"o HAND foi
> feito como?"** e **"ele foi tratado devidamente?"** — com separação clara
> entre o que está comprovado lendo arquivo/código e o que é inferido do
> pipeline documentado, sem inventar nada no meio do caminho.

## O que é HAND

HAND (**Height Above Nearest Drainage** — Altura Acima da Drenagem Mais
Próxima) é um índice topográfico derivado de um Modelo Digital de Elevação
(DEM). Para cada célula do terreno, o algoritmo:

1. identifica, na rede de drenagem derivada do próprio DEM, qual célula de
   canal está hidrologicamente conectada a essa célula (seguindo a direção
   de fluxo);
2. calcula a diferença de altitude entre a célula do terreno e essa célula
   de drenagem associada.

O resultado é um raster contínuo em metros: **quanto mais baixo o valor,
mais próxima topograficamente a célula está da drenagem — maior a
suscetibilidade a alagamento/inundação**. Valores altos indicam pontos
elevados em relação ao canal mais próximo, portanto menos suscetíveis.

## Por que HAND é útil para alagamento/inundação

HAND captura, numa única variável, a razão geomorfológica mais direta pela
qual um ponto alaga: proximidade vertical de um canal de drenagem. Ele é
mais informativo que "altitude absoluta" ou "distância planimétrica ao rio"
isoladamente porque:

- combina os dois (altura + conectividade hidrológica), não trata "perto do
  rio mas alto" como equivalente a "perto do rio e baixo";
- é derivável de qualquer DEM, sem precisar de série histórica de cheias;
- generaliza bem para município inteiro de uma vez (não exige levantamento
  de campo ponto a ponto).

## O que HAND **não** faz

Isso está documentado em `docs/metodologia-hand.md` e reforçado aqui porque
é o núcleo da pergunta "foi tratado devidamente": HAND é **suscetibilidade
topográfica estática**, não previsão de inundação. Ele não incorpora:

- chuva (intensidade, acumulado, previsão) — isso é o fator `rainfall_factor`
  do motor de risco, separado;
- vazão do rio no momento do evento;
- exposição (o que existe naquele ponto — moradias, infraestrutura, pessoas);
- vulnerabilidade (capacidade de resposta de quem está exposto);
- mudanças de uso do solo, urbanização, drenagem artificial (guias, bueiros,
  canalização) — o DEM usado (~30 m) não captura microtopografia urbana.

Por isso o FloodGuard nunca usa HAND sozinho para decidir risco — ele entra
como **um dos 4 fatores** da fórmula de fusão em
`services/api/app/engine/risk_engine.py`, com peso 0.45 (o maior peso, mas
não o único). Ver `docs/motor-de-risco.md`.

## Dados de entrada usados

| Dado | Fonte | Uso no pipeline | Comprovação |
|---|---|---|---|
| Limite municipal | IBGE (`BR_Municipios_2023`) | Recorte da área de estudo | Comprovado — `data/hand/blumenau_boundary.gpkg` existe, colunas `NM_MUN`/`CD_MUN`/`NM_UF` lidas por `export_to_postgis.py::cmd_export_boundary` |
| Bacias hidrográficas | ANA/SNIRH (Ottobacias) | Delimitação da área de contribuição hidrológica | Comprovado — `data/hand/ottobacias_blumenau_union.gpkg` existe, consumido por `export_to_postgis.py::cmd_export_basins` |
| Modelo Digital de Elevação | Copernicus DEM (~30 m), via Microsoft Planetary Computer | Base para direção de fluxo e cálculo HAND | **Inferido pela documentação existente** (`docs/metodologia-hand.md`) — o DEM bruto (`dem_source.tif`, ~1,5 GB) não está neste repositório, fica no repositório externo `HAND` (`PedroZanette/Hand`); não há como confirmar por arquivo local nesta auditoria |
| Processamento hidrológico | WhiteboxTools | Direção de fluxo, rede de drenagem, cálculo HAND | **Inferido pela documentação existente** — nome do notebook de origem (`hand_whitebox_integrado_ANA_IBGE_BLUMENAU.ipynb`) indica a biblioteca, mas o notebook em si roda fora do FloodGuard e não foi reexecutado nesta auditoria |

## Área piloto

**Blumenau/SC** — único município processado. Confirmado em todos os
artefatos (`blumenau_boundary.gpkg`, `blumenau_hand_classes_vector.gpkg`
etc.) e reforçado em `docs/decisoes-arquitetura.md` ("piloto único").
Cobertura de outros municípios é item de roadmap, não implementado.

## Etapas prováveis do pipeline

A tabela abaixo segue exatamente a ordem pedida. Cada etapa recebe uma
classificação de confiança:

- **Comprovado por arquivo** — existe artefato ou código no FloodGuard que
  demonstra a etapa aconteceu (mesmo que a execução tenha sido no
  repositório `HAND` externo).
- **Inferido pelo pipeline/documentação existente** — a etapa é necessária
  para chegar do DEM ao artefato final e está descrita em
  `docs/metodologia-hand.md`/nome do notebook, mas não há código-fonte do
  passo específico dentro do FloodGuard para inspecionar.
- **Pendente de validação** — não há evidência direta nem documentação
  prévia suficiente; assumir que aconteceu é uma suposição razoável, não um
  fato confirmado.

| # | Etapa | Confiança | Evidência |
|---|---|---|---|
| 1 | Obtenção do DEM (Copernicus DEM, Microsoft Planetary Computer) | Inferido pelo pipeline/documentação existente | Citado em `docs/metodologia-hand.md`; `dem_source.tif` não está no FloodGuard para inspeção direta |
| 2 | Recorte para Blumenau (usando o limite municipal IBGE) | Inferido pelo pipeline/documentação existente | `dem_contrib_clipped.tif` é citado como artefato intermediário do repositório `HAND` — nome sugere recorte já feito, mas o arquivo não está aqui para confirmar dimensões/CRS |
| 3 | Condicionamento hidrológico (preenchimento de depressões/breach) | Pendente de validação | Etapa padrão de qualquer pipeline HAND com WhiteboxTools, mas nenhum artefato ou documento do FloodGuard cita explicitamente "fill/breach depressions" — assumir que ocorreu é razoável tecnicamente, não confirmado por evidência local |
| 4 | Direção de fluxo (flow direction) | Pendente de validação | Mesma situação do item 3 — necessária tecnicamente para HAND, não documentada em detalhe nos artefatos disponíveis aqui |
| 5 | Acumulação de fluxo (flow accumulation) | Pendente de validação | Idem — pré-requisito técnico padrão, sem documentação própria no FloodGuard |
| 6 | Definição da rede de drenagem (threshold de acumulação) | Pendente de validação | Idem — o resultado final (`blumenau_hand.tif`) implica que essa etapa ocorreu, mas o threshold usado não está documentado em nenhum arquivo acessível nesta auditoria |
| 7 | Cálculo HAND (diferença de elevação até a drenagem associada) | Comprovado por arquivo (resultado) | O raster contínuo `blumenau_hand.tif` é citado em `docs/metodologia-hand.md` e em `data/hand/README.md` como existente no repositório `HAND` (não copiado para cá por ser derivável) |
| 8 | Classificação em classes de suscetibilidade | Comprovado por arquivo | `blumenau_hand_classes.tif` (raster de classes, 4 valores 0–3) é a entrada direta de `services/geo/scripts/export_to_postgis.py` e `generate_web_geojson.py` — os 4 valores de pixel e os limiares (0–3 m / 3–10 m / 10–30 m / >30 m) estão documentados em `HAND_CLASS_MAP` em `export_to_postgis.py` |
| 9 | Vetorização (polygonize) | Comprovado por arquivo | `docs/metodologia-hand.md` descreve o comando exato (`rasterio.features.shapes()` + `dissolve` por `class_id`) usado para gerar `blumenau_hand_classes_vector.gpkg` a partir do raster de classes — script de regeneração incluído no próprio documento |
| 10 | Exportação para GPKG | Comprovado por arquivo | `data/hand/blumenau_hand_classes_vector.gpkg` (~19 MB) existe e é lido por `export_to_postgis.py`/`generate_web_geojson.py` |
| 11 | Estatísticas por classe | Comprovado por arquivo | `data/hand/hand_classes_stats.json` existe com `area_m2`/`percent_area` por `class_id`; os mesmos números aparecem hardcoded em `services/api/app/routers/geo.py::_STATIC_HAND_STATS` e em `apps/web/public/geo/hand_classes_stats.json` (gerado por `generate_web_geojson.py`) — os 3 conjuntos de números batem entre si (17,1% / 9,92% / 20,49% / 52,49%), confirmando consistência |
| 12 | Preparação para PostGIS | Comprovado por arquivo (código pronto) / Pendente de validação (execução) | `export_to_postgis.py::cmd_export_hand_zones` está implementado e correto na leitura do código; **não há confirmação nesta auditoria de que já rodou com sucesso contra um Postgres real** — ver `docs/arvore-arquivos-floodguard-detalhada.md` seção 6.2 |

## Quais arquivos representam o HAND dentro do FloodGuard

```
data/hand/
├─ blumenau_boundary.gpkg                  limite municipal (entrada do pipeline de exportação)
├─ ottobacias_blumenau_union.gpkg          bacias contribuintes (entrada)
├─ blumenau_hand_classes_vector.gpkg       HAND já classificado e vetorizado (resultado principal)
├─ hand_classes_stats.json                 estatística de área por classe (checagem/referência)
└─ previews/*.png                          mapas estáticos de referência visual (não lidos por código)

services/geo/scripts/
├─ export_to_postgis.py                    HAND vetorizado → PostGIS (hand_zones)
├─ generate_web_geojson.py                 HAND vetorizado → GeoJSON simplificado para o mapa web
└─ inspect_hand_artifacts.py               auditoria somente-leitura do repositório HAND externo

services/api/app/engine/spatial_context.py HAND_CLASSES_BY_ID — as 4 classes reais, usadas
                                            pelo motor de risco sem precisar de PostGIS

services/api/app/routers/geo.py            expõe HAND via HTTP (hand-zones, hand-zones/summary,
                                            point-risk-context, demo-map) — lê PostGIS quando
                                            disponível, cai em _STATIC_HAND_STATS quando não

db/migrations/003_hand_layers.sql          schema da tabela hand_zones no PostGIS

apps/web/public/geo/
├─ blumenau_hand_zones_simplified.geojson  zonas HAND para o mapa (fallback estático)
└─ hand_classes_stats.json                 mesma estatística, formato consumido pelo frontend
```

## O que foi tratado devidamente

Com base no código lido nesta auditoria:

- **As 4 classes não foram inventadas.** O raster de origem tem
  exatamente 4 valores de pixel (0–3), e o FloodGuard usa esses 4 — não
  forçou um esquema de 5 ou 6 classes usado em outra parte do histórico do
  projeto (`techguard-sentinela` usa 6 classes contínuas, mas esse motor não
  foi portado). `export_to_postgis.py::cmd_export_hand_zones` inclusive
  **pula e avisa** (sem quebrar) qualquer `class_id` fora do mapeamento
  conhecido, em vez de inventar um rótulo.
- **A correspondência classe→rótulo foi cruzada com uma segunda fonte.**
  `docs/metodologia-hand.md` documenta que os percentuais de área calculados
  aqui (17,08–17,10% / 9,92% / 20,49% / 52,49–52,51%) foram comparados com os
  percentuais já publicados em `americas_techguard_final_poc/src/hand_reference.py`
  (mesma entrega, Período 6) — a pequena diferença entre eles é atribuída à
  simplificação de geometria, dentro da margem esperada. Isso é uma
  validação cruzada real, não apenas uma alegação.
- **Os números batem entre as 3 cópias existentes no repositório**
  (`data/hand/hand_classes_stats.json`, `_STATIC_HAND_STATS` em `geo.py`,
  `apps/web/public/geo/hand_classes_stats.json`) — conferido nesta auditoria,
  os 4 percentuais são idênticos nas 3 fontes.
- **A escolha de vetor em vez de raster é justificada tecnicamente**, não
  arbitrária: PostGIS e a API servem geometria, não raster; o documento
  explica a alternativa considerada (guardar o `.tif` e processar em
  runtime) e por que foi descartada.
- **O dado bruto pesado (DEM ~1,5 GB) foi conscientemente deixado de fora**
  do repositório versionado, com justificativa (regenerável, grande demais)
  documentada em `data/hand/README.md` — não é omissão acidental.
- **O motor de risco nunca trata HAND como valor absoluto de risco.** O
  peso de HAND na fórmula (0.45) é o maior entre os 4 fatores, mas a fusão
  sempre combina com chuva/nível d'água/tendência — e quando HAND não está
  disponível, o motor **não" finge que está**: ativa
  `spatial_context_available=False`, reduz a confiança
  (`CONFIDENCE_FALLBACK=0.55` vs `0.95`) e sinaliza isso na explicação
  textual (testado em `test_fallback_works_without_hand`).

## O que ainda falta validar

Sendo direto sobre as lacunas, sem inflar o que já foi feito:

1. **Execução real contra PostGIS não confirmada nesta auditoria.** O
   código de `export_to_postgis.py` está correto na leitura estática, mas
   não há log/evidência nesta sessão de que `export-all` rodou com sucesso
   contra um banco real recentemente — F2.1 relatou anteriormente falha de
   conexão (Docker/sudo/credencial). Isso é rastreado como pendência
   conhecida, não escondido.
2. **As etapas 3–6 do pipeline (condicionamento hidrológico, direção de
   fluxo, acumulação de fluxo, definição de drenagem) não têm evidência de
   arquivo dentro do FloodGuard** — são inferidas como necessárias, mas os
   parâmetros exatos usados (threshold de acumulação, algoritmo de
   preenchimento) não estão documentados em nenhum artefato acessível aqui.
   Se isso importar para uma auditoria técnica mais rigorosa, precisa vir
   do notebook original no repositório `HAND`.
3. **A associação bairro → classe HAND usada no motor de risco mockado
   (`spatial_context.py::MOCK_REGION_TO_HAND_CLASS`) é ilustrativa, não o
   raster real recortado por bairro oficial** — o próprio código avisa
   isso, mas é o ponto mais fácil de mal-entender ao usar a demo (ver
   próxima seção).
4. **Classes de suscetibilidade não foram validadas contra registros
   históricos de inundação** — calibração é visual/por área histórica de
   eventos, conforme já registrado em `docs/limitacoes.md` (item 5) e
   `docs/metodologia-hand.md`.
5. **Resolução do DEM (~30 m) não captura microtopografia urbana** — guias,
   muros, bueiros, canalização artificial ficam fora da análise.

## Como isso deve aparecer no mapa

Hoje (F5.0, antes da F6.1): `RiskMap.tsx` mostra as 4 classes só como
**cards de texto** (susceptibilidade, % de área, peso de risco), sem
desenhar a geometria — apesar de `blumenau_hand_zones_simplified.geojson`
(6,6 MB, já gerado) existir pronto para ser renderizado.

O comportamento correto, quando o mapa estiver ligado (ver
`docs/mapa-diferencial-plano.md`):

- **4 polígonos coloridos** (um por `class_id`), usando a mesma paleta de
  `apps/web/src/lib/riskTheme.ts` para manter consistência visual com o
  resto do produto (não inventar uma paleta HAND separada);
- **legenda fixa** (`MapLegend.tsx`, componente já implementado e pronto,
  hoje órfão) explicando susceptibilidade por cor;
- **fonte dupla**: PostGIS (`GET /api/geo/hand-zones`) quando disponível,
  GeoJSON estático (`apps/web/public/geo/blumenau_hand_zones_simplified.geojson`)
  como fallback — nunca travar o mapa por falta de banco;
- **aviso explícito** de que a geometria do fallback está simplificada
  (`preserve_topology=False`) e não deve ser usada para análise geométrica
  exata, só visualização.

## Resposta objetiva — "O HAND foi feito como?"

Pipeline de 3 fases, com fronteira clara entre o que roda dentro e fora do
FloodGuard:

1. **Fora do FloodGuard** (repositório `HAND`, `PedroZanette/Hand`): DEM
   Copernicus → recorte Blumenau → processamento hidrológico WhiteboxTools
   (etapas inferidas/pendentes de validação nesta auditoria, mas
   tecnicamente padrão) → raster HAND contínuo → classificação em 4 classes
   discretas (0–3, por faixa de metros).
2. **Ponte** (documentada, script incluído em `docs/metodologia-hand.md`):
   raster de classes → `rasterio.features.shapes()` (polygonize) →
   `dissolve` por classe → simplificação de geometria → GeoPackage
   (`blumenau_hand_classes_vector.gpkg`, ~19 MB) + estatística de área por
   classe.
3. **Dentro do FloodGuard**: esse GeoPackage alimenta dois caminhos em
   paralelo — `export_to_postgis.py` (PostGIS, fonte de verdade quando
   disponível) e `generate_web_geojson.py` (GeoJSON simplificado, fallback
   estático para o mapa web). O motor de risco consome uma terceira cópia,
   ainda mais leve — as 4 classes hardcoded em `spatial_context.py`, sem
   depender de banco nem de arquivo geoespacial em tempo de execução.

## Resposta objetiva — "Ele foi tratado devidamente?"

**Sim, dentro do que é verificável nesta auditoria — com ressalvas
explícitas, não escondidas:**

- As 4 classes usadas são as classes reais do raster, não inventadas;
- A correspondência classe→rótulo foi validada cruzando 2 fontes
  independentes de percentual de área, e os números batem nas 3 cópias
  existentes no repositório;
- Decisões técnicas (vetor vs. raster, simplificação de geometria, exclusão
  do DEM bruto) têm justificativa escrita, não são arbitrárias;
- O motor de risco nunca trata HAND como certeza absoluta — degrada
  confiança explicitamente quando o contexto espacial não está disponível.

**Mas** — e isso é a parte que "tratado devidamente" não pode omitir:

- a execução real do pipeline hidrológico completo (etapas 1–6) não pôde
  ser reconstituída por arquivo dentro deste repositório, só inferida;
- a exportação para PostGIS não tem confirmação recente de execução
  bem-sucedida;
- a associação bairro→classe do motor mockado é ilustrativa, e existe risco
  real de alguém interpretar isso como "o raster recortado por bairro
  oficial" se não ler o código-fonte;
- nada disso foi validado contra evento de inundação histórico real.

Ou seja: **o tratamento de dados que existe é honesto e rastreável**, mas o
sistema continua sendo uma Prova de Conceito — a validação operacional
completa (hidrologia ponta a ponta + calibração contra eventos reais)
permanece pendente, exatamente como já registrado em `docs/limitacoes.md`.
