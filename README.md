# FloodGuard

Plataforma GovTech B2G de apoio à tomada de decisão da Defesa Civil em eventos de
alagamento e inundação urbana, com piloto em Blumenau/SC.

> Status: em consolidação (Fase F3 — motor de risco explicável rodando em
> FastAPI, com testes unitários e sem dependência obrigatória de banco).
> `geo` (F2) e `risk`/`telemetry`/`scenarios` (F3) já têm regra de negócio
> real; `alerts` e `shelters` seguem placeholder. Autoria coletiva
> registrada — ver [docs/autoria-licenca.md](docs/autoria-licenca.md).
> Este README será atualizado a cada fase.

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

Repositório final: ainda pendente de criação dentro de uma
organização/time do GitHub — o consolidado hoje vive só localmente.
Proveniência completa por componente, autorizações e créditos individuais:
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
entrou na F3. Ainda pendente: alertas e abrigos com regra de negócio real
(hoje só CRUD placeholder).

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
- **27 testes unitários** (`services/api/tests/`), todos passando sem
  Postgres: score sempre entre 0 e 1, crítico quando todos os fatores estão
  altos, seguro quando todos estão baixos, fallback funciona, explicação
  muda com os fatores, payload mesh sempre `implemented: false`, todos os
  endpoints novos respondem.

Fórmula completa, fatores, exemplos reais e créditos:
[docs/motor-de-risco.md](docs/motor-de-risco.md).

```bash
cd services/api
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
.venv/bin/python -m pytest -v
```

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
mais direto, `scripts/dev/run_export.sh`. `risk`, `telemetry` e `scenarios`
funcionam sem banco (F3, veja seção abaixo). `alerts` e `shelters` ainda são
placeholders, sem regra de negócio real.

Para rodar sem Docker:

```bash
# API
cd services/api
pip install -r requirements.txt
uvicorn app.main:app --reload

# Web
cd apps/web
npm install
npm run dev
```
