# Mapa como diferencial — diagnóstico e plano (F6.1)

> Nota de contexto desta rodada: enquanto esta sessão avançava a
> documentação (Partes A–D), a implementação do mapa descrita neste
> documento foi feita **em paralelo, na mesma máquina/repositório**, por
> outra sessão interativa de Claude Code sobre o mesmo `RiskMap.tsx`/`api.ts`.
> Este documento registra o diagnóstico original (por que o mapa não era
> diferencial), o plano que orientaria a correção, e o estado real após a
> implementação — verificado lendo o código atual, não assumido.

## Por que o mapa é (deveria ser) diferencial

Dos 4 pilares técnicos citados no produto (HAND, motor de risco explicável,
telemetria simulada, comunicação simulada), **HAND é o único que é
inerentemente geoespacial** — suscetibilidade varia por lugar, não é um
número único para o município inteiro. Um mapa é o único formato de
interface que comunica isso de forma direta: "esta área aqui é mais
suscetível que aquela ali" é uma frase que um gráfico de barras ou um card
de texto não consegue passar tão bem quanto um polígono colorido no lugar
certo do território. Para uma plataforma GovTech B2G vendida a uma Defesa
Civil municipal, o mapa é também o artefato mais fácil de "vender" numa
demonstração — é o que mais se parece com uma ferramenta operacional de
verdade.

## Por que ele não funcionava como diferencial (diagnóstico, estado F5.0)

Levantamento feito no início desta rodada, lendo `RiskMap.tsx` e
`package.json` como estavam antes da correção:

1. **A dependência já estava instalada e não era usada.**
   `apps/web/package.json` já tinha `leaflet@^1.9.4` e
   `react-leaflet@^5.0.0` em `dependencies`, e `@types/leaflet` em
   `devDependencies` — ou seja, alguém já havia decidido usar Leaflet
   (`docs/decisoes-arquitetura.md` inclusive já cita "Leaflet" na stack
   oficial do frontend), mas nenhum componente importava `react-leaflet`.
2. **Os dados geográficos já estavam prontos e não eram usados.**
   `apps/web/public/geo/` já continha `blumenau_boundary.geojson`,
   `blumenau_basins.geojson`, `blumenau_hand_zones_simplified.geojson`
   (6,6 MB) e `hand_classes_stats.json`, gerados por
   `services/geo/scripts/generate_web_geojson.py`. `lib/api.ts` já expunha
   `fetchStaticGeoJSON()`, `fetchDemoMap()` e `fetchDemoPoints()` prontos
   para consumir isso.
3. **`RiskMap.tsx` não usava nada disso.** A página só chamava
   `fetchGeoStatus()` (texto) e `fetchHandZonesSummary()` (estatística
   agregada) e renderizava 4 `<div>` com número — nenhum `<MapContainer>`,
   nenhuma geometria desenhada. `MapLegend.tsx` (legenda pronta para um
   mapa) existia como componente órfão, sem nenhum lugar que o importasse.
4. **Resultado**: a página funcionava (sem erro, com fallback textual
   correto quando PostGIS falhava), mas visualmente era indistinguível de
   qualquer outra tela de "lista de estatísticas" do produto — não entregava
   o que só um mapa entrega.

## O que faltava (lista de gaps, no início da rodada)

- Nenhum `<MapContainer>` montado.
- Nenhuma camada `<GeoJSON>` lendo os arquivos já existentes.
- Nenhum marcador para os 3 cenários de demonstração.
- Nenhuma legenda visível (`MapLegend.tsx` pronto, mas não importado).
- Nenhuma explicação de risco acessível a partir de um clique no mapa.
- Nenhum uso do caminho PostGIS real (`GET /api/geo/municipality/blumenau`,
  `GET /api/geo/hand-zones`) — só o caminho agregado
  (`hand-zones/summary`), que nunca traz geometria.

## Plano de execução (conforme solicitado nesta rodada)

1. Instalar Leaflet/react-leaflet — **já estava instalado**, confirmado em
   `package.json`, nenhuma instalação necessária.
2. Gerar GeoJSON simplificado a partir dos GPKG — **já estava feito**
   (`generate_web_geojson.py`, saída em `apps/web/public/geo/`).
3. Servir fallback estático — **já estava feito** (Vite serve `public/` como
   estático automaticamente; `fetchStaticGeoJSON()` já existia).
4. Renderizar limite de Blumenau — **implementado nesta rodada**: `GeoJSON`
   com contorno tracejado, sem preenchimento.
5. Renderizar zonas HAND — **implementado nesta rodada**: `GeoJSON` colorida
   por `susceptibility`, reaproveitando a paleta `RISK_THEME` já usada no
   resto do produto (sem inventar cor nova).
6. Renderizar pontos dos cenários — **implementado nesta rodada**: 3
   `Marker` (ícone customizado via `L.divIcon`, colorido por `risk_level`),
   usando `fetchDemoPoints()` (já existia em `lib/api.ts`, sem consumidor
   antes).
7. Criar legenda — **implementado nesta rodada**: `MapLegend.tsx` (já
   existia, órfão) passou a ser importado e renderizado sobre o mapa.
8. Ligar clique no mapa com explicação de risco — **implementado nesta
   rodada**: `Popup` em cada marcador mostra nome do cenário, score e a
   `explanation` textual já gerada pelo motor de risco; `Popup`/`bindPopup`
   em cada zona HAND mostra classe, susceptibilidade, %área e peso de
   risco.
9. Manter fallback quando PostGIS falhar — **implementado nesta rodada**:
   estratégia de dois passos — tenta `fetchMunicipalityBlumenau()` +
   `fetchHandZonesGeoJSON()` (PostGIS real) só quando `fetchDemoMap()`
   reporta `source: "postgis"`; qualquer falha (banco indisponível, ou
   `demoMap` já veio `static_fallback`) cai automaticamente nos arquivos
   estáticos — nunca trava a página.

## Estado real após a implementação (verificado lendo o código atual)

`apps/web/src/pages/RiskMap.tsx` hoje:

- Monta `<MapContainer>` centrado em Blumenau (`[-26.9194, -49.0661]`, zoom
  11), com `<TileLayer>` do OpenStreetMap como mapa-base.
- Renderiza `<GeoJSON>` de zonas HAND com `style` dinâmico por feature
  (`themeForSusceptibility`, mapeando `alta/media/baixa/muito_baixa` para as
  4 cores de risco) e popup por zona via `onEachFeature`.
- Renderiza `<GeoJSON>` do limite municipal com contorno tracejado.
- Renderiza 3 `<Marker>` com ícone colorido customizado (`L.divIcon`, evita
  o bug clássico de ícone padrão do Leaflet quebrado sob bundlers como
  Vite) e `<Popup>` com nome/score/explicação.
- Sobrepõe `<MapLegend>`.
- Decide a fonte da geometria em dois `useEffect` encadeados: primeiro
  descobre via `fetchDemoMap()` se o backend está em modo `postgis` ou
  `static_fallback`; se `postgis`, tenta os endpoints reais
  (`fetchMunicipalityBlumenau`, `fetchHandZonesGeoJSON`) e só cai no
  estático se essa tentativa falhar.
- Mostra aviso textual (`[fallback estático] {mensagem}`) quando está
  usando o caminho estático, e `EmptyState` enquanto carrega.

`apps/web/src/lib/api.ts` ganhou `fetchMunicipalityBlumenau()` e
`fetchHandZonesGeoJSON()`, além das funções que já existiam
(`fetchDemoMap`, `fetchDemoPoints`, `fetchStaticGeoJSON`).

`apps/web/src/main.tsx` importa `leaflet/dist/leaflet.css` globalmente
(necessário para o CSS base do Leaflet — sem isso o mapa renderiza com
tiles desalinhados/controles quebrados).

## Área contribuinte vs. limite municipal (F6.2.1)

Achado da auditoria F6.2, verificado numericamente comparando os bounding
boxes dos dois GeoJSON servidos ao mapa:

| Camada | Longitude | Latitude |
|---|---|---|
| `blumenau_hand_zones_simplified.geojson` | −49,2359 a −48,9126 | −27,2827 a −26,5261 |
| `blumenau_boundary.geojson` | −49,2014 a −49,0121 | −27,1326 a −26,6131 |

As zonas HAND **extrapolam o limite municipal nos quatro lados**. Isso não é
erro de dado: o HAND foi calculado sobre a **área hidrologicamente
contribuinte** (as ottobacias que drenam para a região), não sobre o
recorte administrativo. Água não respeita divisa de município — recortar a
bacia no limite político descartaria terreno que de fato influencia o
escoamento em Blumenau.

O risco aqui é de **leitura**, não de dado: numa tela intitulada "Mapa de
risco — Blumenau/SC", ver Timbó, Indaial, Gaspar, Ilhota e Benedito Novo
coloridos leva o avaliador a achar que há erro de recorte.

**Decisão tomada na F6.2.1:** não recortar os dados (seria uma decisão
técnica com perda de informação, fora do escopo de uma rodada de correção),
e sim tornar o comportamento explícito na interface:

1. `SectionCard` abaixo do mapa explicando a área contribuinte e dizendo
   que os dados não foram recortados de propósito;
2. limite municipal repintado para ficar visível — halo escuro
   (`#040b14`, weight 7) sob linha ciano (`#22d3ee`, weight 3), sem
   `dashArray`; antes o contorno existia no DOM mas sumia visualmente sob o
   preenchimento das zonas;
3. entrada "Limite municipal — Blumenau/SC" na legenda.

Se em algum momento o recorte por município passar a ser desejado, isso é
decisão técnica explícita para uma fase futura — e deve ser feita no
pipeline (`generate_web_geojson.py` / `export_to_postgis.py`), não com
clip no frontend.

## O que ainda falta validar

Sendo honesto sobre o que a leitura de código não pode confirmar sozinha:

1. **Execução visual real não foi verificada nesta sessão de documentação**
   — ninguém rodou `npm run dev` e abriu `/mapa` num browser durante esta
   rodada de trabalho (Parte G desta tarefa roda `npm run build`, que
   verifica compilação/tipos, não comportamento visual em runtime).
2. **Caminho PostGIS real (`source: "postgis"`) não foi exercitado** — como
   já registrado em `docs/hand-processamento-detalhado.md`, não há
   confirmação recente de que `export_to_postgis.py export-all` rodou com
   sucesso contra um banco real; o caminho testável de fato hoje é o
   fallback estático.
3. **Dependência de rede externa para o mapa-base.** `TileLayer` busca
   tiles de `tile.openstreetmap.org` — em ambiente sem internet (ex.: CI
   isolado), o mapa monta mas fica sem imagem de fundo; as camadas de dado
   (HAND, limite, marcadores) não dependem disso e continuam renderizando.
4. **Nenhum teste automatizado cobre `RiskMap.tsx`** — é página React, fora
   do escopo do `pytest` do backend; não há suíte de teste de frontend
   (Vitest/Testing Library) configurada neste projeto ainda. `npm run
   build` valida só compilação TypeScript + bundle, não comportamento.

## Recomendação para a próxima rodada (F6.2, se necessário)

- Rodar `npm run dev` + abrir `/mapa` manualmente (ou via
  `example-skills:webapp-testing`/Playwright) para confirmar renderização
  visual real, inclusive o caminho de fallback (simular PostGIS fora do ar).
- Confirmar execução de `export_to_postgis.py export-all` contra um Postgres
  real, para exercitar o caminho `source: "postgis"` pelo menos uma vez.
- Considerar um teste de frontend mínimo (Vitest) que monte `RiskMap.tsx`
  com `fetchStaticGeoJSON`/`fetchDemoPoints` mockados e verifique que as
  camadas montam sem lançar exceção — não cobre pixel, mas cobre regressão
  de import quebrado.
