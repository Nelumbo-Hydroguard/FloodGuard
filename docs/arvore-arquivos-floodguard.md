# Árvore de Arquivos do Projeto FloodGuard

> Gerado na F5.0. Exclui `.git/`, `.venv/`, `node_modules/`, `dist/`,
> `build/`, `__pycache__/`, `.pytest_cache/`, `data/raw/` e `*.tif`/`*.tiff`
> — nada disso deve ser versionado (ver `.gitignore` e seção 5).
>
> **Atualização F6:** este arquivo ainda descreve `RiskMap.tsx` como "sem
> Leaflet instalado" (seção 2, linha sobre `apps/web/`) e "sem cartografia
> renderizada" (tabela de `apps/web/src/pages/`) — corrigido na F6. Também
> entraram nesta fase: `leaflet`/`react-leaflet` (dependências),
> `apps/web/src/lib/riskTheme.ts`, `apps/web/src/components/{PageHeader,
> SectionCard, MetricCard, DemoNotice, EmptyState, ErrorState, RiskLegend,
> MapLegend}.tsx`, `apps/web/public/geo/*` (fallback estático),
> `services/geo/scripts/generate_web_geojson.py`, e os endpoints
> `GET /api/geo/demo-map`/`demo-points`. Detalhes na seção "F6" do
> [README.md](../README.md#f6--identidade-visual-mapa-funcional-e-backend-de-demo).
> Não editado ponto a ponto abaixo para preservar o registro do estado na F5.

## 1. Visão geral da estrutura

```
FloodGuard/
├─ .env.example
├─ .gitignore
├─ docker-compose.yml
├─ README.md
├─ apps/
│  └─ web/                          frontend React + Vite + Tailwind
│     ├─ index.html, package.json, vite.config.ts, tailwind.config.ts, tsconfig.json
│     └─ src/
│        ├─ components/             Layout, RiskCard, StatusBadge, FactorBar
│        ├─ pages/                  Landing, Dashboard, RiskMap, Alertas, AlertDetail, Telemetria, Shelters, Sobre
│        ├─ lib/api.ts               cliente HTTP da API
│        ├─ router.tsx, main.tsx, index.css
├─ data/
│  └─ hand/                         artefatos geoespaciais HAND (leves)
│     ├─ *.gpkg, hand_classes_stats.json, README.md
│     └─ previews/*.png
├─ db/
│  ├─ migrations/                   001_postgis, 002_core_tables, 003_hand_layers
│  └─ seeds/                        blumenau.sql (superado), import_hand_blumenau.md
├─ docs/                            documentação de produto/arquitetura/roadmap
├─ infra/                           reservado para infra futura (Dockerfiles prod, CI)
├─ mentorias/                       atas e transcrições de mentoria (não é código)
├─ scripts/dev/                     shell scripts auxiliares (migrations, export, teste de endpoints)
└─ services/
   ├─ api/                          backend FastAPI
   │  ├─ app/
   │  │  ├─ engine/                 motor de risco (F3)
   │  │  ├─ routers/                endpoints HTTP
   │  │  ├─ schemas/                modelos Pydantic
   │  │  ├─ main.py, config.py, database.py
   │  ├─ tests/                     27 testes unitários/integração
   │  ├─ requirements.txt, requirements-dev.txt, pytest.ini
   ├─ geo/                          pipeline de exportação HAND → PostGIS
   │  ├─ notebooks/, scripts/
   └─ simulator/                    exemplo de payload de telemetria simulada
```

## 2. Descrição detalhada por pasta e arquivo

### Raiz do projeto

Configuração de ambiente e orquestração local. Nenhum código de aplicação
mora aqui.

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `README.md` | Documentação | Visão geral, stack, autoria, status por fase, como rodar | Documentação |
| `.env.example` | Configuração | Template de variáveis de ambiente (`DATABASE_URL`, `POSTGRES_*`, `API_PORT`, `WEB_PORT`, `SIMULATION_MODE`) | Configuração |
| `.gitignore` | Configuração | Exclui venvs, node_modules, dist, dados brutos, `.tif`, caches | Configuração |
| `docker-compose.yml` | Configuração | Sobe postgis + api + web com imagens genéricas (sem Dockerfile próprio) | Configuração |

### `docs/`

Documentação de produto e arquitetura — nenhum código.

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `docs/decisoes-arquitetura.md` | Documentação | Registro das decisões oficiais (stack, motor de risco canônico, escopo) | Documentação |
| `docs/autoria-licenca.md` | Documentação | Proveniência de código por componente, acordo de equipe | Documentação |
| `docs/limitacoes.md` | Documentação | 9 limitações formais do sistema (PoC, HAND, motor não calibrado etc.) | Documentação |
| `docs/roadmap.md` | Documentação | Itens fora do MVP (app cidadão completo, hardware real, nowcasting) | Roadmap |
| `docs/metodologia-hand.md` | Documentação | O que é HAND, origem dos dados, classes usadas, como regenerar/exportar | Documentação |
| `docs/motor-de-risco.md` | Documentação | Fórmula do motor de risco, fatores, fallback, exemplos reais | Documentação |
| `docs/relatorio-geral-floodguard.md` | Documentação | Este relatório geral (gerado nesta fase, F5.0) | Documentação |
| `docs/arvore-arquivos-floodguard.md` | Documentação | Este arquivo | Documentação |

### `services/api/`

Backend FastAPI — a única parte do projeto com regra de negócio real
testada (motor de risco).

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `requirements.txt` | Configuração | Dependências de produção (fastapi, uvicorn, pydantic, sqlalchemy, psycopg) | Configuração |
| `requirements-dev.txt` | Configuração | `-r requirements.txt` + pytest, httpx (só teste) | Configuração |
| `pytest.ini` | Configuração | `pythonpath = .`, `testpaths = tests` | Configuração |

### `services/api/app/`

Pacote principal da API.

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `main.py` | Implementado | Cria `FastAPI()`, CORS aberto (`allow_origins=["*"]`), inclui os 7 routers | Implementado |
| `config.py` | Implementado | `Settings` (pydantic-settings): `database_url`, `api_port`, `simulation_mode` | Implementado |
| `database.py` | Implementado | `create_engine` + `SessionLocal` + `get_db()` — engine é *lazy*, não conecta até a 1ª query | Implementado |

### `services/api/app/engine/`

Motor de risco — coração da F3. Sem dependência de banco.

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `risk_rules.py` | Implementado | Pesos (0.45/0.30/0.20/0.05), referências de normalização, limiares de classificação, ações recomendadas — funções puras | Implementado |
| `risk_engine.py` | Implementado | Orquestra: resolve contexto espacial → calcula 4 fatores → score → monta resposta | Implementado |
| `risk_explanation.py` | Implementado | Gera a justificativa textual a partir dos fatores | Implementado |
| `spatial_context.py` | Implementado | HAND mockado — as 4 classes reais de Blumenau + lookup por nome de região, sem tocar PostGIS | Implementado |
| `telemetry_normalizer.py` | Implementado | Aceita payload bruto com aliases de campo (`rainfall`/`rainfall_mm`, `lat`/`latitude`), clamp de negativo | Implementado |
| `mesh_payload.py` | Simulado | Empacota resultado de risco em payload UniMesh/LoRa — `implemented: false` sempre | Simulado |
| `README.md` | Documentação | Explica status do motor e créditos (`techguard-sentinela`) | Documentação |

### `services/api/app/routers/`

Endpoints HTTP — todos sob prefixo `/api/...` exceto `health`.

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `health.py` | Implementado | `GET /health` (sem prefixo `/api`) | Implementado |
| `geo.py` | Pendente/PostGIS | `GET /api/geo/status` (funciona sem banco); `municipality/blumenau`, `basins/blumenau`, `hand-zones`, `hand-zones/summary`, `point-risk-context` exigem PostGIS populado | Pendente/PostGIS |
| `risk.py` | Implementado | `GET /api/risk/status`, `POST /api/risk/evaluate`, `POST /api/risk/evaluate-batch` | Implementado |
| `telemetry.py` | Implementado/Simulado | `GET /api/telemetry/status`, `POST /api/telemetry/normalize`, `POST /api/telemetry/mesh-payload` | Implementado |
| `scenarios.py` | Simulado | `GET /api/scenarios/status`, `GET /api/scenarios/demo` (3 cenários fixos rodados pelo motor real) | Simulado |
| `alerts.py` | Pendente | Só `GET /api/alerts/status` — placeholder, sem CRUD | Pendente |
| `shelters.py` | Pendente | Só `GET /api/shelters/status` — placeholder, sem CRUD | Pendente |

### `services/api/app/schemas/`

Modelos Pydantic — contratos de entrada/saída.

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `common.py` | Implementado | `RiskLevel` (Literal compartilhado) | Implementado |
| `health.py` | Implementado | `HealthResponse` | Implementado |
| `risk.py` | Implementado | `RiskEvaluationRequest/Response`, `RiskFactors`, `RiskBatchRequest/Response`, `RiskAssessment` (legado, para tabela `risk_assessments`) | Implementado |
| `telemetry.py` | Implementado | `TelemetryReading`, `NormalizedTelemetryReading`, `MeshPayload` | Implementado |
| `alerts.py` | Pendente | `Alert` — schema existe, sem endpoint que grave dado real | Pendente |
| `shelters.py` | Pendente | `Shelter`, `ShelterRequest` — idem | Pendente |

### `services/api/tests/`

27 testes, todos passam sem PostgreSQL.

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `test_risk_engine.py` | Teste | 8 testes unitários do motor (score 0–1, crítico, seguro, fallback, explicação, batch) | Teste |
| `test_risk_api.py` | Teste | 9 testes via `TestClient` (health, risk, scenarios/demo, telemetry) | Teste |
| `test_telemetry_normalizer.py` | Teste | 6 testes (aliases, clamp negativo, timestamp default, campo faltando) | Teste |
| `test_mesh_payload.py` | Teste | 4 testes (`implemented: false` sempre, inclusive em risco crítico) | Teste |

### `services/geo/`

Pipeline de exportação dos artefatos HAND para PostGIS. Não recalcula
HAND — só transporta o que já foi processado externamente.

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `README.md` | Documentação | Explica o papel do serviço, ambiente próprio (venv com geopandas/rasterio) | Documentação |
| `scripts/export_to_postgis.py` | Pendente/PostGIS | CLI (`inspect`, `export-boundary`, `export-basins`, `export-hand-zones`, `export-all`) — nunca executado contra Postgres real nesta sessão | Pendente/PostGIS |
| `scripts/inspect_hand_artifacts.py` | Implementado | Inspeciona (somente leitura) artefatos do repositório `HAND` externo — já executado com sucesso em sessão anterior | Implementado |
| `notebooks/hand_whitebox_integrado_ANA_IBGE_BLUMENAU.ipynb` | Artefato geoespacial | Cópia de referência do notebook que gerou o HAND original (o cálculo em si roda fora deste repo) | Artefato geoespacial |

### `services/simulator/`

Só documentação + 1 exemplo — não há processo de simulação rodando
separado; a lógica real de normalização vive em `services/api/app/engine/telemetry_normalizer.py`.

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `README.md` | Documentação | Princípios do simulador (tudo `source: "simulation"`, sem hardware) | Documentação |
| `simulated_payload_example.json` | Simulado | Exemplo de payload bruto de telemetria simulada | Simulado |

### `apps/web/`

Frontend — React 19 + Vite 8 + TypeScript + Tailwind 3 + react-router-dom
7. **Não tem Leaflet instalado** (ver seção 3 do relatório geral).

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `package.json` | Configuração | Dependências: `react`, `react-dom`, `react-router-dom` (prod); vite/typescript/tailwind (dev) | Configuração |
| `index.html` | Configuração | Ponto de entrada Vite | Configuração |
| `vite.config.ts` | Configuração | Plugin React, porta 5173 | Configuração |
| `tailwind.config.ts` | Configuração | Conteúdo `index.html` + `src/**/*.{ts,tsx}`, sem tema customizado | Configuração |
| `tsconfig.json` | Configuração | Strict mode, `types: ["vite/client"]` (necessário para `import.meta.env`) | Configuração |

### `apps/web/src/`

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `main.tsx` | Implementado | Bootstrap React + `BrowserRouter` | Implementado |
| `router.tsx` | Implementado | Define todas as rotas (`/`, `/painel`, `/mapa`, `/alertas`, `/alertas/:id`, `/telemetria`, `/abrigos`, `/sobre`) | Implementado |
| `index.css` | Implementado | Diretivas Tailwind (`@tailwind base/components/utilities`) | Implementado |

### `apps/web/src/components/`

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `Layout.tsx` | Implementado | Shell com nav (Painel, Mapa, Alertas, Telemetria, Abrigos, Sobre) + `<Outlet/>` | Implementado |
| `RiskCard.tsx` | Implementado | Card de risco completo — badge, score, confiança, 4 barras de fator, justificativa, ação | Implementado |
| `StatusBadge.tsx` | Implementado | Badge colorido por `RiskLevel` (verde/amarelo/laranja/vermelho) | Implementado |
| `FactorBar.tsx` | Implementado | Barra horizontal 0–100% para um fator | Implementado |

### `apps/web/src/pages/`

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `Landing.tsx` | Implementado | Página `/` — estática, apresentação do produto | Implementado |
| `Dashboard.tsx` | Implementado | `/painel` — consome `risk/status` + `scenarios/demo`, 3 `RiskCard` reais | Implementado |
| `RiskMap.tsx` | Implementado/Pendente | `/mapa` — consome `geo/status` + `hand-zones/summary`; fallback textual se PostGIS não populado; **sem cartografia renderizada** | Pendente/PostGIS |
| `Alertas.tsx` | Simulado | `/alertas` — deriva de `scenarios/demo`; região mapeada manualmente no frontend (`SCENARIO_REGION`) | Simulado |
| `AlertDetail.tsx` | Pendente | `/alertas/:id` — placeholder textual, sem dado real | Pendente |
| `Telemetria.tsx` | Implementado | `/telemetria` — formulário completo → `POST risk/evaluate` + botão de payload mesh | Implementado |
| `Shelters.tsx` | Pendente | `/abrigos` — placeholder textual | Pendente |
| `Sobre.tsx` | Documentação | `/sobre` — conteúdo estático sobre o projeto | Implementado |

### `apps/web/src/lib/`

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `api.ts` | Implementado | Cliente HTTP — `getJSON`/`postJSON` genéricos + funções tipadas por endpoint (`fetchHealth`, `fetchGeoStatus`, `fetchHandZonesSummary`, `fetchRiskStatus`, `evaluateRisk`, `fetchScenariosDemo`, `buildMeshPayload`); lê `VITE_API_URL` | Implementado |

### `db/`

Schema PostGIS — pronto, sintaxe validada, **nunca aplicado contra
PostGIS real** nesta sessão.

### `db/migrations/`

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `001_postgis.sql` | Pendente/PostGIS | `CREATE EXTENSION postgis, pgcrypto` | Pendente/PostGIS |
| `002_core_tables.sql` | Pendente/PostGIS | Cria `users`, `shelters`, `shelter_requests`, `alerts`, `telemetry_readings`, `risk_assessments` (+ versão antiga de `municipalities`/`basins`/`rivers`/`hand_zones`, substituída pela 003) | Pendente/PostGIS |
| `003_hand_layers.sql` | Pendente/PostGIS | Recria `municipalities`, `basins`, `rivers`, `hand_zones` com schema rico + índices GIST; reata FK de `risk_assessments` | Pendente/PostGIS |

### `db/seeds/`

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `blumenau.sql` | Documentação | Superado pela F2 — hoje só comentário explicando por que não há mais `INSERT` aqui | Documentação |
| `import_hand_blumenau.md` | Documentação | Passo a passo real de como popular `municipalities`/`basins`/`hand_zones` via `export_to_postgis.py` | Documentação |

### `data/`

Único artefato binário versionado do projeto.

### `data/hand/`

| Caminho | Tipo | Tamanho | Função | Status |
|---|---|---|---|---|
| `blumenau_boundary.gpkg` | Artefato geoespacial | 252 KB | Limite municipal de Blumenau (IBGE), 1 polígono | Artefato geoespacial |
| `ottobacias_blumenau_union.gpkg` | Artefato geoespacial | 148 KB | União das sub-bacias contribuintes (ANA), 1 polígono | Artefato geoespacial |
| `blumenau_hand_classes_vector.gpkg` | Artefato geoespacial | 19 MB | 4 zonas HAND vetorizadas (classes 0–3), com `area_m2`/`percent_area` — maior arquivo do repo | Artefato geoespacial |
| `hand_classes_stats.json` | Artefato geoespacial | <4 KB | Estatística de área por classe, gerada junto com o gpkg acima | Artefato geoespacial |
| `previews/mapa_hand_transparent.png` | Artefato geoespacial | 700 KB | Mapa estático do raster HAND, fundo transparente (imagem, não analisada como texto) | Artefato geoespacial |
| `previews/mapa_suscetibilidade_blumenau.png` | Artefato geoespacial | 848 KB | Mapa estático de suscetibilidade — imagem (não analisada como texto) | Artefato geoespacial |
| `README.md` | Documentação | Explica origem, o que não está aqui (DEM bruto, raster original), licença | Documentação |

### `infra/`

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `README.md` | Documentação | Reserva o diretório para infra futura (Dockerfiles prod, CI, proxy). Sem conteúdo técnico ainda | Documentação |

### `scripts/dev/`

Shell scripts auxiliares — não fazem parte do pacote Python nem do
frontend, são ferramentas de linha de comando para quem for rodar F2.1
localmente.

| Caminho | Tipo | Função | Status |
|---|---|---|---|
| `apply_migrations.sh` | Pendente/PostGIS | Aplica `db/migrations/*.sql` via `psql` contra `DATABASE_URL` | Pendente/PostGIS |
| `run_export.sh` | Pendente/PostGIS | Cria venv de `services/geo` se preciso, roda `export_to_postgis.py inspect` + `export-all` | Pendente/PostGIS |
| `test_geo_endpoints.sh` | Pendente/PostGIS | Curl em sequência nos 7 endpoints `/api/geo/*` + `/health`, imprime status e corpo | Pendente/PostGIS |

### Fora do escopo de código — `mentorias/`

Atas e transcrição de mentoria (`.docx`, `.pdf`, `.txt`). Material de
apoio/histórico do projeto, não é artefato técnico nem documentação de
arquitetura.

## 3. Arquivos críticos para a demo

Sem estes, a demo local (backend + frontend, sem PostGIS) não sobe:

- `services/api/app/main.py`, `config.py`, `database.py`
- `services/api/app/engine/*.py` (todos — motor de risco)
- `services/api/app/routers/health.py`, `risk.py`, `scenarios.py`, `telemetry.py`
- `services/api/app/schemas/risk.py`, `telemetry.py`, `common.py`
- `services/api/requirements.txt`
- `apps/web/src/main.tsx`, `router.tsx`, `lib/api.ts`
- `apps/web/src/pages/Dashboard.tsx`, `RiskMap.tsx`, `Alertas.tsx`, `Telemetria.tsx`, `Sobre.tsx`, `Landing.tsx`
- `apps/web/src/components/*.tsx`
- `apps/web/package.json`, `vite.config.ts`, `tsconfig.json`

## 4. Arquivos críticos para documentação

- `README.md` — entrada principal.
- `docs/decisoes-arquitetura.md`, `docs/autoria-licenca.md` — por que o projeto é como é.
- `docs/motor-de-risco.md`, `docs/metodologia-hand.md` — como os dois pilares técnicos funcionam.
- `docs/limitacoes.md`, `docs/roadmap.md` — o que falta, com honestidade.
- `docs/relatorio-geral-floodguard.md`, `docs/arvore-arquivos-floodguard.md` — estes dois, gerados na F5.0.

## 5. Arquivos que não devem ser versionados

Regras já ativas em `.gitignore`, confirmadas nesta auditoria:

- `.env` — segredos/config local (`.env.example` é o template versionado).
- `.venv/`, `venv/`, `**/.venv/` — ambientes Python (`services/api/.venv`, `services/geo/.venv`).
- `node_modules/`, `**/node_modules/` — dependências Node.
- `dist/`, `build/` — build do frontend (`apps/web/dist/` existe localmente, é gerado por `npm run build`).
- `data/raw/` — dados brutos pesados.
- `*.tif`, `*.tiff` — rasters brutos (o DEM de ~1,5 GB fica fora deste repo, no repositório `HAND`).
- `__pycache__/`, `.pytest_cache/`, `.mypy_cache/`, `.ruff_cache/` — caches Python.
- `*.tsbuildinfo` — cache incremental do TypeScript.
- Qualquer arquivo acima de ~50 MB sem alerta explícito — hoje o maior arquivo versionado é `blumenau_hand_classes_vector.gpkg` (19 MB), bem abaixo do limite.

## 6. Como rodar o projeto

**Backend:**
```bash
cd services/api
source .venv/bin/activate
python -m pytest
python -m uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd apps/web
npm install
npm run dev
```

**URLs:**
```
http://localhost:8000/docs
http://localhost:8000/api/risk/status
http://localhost:8000/api/scenarios/demo
http://localhost:5173/sobre
http://localhost:5173/painel
http://localhost:5173/telemetria
http://localhost:5173/alertas
http://localhost:5173/mapa
```

## 7. Observações técnicas importantes

- A API usa prefixo `/api/` em todos os routers, exceto `/health` — `GET /risk/status` (sem `/api`) retorna 404, confirmado.
- A variável de ambiente do frontend é `VITE_API_URL` (não `VITE_API_BASE_URL`) — default `http://localhost:8000`, definida em `apps/web/src/lib/api.ts`.
- `/api/geo/hand-zones/summary` (e os demais endpoints `geo/*` exceto `status`) dependem de PostGIS populado — sem isso, retornam erro 500 (confirmado em sessão de validação anterior: `psycopg.OperationalError`, autenticação falha contra um Postgres local de outro projeto).
- `/mapa` tem fallback explícito no frontend quando PostGIS não está configurado — mostra texto informativo em vez de travar ou mostrar erro cru.
- Os dados de telemetria são inteiramente simulados — `source: "simulation"` e `hardware_implemented: false` em todo payload gerado.
- UniMesh/LoRa é payload simulado, não transmissão real — nenhum socket, porta serial ou rádio é aberto em nenhum lugar do código; `implemented: false` é retornado sempre, inclusive em risco crítico (testado).
