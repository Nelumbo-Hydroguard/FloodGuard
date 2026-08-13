# FloodGuard

Plataforma GovTech B2G de apoio à tomada de decisão da Defesa Civil em eventos de
alagamento e inundação urbana, com piloto em Blumenau/SC.

> Status: F9.1 integrada em `main` — mapa (`/mapa`) mostra os alertas
> simulados de `/alertas` como marcadores clicáveis, com destaque pulsante
> no nível crítico. `geo` (F2), `risk`/`telemetry`/`scenarios` (F3),
> `alerts`/`shelters` (F7) e o frontend que os consome (F4/F6/F7/F9.1) já
> têm regra de negócio real ou simulação consistente ponta a ponta — nenhum
> ainda persiste dado em banco. **67 de 67 testes de backend passando.**
> Autoria coletiva registrada — ver
> [docs/autoria-licenca.md](docs/autoria-licenca.md). Documentação de
> apresentação: [docs/resumo-executivo-floodguard.md](docs/resumo-executivo-floodguard.md),
> [docs/roteiro-demo-floodguard.md](docs/roteiro-demo-floodguard.md). Este
> README será atualizado a cada fase.

## O que é?

FloodGuard integra:

- **Motor de risco** — cruza contexto espacial HAND com chuva acumulada,
  nível d'água e tendência temporal numa fórmula explicável, com
  justificativa textual e fallback quando HAND não está disponível
  ([docs/motor-de-risco.md](docs/motor-de-risco.md)).
- **Pipeline geoespacial HAND** — DEM + bacias hidrográficas + limites municipais,
  processados com WhiteboxTools/Rasterio/GeoPandas.
- **Banco espacial** — PostgreSQL + PostGIS.
- **Painel da Defesa Civil** — mapa de risco, sensores simulados, triagem de
  incidentes, gestão de abrigos e emissão de alertas.
- **Visão mínima do cidadão** — consulta de alertas, consulta de abrigos e
  solicitação simples de ajuda.
- **Simulador de telemetria** — sensores de nível d'água e chuva simulados por
  software.

## O que não é

- Não é um sistema operacional real. Não substitui a Defesa Civil.
- Não possui sensores físicos, gateways LoRaWAN ou dispositivos Meshtastic em
  operação real — a camada de comunicação UniMesh/LoRa é simulada
  (`implemented: false` no payload).
- HAND é uma variável topográfica de suscetibilidade, não uma previsão completa
  de inundação nem um modelo hidrodinâmico.
- Finalidade acadêmica, experimental e demonstrativa.

Detalhes em [docs/limitacoes.md](docs/limitacoes.md).

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind + Leaflet |
| Backend | FastAPI |
| Banco | PostgreSQL + PostGIS |
| Geoprocessamento | Python (WhiteboxTools, Rasterio, GeoPandas, Shapely) |
| Telemetria | Simulador Python |
| Comunicação de campo | UniMesh/LoRa simulado (integração real é roadmap) |

## Origem do projeto

FloodGuard consolida trabalho de vários repositórios anteriores do Americas
TechGuard, cada um cobrindo uma parte do sistema:

| Repositório de origem | Contribuição para o FloodGuard |
|---|---|
| `techguard-sentinela` | Motor de risco canônico, API FastAPI, frontend React, triagem de crise, abrigos |
| `HAND` | Pipeline geoespacial HAND, notebooks e artefatos de Blumenau (Período 6) |
| `americas_techguard_final_poc` | Classificação em 4 níveis, payload UniMesh/LoRa simulado, textos de auditabilidade |
| `urbanflood_urnn_demo` | Fora do MVP — referência de roadmap (nowcasting U-RNN) |

Decisões de arquitetura completas em
[docs/decisoes-arquitetura.md](docs/decisoes-arquitetura.md).

## Autoria

FloodGuard é trabalho de equipe: **João Benvenutti**, **Nyrx Oliveira** e
**Pedro Zanette** concordaram em consolidar os códigos e componentes que
cada um desenvolveu anteriormente em um único repositório.

- **João Benvenutti** — motor de risco (HAND/NDVI/NDBI, chuva efetiva,
  saturação hidrológica), API FastAPI e frontend React do
  `techguard-sentinela`.
- **Pedro Zanette** — pipeline geoespacial HAND (`HAND`), classificação de
  risco em 4 níveis e payload UniMesh/LoRa simulado
  (`americas_techguard_final_poc`), consolidação do monorepo FloodGuard.
- **Nyrx Oliveira** — parte do acordo de equipe; repositório individual sem
  código reaproveitável nesta consolidação.

Repositório: [Nelumbo-Hydroguard/FloodGuard](https://github.com/Nelumbo-Hydroguard/FloodGuard)
no GitHub. Proveniência completa por componente, autorizações e créditos individuais:
[docs/autoria-licenca.md](docs/autoria-licenca.md).

## Roadmap

Funcionalidades planejadas para além do MVP (app do cidadão completo, hardware
real, LoRaWAN/Meshtastic real, MQTT real, nowcasting) estão documentadas em
[docs/roadmap.md](docs/roadmap.md).

## Estrutura do repositório (planejada)

```
FloodGuard/
├─ docs/               documentação de produto, arquitetura e roadmap
├─ services/api/       backend FastAPI
├─ services/geo/       pipeline geoespacial HAND
├─ services/simulator/ simulador de telemetria
├─ apps/web/           frontend React + Vite + Tailwind
├─ db/                 migrations e seeds PostGIS
├─ data/               artefatos geoespaciais leves versionados
├─ infra/              docker-compose (api + web + postgis)
└─ mentorias/          atas e materiais de mentoria
```

O esqueleto acima (`services/`, `apps/`, `db/`, `infra/`) existe desde a F1.
`data/hand/` entrou na F2. O motor de risco (`services/api/app/engine/`)
entrou na F3. Alertas e abrigos simulados via API entraram na F7 (ver seção
abaixo). Ainda pendente: persistência real de qualquer um desses dados —
tudo hoje é recalculado em memória ou fixo em lista, sem gravar em banco.

## F2 — dados HAND reais

O coração geoespacial do projeto está conectado:

- `data/hand/` — limite municipal, bacias contribuintes e zonas HAND
  vetorizadas de Blumenau, copiados do repositório `HAND` (artefatos leves
  only — nada de DEM bruto de 1,5 GB).
- `services/geo/scripts/export_to_postgis.py` — exporta esses artefatos
  para as tabelas `municipalities`, `basins` e `hand_zones`
  (`db/migrations/003_hand_layers.sql`, com índice GIST).
- `GET /api/geo/municipality/blumenau`, `/api/geo/basins/blumenau`,
  `/api/geo/hand-zones`, `/api/geo/hand-zones/summary` e
  `/api/geo/point-risk-context` já leem dado real do PostGIS — não são mais
  placeholder.
- `point-risk-context` dá só o contexto espacial HAND de um ponto. O motor
  de risco completo que consome esse contexto foi implementado na F3.

Metodologia, proveniência dos dados e limitações:
[docs/metodologia-hand.md](docs/metodologia-hand.md). Passo a passo de
importação: [db/seeds/import_hand_blumenau.md](db/seeds/import_hand_blumenau.md).

### F2.1 — status da validação end-to-end

`docker-compose.yml` foi conferido e está correto (imagem
`postgis/postgis:16-3.4`, migrations montadas em `docker-entrypoint-initdb.d`
na ordem certa, healthcheck). A sintaxe das migrations foi validada de
verdade contra um Postgres 18 local descartável: `002_core_tables.sql`
aplica 100% limpo; `003_hand_layers.sql` também — todas as 10 tabelas
criadas, `ALTER TABLE ... DROP/ADD CONSTRAINT` do FK de `risk_assessments`
confirmados, `gen_random_uuid()` funcionando. O único ponto não validado
neste ambiente foi a extensão PostGIS em si (sem acesso a `docker` nem
`sudo apt install postgresql-*-postgis-3` aqui) — ou seja, `GEOMETRY(...)`
e os índices `USING GIST` não foram exercitados contra PostGIS real.

Isso significa que a validação end-to-end completa (banco subindo via
Docker, importação HAND rodando, `/api/geo/*` respondendo com dado real)
está **pronta para rodar, mas não foi executada nesta sessão**. Para
concluir, rode localmente (requer Docker funcionando e usuário no grupo
`docker`):

```bash
cp .env.example .env
docker compose up -d postgis
docker compose logs postgis   # confirma que 001/002/003 aplicaram sem erro

export DATABASE_URL="postgresql+psycopg://floodguard:floodguard@localhost:5432/floodguard"
scripts/dev/run_export.sh     # cria venv de services/geo se preciso, roda export-all

docker compose up -d api
scripts/dev/test_geo_endpoints.sh
```

`scripts/dev/apply_migrations.sh` existe para aplicar as migrations fora do
boot automático do container (útil se você preferir rodar contra um Postgres
já existente em vez do `postgis` do compose).

## F3 — motor de risco

Motor de risco explicável rodando em `services/api/app/engine/`, **sem
dependência obrigatória de banco** — por isso avançou mesmo com a F2.1
bloqueada por falta de acesso a Docker/PostGIS local:

- `risk_engine.py` combina contexto HAND (0.45), chuva acumulada (0.30),
  nível d'água (0.20) e tendência temporal (0.05) numa fórmula única,
  auditável. Contexto HAND vem do payload (`hand_class_id`/
  `hand_risk_weight`) ou de um lookup mockado por região
  (`spatial_context.py`) — não exige consulta ao PostGIS.
- Fallback automático quando HAND não está disponível: `confidence` cai de
  0.95 para 0.55, peso redistribuído entre os fatores restantes,
  justificativa deixa isso explícito.
- `telemetry_normalizer.py` aceita payload bruto simulado com nomes de
  campo variados (`rainfall`/`rainfall_mm`, `lat`/`latitude` etc.).
- `mesh_payload.py` empacota o resultado como payload UniMesh/LoRa
  simulado — `implemented: false` sempre, inclusive em risco crítico
  (testado).
- Endpoints novos: `POST /api/risk/evaluate`, `POST
  /api/risk/evaluate-batch`, `GET /api/scenarios/demo` (3 cenários fixos
  rodados pelo motor real), `POST /api/telemetry/normalize`, `POST
  /api/telemetry/mesh-payload`.
- **27 testes unitários** entregues nesta fase (`services/api/tests/`) —
  total atual do projeto é 67/67 (F3+F6+F7+F9+F9.1, ver seções F8/F9/F9.1
  abaixo), todos passando sem Postgres: score sempre entre 0 e 1, crítico quando todos os
  fatores estão altos, seguro quando todos estão baixos, fallback funciona,
  explicação muda com os fatores, payload mesh sempre `implemented: false`,
  todos os endpoints novos respondem.

Fórmula completa, fatores, exemplos reais e créditos:
[docs/motor-de-risco.md](docs/motor-de-risco.md).

```bash
cd services/api
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest -v
```

## F4 — dashboard web

Frontend React passou a consumir a API real do motor de risco (F3) — nada
hardcoded quando a API está no ar; fallback só quando ela está fora do ar
ou o PostGIS ainda não foi populado.

Telas:

| Rota | Consome | O que mostra |
|---|---|---|
| `/painel` | `GET /api/risk/status`, `GET /api/scenarios/demo` | 3 cards de risco (seguro/alerta/crítico) com score, confiança, fatores, justificativa e ação recomendada — vindos do motor real, não hardcoded |
| `/mapa` | `GET /api/geo/demo-map`, `GET /api/geo/demo-points`, camadas de `/geo/*.geojson` (ou `geo/municipality` + `geo/hand-zones` quando há PostGIS) | Mapa Leaflet com zonas HAND, limite municipal e marcadores de cenário; fallback estático automático quando o banco está fora do ar |
| `/alertas` | `GET /api/scenarios/demo` | Lista de eventos simulados (nível, região, explicação, ação recomendada, horário) derivados dos 3 cenários fixos |
| `/telemetria` | `POST /api/risk/evaluate`, `POST /api/telemetry/mesh-payload` | Formulário para testar o motor de risco com valores livres; botão separado gera o payload UniMesh/LoRa simulado (`implemented: false`) |
| `/abrigos` | — (estático, F6.2.1) | 3 abrigos **simulados** com capacidade/ocupação/status — dados fixos no frontend, sem banco e sem API; CRUD real é F7 |
| `/sobre` | — (estático) | GovTech B2G, Defesa Civil, Blumenau/SC, HAND = suscetibilidade, motor = PoC explicável, U-RNN = roadmap |
| `*` (qualquer rota desconhecida) | — (estático, F6.2.1) | Página 404 dentro do Layout, com nav e atalhos — nunca mais tela vazia |

Endpoints reais consumidos pelo frontend (todos com prefixo `/api/`, exceto
`/health`): `geo/demo-map`, `geo/demo-points`, `geo/municipality/blumenau`,
`geo/hand-zones`, `risk/status`, `risk/evaluate`, `scenarios/demo`,
`telemetry/mesh-payload`. `risk/evaluate-batch`, `telemetry/normalize`,
`geo/hand-zones/summary` e `geo/basins/blumenau` existem na API mas não têm
consumidor dedicado no frontend ainda.

**Comportamento sem PostGIS (F6.2.1).** `GET /api/geo/status` reporta o
estado real do banco (`connected` só com PostGIS respondendo *e*
`hand_zones` populada; caso contrário `degraded`/`unavailable`) e nunca
devolve 500. Os 5 endpoints que leem o banco
(`municipality/blumenau`, `basins/blumenau`, `hand-zones`,
`hand-zones/summary`, `point-risk-context`) respondem **503** com mensagem
acionável em vez de 500 cru. `demo-map` e `demo-points` continuam
funcionando sempre.

Componentes novos: `RiskCard`, `StatusBadge`, `FactorBar`
(`apps/web/src/components/`) — reutilizados em `/painel`, `/alertas` e
`/telemetria`.

**Limitações conhecidas:**

- ~~Região dos alertas simulados mapeada à mão no frontend~~ — corrigido na
  F6: `RiskEvaluationResponse` agora carrega `region` (eco do que veio no
  request), `Alertas.tsx` usa `result.region` direto, sem mapa duplicado.
- ~~`/mapa` sem cartografia~~ — corrigido na F6: Leaflet real, com fallback
  geoespacial estático (ver seção F6 abaixo).
- Nenhuma tela usa `evaluate-batch` — cada avaliação em `/telemetria` é uma
  chamada individual a `/api/risk/evaluate`.

## F6 — identidade visual, mapa funcional e backend de demo

Objetivo: elevar a PoC pra qualidade de demonstração — visual de centro de
operações GovTech, mapa que funciona mesmo sem PostGIS, backend que nunca
quebra o frontend por falha de banco.

### Identidade visual

Paleta centralizada em `apps/web/tailwind.config.ts` (tokens `navy`,
`accent`, `risk`) e `apps/web/src/lib/riskTheme.ts` (cor/label por
`RiskLevel`) — nenhum componente redefine cor de risco por conta própria.
Componentes novos: `PageHeader`, `SectionCard`, `MetricCard`, `DemoNotice`,
`EmptyState`, `ErrorState`, `RiskLegend`, `MapLegend`. `Layout.tsx` ganhou
estado ativo de navegação e badge fixo "Modo demo — dados simulados".

### Mapa funcional sem PostGIS

`/mapa` agora renderiza cartografia real com **Leaflet** (`leaflet` +
`react-leaflet`, ~50 KB gzip): limite de Blumenau, 4 zonas de suscetibilidade
HAND coloridas (mesma escala verde→vermelho do resto da plataforma:
`muito_baixa`→seguro, `baixa`→atenção, `media`→alerta, `alta`→crítico),
marcadores dos 3 cenários demo com popup, e legenda fixa no canto.

**Fonte da geometria, em ordem de tentativa:**
1. `GET /api/geo/demo-map` diz se o PostGIS está respondendo (`source: "postgis"` ou `"static_fallback"`).
2. Se `postgis`: busca `/api/geo/municipality/blumenau` e `/api/geo/hand-zones` (dado real).
3. Se `static_fallback` (ou a busca acima falhar): carrega
   `apps/web/public/geo/blumenau_boundary.geojson` e
   `blumenau_hand_zones_simplified.geojson` — arquivos estáticos servidos
   pelo Vite, gerados por
   `services/geo/scripts/generate_web_geojson.py` a partir de `data/hand/`.

O mapa **nunca fica vazio**: os marcadores de cenário vêm de
`GET /api/geo/demo-points`, que roda o motor de risco real e não depende de
banco — sempre disponíveis, com ou sem PostGIS.

Para regenerar os arquivos estáticos (se os dados HAND mudarem):
```bash
cd services/geo
.venv/bin/python scripts/generate_web_geojson.py
```
Tamanho total gerado: ~7,3 MB (limite pedido: <10 MB; `blumenau_hand_zones_simplified.geojson`,
o maior, tem ~6,4 MB — simplificado de ~48 MB brutos com
`simplify(0.0005, preserve_topology=False)`; `preserve_topology=True` foi
testado e trava, > 3 min sem terminar, na geometria real).

### Backend de demo

Dois endpoints novos em `services/api/app/routers/geo.py`, nenhum exige
banco para responder 200:

| Endpoint | Depende de PostGIS? | O que faz |
|---|---|---|
| `GET /api/geo/demo-map` | Tenta, cai em fallback | Status + estatísticas das 4 classes HAND — `source: "postgis"` (dado real) ou `"static_fallback"` (números de referência da F2, mesmos do `hand_classes_stats.json`) |
| `GET /api/geo/demo-points` | Não | 3 pontos dos cenários fixos, rodados pelo motor de risco real (mesma fonte de `/api/scenarios/demo`) |

`demo-map` nunca retorna 500 nem expõe credencial de banco na mensagem de
erro — só loga o tipo da exceção no servidor. Testado em
`services/api/tests/test_geo_demo.py`.

### Consistência de dados

`RiskEvaluationResponse` passou a carregar `region` (eco do que veio no
request) — `Alertas.tsx` usa isso direto, sem mais duplicar a região dos
cenários fixos no frontend. `/painel`, `/alertas` e `/mapa` usam os mesmos
4 níveis de risco e a mesma paleta (`riskTheme.ts`).

### Telas atualizadas

| Rota | O que mudou na F6 |
|---|---|
| `/sobre` | Blocos "Implementado / Simulado / Roadmap" lado a lado |
| `/painel` | Indicadores (cenários avaliados, maior risco, confiança média, comunicação simulada) + "próxima ação recomendada" |
| `/telemetria` | Atalhos de cenário (seguro/alerta/crítico), payload mesh em bloco separado com selo `implemented: false` |
| `/alertas` | Filtro por nível, região vinda da API (não mais duplicada no frontend) |
| `/mapa` | Cartografia Leaflet real + fallback estático, nunca vazio |

## F7 — alertas e abrigos simulados

Objetivo: dar a `/alertas` e `/abrigos` uma fonte de dados de verdade (API,
não mais mock local no frontend), mantendo tudo explicitamente simulado —
sem persistência, sem emissão real da Defesa Civil, sem vínculo confirmado
com instituição real.

### Backend

Dois routers que eram placeholder da F1 (`app/routers/{alerts,shelters}.py`)
ganharam endpoints de demo, nenhum exige banco:

| Endpoint | Fonte | O que faz |
|---|---|---|
| `GET /api/alerts/status` | — | `status: "demo"`, `persistence: false`, mensagem explicando a simulação |
| `GET /api/alerts/demo` | `app.routers.scenarios.DEMO_SCENARIOS` | Lista de alertas — cada um reavaliado pelo motor de risco (F3) a cada chamada, não gravado em banco |
| `GET /api/alerts/demo/{id}` | idem | Detalhe de 1 alerta (`id` = `seguro`/`alerta`/`critico`); `id` desconhecido → 404 com mensagem acionável |
| `GET /api/shelters/status` | — | `status: "demo"`, `persistence: false` |
| `GET /api/shelters/demo` | lista fixa em `shelters.py` | 4 abrigos simulados (baixa/média/quase lotado/indisponível), nomes genéricos ("Abrigo Municipal Simulado") |

`DemoAlert.status` usa sempre o prefixo `simulated_` (`simulated_monitoring`
/`_attention`/`_active`/`_critical`) — nunca "active" sozinho, pra nunca
parecer um alerta real emitido pela Defesa Civil. Alertas e abrigos
compartilham as mesmas 4 regiões simuladas (Centro, Velha, Itoupava Norte,
Garcia) já usadas pelos cenários de risco e pelo lookup HAND mockado
(`app/engine/spatial_context.py`) — mesma geografia de demonstração em todo
o produto, coordenadas reaproveitadas, não inventadas soltas.

### Frontend

| Rota | O que mudou na F7 |
|---|---|
| `/alertas` | Passou a consumir `GET /api/alerts/demo` em vez de `/api/scenarios/demo` direto — título e status vêm prontos da API, sem lógica duplicada no frontend. Novo filtro "somente ativos/críticos", link para o detalhe de cada evento |
| `/alertas/:id` | Deixou de ser placeholder — consome `GET /api/alerts/demo/{id}`, mostra score/confiança/explicação/ação/status, erro amigável com link de volta se o `id` não existir |
| `/abrigos` | Deixou de usar dados fixos no frontend — consome `GET /api/shelters/demo`, indicadores agregados (capacidade, ocupação, vagas), 4 perfis de ocupação com cor própria |
| `/mapa` | Camada opcional de marcadores de abrigo (losango ciano, ícone distinto dos pontos de cenário), seção com link para `/abrigos` |

### Limitações que continuam de pé

- Nada é persistido — nem alerta nem abrigo sobrevive a um restart da API;
  as tabelas `alerts`/`shelters`/`shelter_requests` (`002_core_tables.sql`)
  continuam vazias.
- Não há emissão manual de alerta por um operador (sem autenticação, sem
  formulário de escrita) — os únicos alertas possíveis são os 3 cenários
  fixos do motor de risco.
- Não há vínculo confirmado entre os abrigos simulados e uma instituição
  real de Blumenau — os nomes são genéricos de propósito.
- Cadastro de abrigo pelo cidadão e triagem pelo operador seguem roadmap
  (`docs/roadmap.md`).

## F8 — documentação final e preparação de apresentação

Sem feature nova — objetivo desta fase é consolidar documentação para
avaliação acadêmica (SENAI) e para apresentação ao vivo:

| Documento | Conteúdo |
|---|---|
| [docs/plano-desenvolvimento-senai-floodguard.md](docs/plano-desenvolvimento-senai-floodguard.md) | Documento acadêmico completo — introdução, produto, arquitetura, requisitos (RF/RNF), dados, validação, gerenciamento, riscos, cronograma, limitações e roadmap |
| [docs/roteiro-demo-floodguard.md](docs/roteiro-demo-floodguard.md) | Roteiro de demo de 10 minutos, ordem de telas, o que falar em cada uma, respostas para perguntas prováveis, plano B, frases a evitar/usar |
| [docs/checklist-apresentacao-floodguard.md](docs/checklist-apresentacao-floodguard.md) | Checklist prático — comandos, URLs, o que conferir antes de apresentar |
| [docs/resumo-executivo-floodguard.md](docs/resumo-executivo-floodguard.md) | 1 página — problema, solução, diferencial, arquitetura, estado atual, validação, limitações, próximos passos |

Estado validado nesta fase: **62 de 62 testes de backend passando**
(65/65 após as regressões acrescentadas na F9),
`npm run build` do frontend limpo, todos os endpoints e rotas de F0–F7
respondendo como esperado.

## F9 — auditoria de excelência

Varredura final de backend, frontend, documentação e demo antes da banca,
com correções controladas (sem feature nova, sem mudança de escopo).
Relatório completo: [docs/auditoria-excelencia-f9.md](docs/auditoria-excelencia-f9.md).

Dois achados de severidade P1, ambos corrigidos e cobertos por teste:

- **`GET /api/geo/demo-map` respondia 500** quando o PostGIS estava
  conectado mas `hand_zones` estava vazia — estado de quem roda o
  `docker compose up` acima sem o importador. Como o frontend usa esse
  endpoint para escolher a fonte do mapa, `/mapa` caía inteiro em tela de
  erro em vez de usar o fallback. Tabela vazia passou a ser tratada como
  indisponibilidade de dado, não como erro.
- **O seletor "Classe HAND" em `/telemetria` não tinha efeito** enquanto o
  campo "Peso HAND" estivesse preenchido (o backend prioriza o peso): a tela
  exibia um peso e o motor usava outro, e escolher "sem contexto HAND" não
  ativava o fallback. O seletor passou a sincronizar o peso.

Total de testes de backend nesta fase: **65/65**.

## F9.1 — alertas simulados no mapa

Sem feature nova de fundo — melhoria controlada de UX, avaliada contra o
projeto de referência externo `techguard-sentinela` (João Benvenutti,
analisado só como inspiração, código não copiado). `/mapa` passou a mostrar
os mesmos alertas simulados de `/alertas` como marcadores clicáveis:

- Popup com título, região, status, score, confiança, explicação, ação
  recomendada e aviso `[simulado]`, com link para `/alertas/:id` e, quando
  aplicável, `/telemetria`.
- Marcador do alerta crítico com destaque pulsante (`animate-ping`,
  Tailwind — sem dependência nova).
- Navegação cruzada: `/alertas` e `/alertas/:id` ganharam link "Ver no
  mapa", que leva a `/mapa?alert=<id>` — o mapa dá `flyTo` até o marcador e
  abre o popup automaticamente.
- Backend: `DemoAlert` (`GET /api/alerts/demo`) passou a expor
  `latitude`/`longitude`, vindos da mesma fonte já usada por
  `/api/geo/demo-points` — nenhuma geografia nova inventada.
- Fallback estático do mapa preservado sem alteração; PostGIS continua
  opcional para a demo.

Relatório completo, com comparação item a item contra o projeto de
referência e o que foi deliberadamente **não** trazido (WebSocket/MQTT,
triagem humana com estado, endpoint de coordenada fabricada):
[docs/auditoria-mapa-benvenutti-f9-1.md](docs/auditoria-mapa-benvenutti-f9-1.md).

Total de testes de backend: **67/67** (65 da F9 + 2 novos de coordenadas de
alerta).

## Como rodar localmente

Pré-requisitos: Docker e Docker Compose.

```bash
cp .env.example .env
docker compose up
```

- API: http://localhost:8000/health
- Web: http://localhost:5173

Isso sobe PostGIS (com `db/migrations/*.sql` aplicadas no primeiro boot via
`docker-entrypoint-initdb.d`), a API FastAPI com reload e o frontend Vite.
As tabelas HAND ficam vazias até rodar a importação — ver
[db/seeds/import_hand_blumenau.md](db/seeds/import_hand_blumenau.md) ou,
mais direto, `scripts/dev/run_export.sh`. `risk`, `telemetry`, `scenarios`,
`alerts` e `shelters` funcionam sem banco (F3/F7, veja seções abaixo) — todos
simulados, sem persistência.

Para rodar sem Docker:

```bash
# API
cd services/api
pip install -r requirements.txt
uvicorn app.main:app --reload

# Web
cd apps/web
npm install
npm run dev       # http://localhost:5173, espera a API em http://localhost:8000
npm run build      # verificação — sem lint configurado, build é o gate
```

Frontend lê a URL da API de `VITE_API_URL` (padrão
`http://localhost:8000` se não definida — ver `apps/web/src/lib/api.ts`).
