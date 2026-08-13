# Árvore de Arquivos do FloodGuard — Detalhada (F6.0)

> Substitui/aprofunda `docs/arvore-arquivos-floodguard.md` (F5.0), que ficou
> só em nível de pasta. Este documento desce a **nível de arquivo**: para
> cada arquivo relevante lista caminho, linguagem, camada, responsabilidade,
> funções/classes, quem chama e quem é chamado, entrada/saída, dependências,
> status e riscos. Também explica os **ciclos de execução** ponta a ponta
> (Parte B) — o que faltava no F5.0 segundo a crítica da equipe.
>
> Gerado na F6.0/F6.1, lendo o código-fonte diretamente (não é um resumo do
> README). Onde algo não pôde ser confirmado lendo o arquivo, está marcado
> como "inferido" ou "pendente de validação" — nada foi inventado.
>
> **Atualização F7:** as entradas abaixo para `app/routers/alerts.py`,
> `app/routers/shelters.py`, `app/schemas/alerts.py`, `app/schemas/shelters.py`,
> `apps/web/src/pages/Alertas.tsx`, `AlertDetail.tsx` e `Shelters.tsx`
> mudam de status **Pendente → Simulado**: ganharam endpoints/telas reais de
> demonstração (`GET /api/alerts/demo`, `/api/alerts/demo/{id}`,
> `GET /api/shelters/demo`), sem persistência em banco. Ver seção "F7" do
> [README.md](../README.md#f7--alertas-e-abrigos-simulados) para o resumo
> atualizado — este arquivo não foi reescrito linha a linha para preservar
> o registro do estado na F6.

## Convenção de status usada abaixo

| Status | Significado |
|---|---|
| **Implementado** | Código roda, tem lógica real, testado (quando aplicável) |
| **Simulado** | Roda de verdade, mas os dados/efeitos que produz são artificiais (`source: "simulation"`, `implemented: false` etc.) — não confundir com "não implementado" |
| **Pendente** | Placeholder — endpoint/tela existe, mas sem lógica de negócio real |
| **PostGIS** | Só funciona com banco populado; sem banco, cai em fallback ou erro tratado |
| **Roadmap** | Não existe ainda, mencionado só como próximo passo |

---

## 1. Backend — `services/api/app/`

### 1.1 `services/api/app/main.py`

| Campo | Detalhe |
|---|---|
| Linguagem/formato | Python 3, FastAPI |
| Camada | Bootstrap/composição da aplicação |
| Responsabilidade | Cria a instância `FastAPI`, registra CORS aberto, inclui os 7 routers na app |
| Principais símbolos | `app = FastAPI(...)` (título, descrição, versão `0.1.0`); nenhuma função própria — só chamadas de `app.add_middleware` e `app.include_router` |
| Quem chama este arquivo | `uvicorn app.main:app` (execução local), `fastapi.testclient.TestClient(app)` nos testes de integração (`tests/test_risk_api.py`, `tests/test_geo_demo.py`) |
| O que este arquivo chama/importa | `fastapi.FastAPI`, `fastapi.middleware.cors.CORSMiddleware`, `app.routers.{alerts, geo, health, risk, scenarios, shelters, telemetry}` |
| Entrada esperada | Nenhuma em tempo de import — só monta a app |
| Saída gerada | Objeto `app` ASGI, servido por Uvicorn |
| Dependências | `fastapi` |
| Status | Implementado |
| Observações de risco | `allow_origins=["*"]` é CORS totalmente aberto — aceitável numa PoC local, mas **não deve ir para um deploy público sem revisão** (nenhuma allowlist de domínio hoje). Nenhum middleware de autenticação/rate-limit existe. |

### 1.2 `services/api/app/config.py`

| Campo | Detalhe |
|---|---|
| Linguagem/formato | Python 3, `pydantic-settings` |
| Camada | Configuração |
| Responsabilidade | Centraliza variáveis de ambiente num objeto tipado único |
| Principais símbolos | `class Settings(BaseSettings)` com `database_url`, `api_port`, `simulation_mode`; instância `settings = Settings()` (singleton de módulo, avaliado 1x na primeira importação) |
| Quem chama este arquivo | `app.database` (lê `settings.database_url`), `app.routers.health` (lê `settings.simulation_mode`) |
| O que este arquivo chama/importa | `pydantic_settings.BaseSettings/SettingsConfigDict`; lê `.env` na raiz de `services/api` se existir (`extra="ignore"` — variáveis extras no `.env` não quebram o boot) |
| Entrada esperada | Variáveis de ambiente / arquivo `.env` (`DATABASE_URL`, `API_PORT`, `SIMULATION_MODE`) |
| Saída gerada | Objeto `settings` tipado |
| Dependências | `pydantic-settings` |
| Status | Implementado |
| Observações de risco | `database_url` tem um default com credencial de exemplo (`floodguard:floodguard@localhost`) embutido no código — é intencional para dev local, mas não deve ser copiado para produção sem trocar. |

### 1.3 `services/api/app/database.py`

| Campo | Detalhe |
|---|---|
| Linguagem/formato | Python 3, SQLAlchemy 2.x |
| Camada | Infraestrutura de dados |
| Responsabilidade | Cria o `Engine` SQLAlchemy e a fábrica de sessões; expõe `get_db()` como dependency FastAPI |
| Principais símbolos | `engine = create_engine(...)` (com `pool_pre_ping=True`); `SessionLocal = sessionmaker(...)`; `def get_db()` — generator que abre/fecha sessão |
| Quem chama este arquivo | Hoje **ninguém usa `get_db()` como dependency ainda** — nenhum router injeta `Depends(get_db)`. `app.routers.geo` importa `engine` diretamente (não `get_db`) e abre conexões com `engine.connect()` |
| O que este arquivo chama/importa | `sqlalchemy.create_engine`, `sqlalchemy.orm.sessionmaker`, `app.config.settings` |
| Entrada esperada | `settings.database_url` |
| Saída gerada | `engine` (lazy — só conecta na primeira query real), `SessionLocal`, generator `get_db()` |
| Dependências | `sqlalchemy`, `psycopg[binary]` |
| Status | Implementado (engine configurado), mas **a camada ORM/session não é usada por nenhum router hoje** — `geo.py` usa SQL cru via `text()` direto no `engine`, não via `Session`/`get_db()`. `get_db()` existe pronto para quando algum router precisar de transação/ORM. |
| Observações de risco | Como `create_engine` é lazy, um `DATABASE_URL` errado só falha na primeira query — não no boot da API. Isso é por que `/health` e `/api/*/status` sempre respondem 200 mesmo sem Postgres no ar, mas endpoints `geo.py` que tocam banco falham só quando chamados. |

### 1.4 `services/api/app/engine/risk_rules.py`

| Campo | Detalhe |
|---|---|
| Linguagem/formato | Python 3, puro (sem I/O) |
| Camada | Domínio — regras/constantes do motor de risco |
| Responsabilidade | Único lugar com os números "mágicos" do motor: pesos da fusão, referências de normalização, limiares de classificação, textos de ação recomendada |
| Principais símbolos | Constantes `WEIGHT_HAND=0.45`, `WEIGHT_RAINFALL=0.30`, `WEIGHT_WATER_LEVEL=0.20`, `WEIGHT_TREND=0.05`, `RAINFALL_REFERENCE_MM=150.0`, `WATER_LEVEL_REFERENCE_M=3.0`, `TREND_NEUTRAL=0.5`, `TREND_REFERENCE_DELTA_M=0.5`, `CONFIDENCE_WITH_SPATIAL_CONTEXT=0.95`, `CONFIDENCE_FALLBACK=0.55`, `RISK_THRESHOLDS` (lista de tuplas `(limiar, rótulo)`); funções `clamp()`, `classify_risk()`, `rainfall_factor()`, `water_level_factor()`, `trend_factor()`, `recommended_action()` |
| Quem chama este arquivo | `app.engine.risk_engine` (todas as funções); `apps/web/src/components/FactorBar.tsx` **replica** os mesmos 4 limiares (`0.25/0.5/0.75`) no frontend só para colorir a barra — comentário no próprio arquivo TS aponta essa duplicação intencional |
| O que este arquivo chama/importa | Nada — zero dependências externas, só `__future__.annotations` |
| Entrada esperada | Valores numéricos brutos (`rainfall_mm`, `water_level_m`, `previous_water_level_m`, `score`) passados como argumento de função |
| Saída gerada | Fatores normalizados `[0,1]`, rótulo de risco (`str`), texto de ação recomendada |
| Dependências | Nenhuma |
| Status | Implementado |
| Observações de risco | Pesos e referências são **valores demonstrativos de PoC, não calibrados** — o próprio docstring do arquivo avisa isso. `trend_factor` sem `previous_water_level_m` retorna sempre `0.5` (neutro) — isso é decisão de design, não bug, mas quem lê o `risk_score` isolado pode não perceber que a tendência "não contou" nesse caso (fica visível só olhando `factors.trend_factor == 0.5` e sabendo o significado). |

### 1.5 `services/api/app/engine/risk_engine.py`

| Campo | Detalhe |
|---|---|
| Linguagem/formato | Python 3 |
| Camada | Domínio — orquestração do motor de risco |
| Responsabilidade | Ponto único de entrada do motor: resolve contexto espacial, calcula os 4 fatores, aplica a fórmula de fusão (com fallback quando não há HAND), monta a resposta completa |
| Principais símbolos | `_resolve_spatial_context(request) -> tuple[float\|None, str\|None]` (função privada, prioridade hand_risk_weight > hand_class_id > region > nenhum); `evaluate(request: RiskEvaluationRequest) -> RiskEvaluationResponse`; `evaluate_batch(requests: list) -> list[RiskEvaluationResponse]` |
| Quem chama este arquivo | `app.routers.risk` (`evaluate`, `evaluate_batch`), `app.routers.telemetry` (`evaluate`, dentro de `build_mesh_payload`), `app.routers.scenarios` (`evaluate`, para os 3 cenários fixos), `app.routers.geo` (`evaluate`, dentro de `get_demo_points`) — é o módulo mais reutilizado do backend, chamado por 4 dos 7 routers |
| O que este arquivo chama/importa | `app.engine.risk_rules` (todas as constantes/funções), `app.engine.risk_explanation.build_explanation`, `app.engine.spatial_context.{lookup_mock_region, resolve_hand_class}`, `app.schemas.risk.{RiskEvaluationRequest, RiskEvaluationResponse, RiskFactors}` |
| Entrada esperada | `RiskEvaluationRequest` (Pydantic, já validado pelo FastAPI antes de chegar aqui — lat/lon em range, `rainfall_mm`/`water_level_m` ≥ 0) |
| Saída gerada | `RiskEvaluationResponse` (nível, score 0–1, confiança, `spatial_context_available`, 4 fatores, explicação textual, ação recomendada, eco de `station_id`/`region`/`timestamp`) |
| Dependências | `app.engine.risk_rules`, `app.engine.risk_explanation`, `app.engine.spatial_context`, `app.schemas.risk` — nenhuma dependência de banco/rede |
| Status | Implementado, coberto por 12 testes unitários (`tests/test_risk_engine.py`) |
| Observações de risco | A fórmula de fallback **redistribui proporcionalmente** o peso do HAND entre os 3 fatores restantes (não descarta 5% do score) — isso é intencional e testado (`test_fallback_works_without_hand`), mas é um detalhe fácil de esquecer ao alterar pesos em `risk_rules.py`: mudar `WEIGHT_HAND` sem revisar essa redistribuição pode alterar o comportamento do fallback de forma não óbvia. |

### 1.6 `services/api/app/engine/risk_explanation.py`

| Campo | Detalhe |
|---|---|
| Linguagem/formato | Python 3, puro |
| Camada | Domínio — geração de linguagem natural |
| Responsabilidade | Traduz os 4 fatores numéricos em uma frase legível ("chuva acumulada elevada e nível d'água moderado e em crescimento, resultando em risco alerta") |
| Principais símbolos | `_bucket(value, low, mid, high)` (classifica um float em 3 faixas: <0.4 baixo, 0.4–0.7 médio, ≥0.7 alto); `_hand_description()`, `_rainfall_description()`, `_water_level_description()` (privadas); `build_explanation(*, risk_level, hand_weight, rainfall_factor, water_level_factor, trend_factor, spatial_context_available, hand_class_label=None) -> str` |
| Quem chama este arquivo | `app.engine.risk_engine.evaluate()` — chamado 1x por avaliação, no final, depois que os 4 fatores já foram calculados |
| O que este arquivo chama/importa | Nada externo |
| Entrada esperada | Os 4 fatores já normalizados (0–1) + flags/rótulos de contexto |
| Saída gerada | Uma única `str` em português, concatenando 3 partes (HAND opcional + chuva + nível/tendência) + aviso extra se não houver contexto espacial |
| Dependências | Nenhuma |
| Status | Implementado, testado indiretamente via `test_explanation_changes_with_factors` e `test_fallback_works_without_hand` |
| Observações de risco | Texto é gerado por regras `if/elif`, não por LLM — determinístico e barato, mas **vocabulário fixo**: só 3 faixas por fator, sem nuance fina. Se o objetivo futuro for uma explicação mais rica, este é o ponto de extensão natural, não `risk_engine.py`. |

### 1.7 `services/api/app/engine/spatial_context.py`

| Campo | Detalhe |
|---|---|
| Linguagem/formato | Python 3, dataclass |
| Camada | Domínio — contexto espacial HAND (versão mockada, sem banco) |
| Responsabilidade | Fornece `hand_risk_weight`/`hand_class_label` a partir de um `hand_class_id` (0–3) ou de um nome de bairro simulado, **sem consultar PostGIS** |
| Principais símbolos | `@dataclass(frozen=True) class HandSpatialContext(hand_class_id, hand_class_label, hand_risk_weight)`; `HAND_CLASSES_BY_ID: dict[int, HandSpatialContext]` (as 4 classes reais, id 0–3); `MOCK_REGION_TO_HAND_CLASS: dict[str, int]` (5 bairros simulados de Blumenau → class_id); `resolve_hand_class(class_id) -> HandSpatialContext \| None`; `lookup_mock_region(region) -> HandSpatialContext \| None` |
| Quem chama este arquivo | `app.engine.risk_engine._resolve_spatial_context()` — único chamador |
| O que este arquivo chama/importa | Nada externo — `dataclasses` da stdlib |
| Entrada esperada | `class_id: int` ou `region: str` |
| Saída gerada | `HandSpatialContext \| None` |
| Dependências | Nenhuma |
| Status | Implementado. As 4 classes (`HAND_CLASSES_BY_ID`) são **reais**, validadas na F2 contra o raster de Blumenau (mesmos `risk_weight` de `services/geo/scripts/export_to_postgis.py::HAND_CLASS_MAP`). O mapeamento bairro→classe (`MOCK_REGION_TO_HAND_CLASS`) é **ilustrativo** — o próprio docstring do arquivo diz isso: não é o raster recortado por bairro oficial, é só para contar uma história geográfica coerente na demo. |
| Observações de risco | Ponto de maior confusão possível para quem lê a API pela primeira vez: **os pesos das classes são reais, a associação de bairro é inventada para demo**. Isso está documentado no código, mas não estava claro na documentação de produto até este documento — ver Parte C (docs/hand-processamento-detalhado.md) para a resposta completa. |

### 1.8 `services/api/app/engine/telemetry_normalizer.py`

| Campo | Detalhe |
|---|---|
| Linguagem/formato | Python 3 |
| Camada | Domínio/adaptador — normalização de entrada solta |
| Responsabilidade | Aceita um `dict` de telemetria com nomes de campo variáveis (`rainfall` vs `rainfall_mm`, `lat` vs `latitude` etc.) e devolve um `NormalizedTelemetryReading` tipado, pronto para o motor de risco |
| Principais símbolos | Tuplas de aliases por campo (`_RAINFALL_KEYS`, `_WATER_LEVEL_KEYS`, `_PREVIOUS_WATER_LEVEL_KEYS`, `_LATITUDE_KEYS`, `_LONGITUDE_KEYS`, `_COMMUNICATION_STATUS_KEYS`, `_TIMESTAMP_KEYS`, `_STATION_ID_KEYS`); `_first_present()`, `_clamp_non_negative()`, `_parse_timestamp()` (privadas); `normalize(raw: dict[str, Any]) -> NormalizedTelemetryReading` |
| Quem chama este arquivo | `app.routers.telemetry.normalize_telemetry()` (`POST /api/telemetry/normalize`) e `app.routers.telemetry.build_mesh_payload()` (`POST /api/telemetry/mesh-payload`) |
| O que este arquivo chama/importa | `app.schemas.telemetry.NormalizedTelemetryReading` |
| Entrada esperada | `dict[str, Any]` — **sem schema Pydantic de entrada**, propositalmente, para aceitar payload solto |
| Saída gerada | `NormalizedTelemetryReading` (Pydantic, validado na saída) ou levanta `ValueError` se faltar `rainfall_mm`/`water_level_m`/`latitude`/`longitude` (os 4 únicos campos obrigatórios) |
| Dependências | `app.schemas.telemetry` |
| Status | Implementado, 6 testes unitários (`tests/test_telemetry_normalizer.py`) |
| Observações de risco | Valores negativos de chuva/nível são **zerados silenciosamente** (`_clamp_non_negative`), não rejeitados — decisão documentada no código ("ruído de simulação/sensor vira 0, não descarta a leitura inteira"), mas quem espera um erro 422 para dado negativo vai se surpreender: hoje isso passa como `0.0`. Ver Parte E — este é exatamente o arquivo estendido com os campos opcionais enriquecidos. |

### 1.9 `services/api/app/engine/mesh_payload.py`

| Campo | Detalhe |
|---|---|
| Linguagem/formato | Python 3 |
| Camada | Domínio/adaptador — empacotamento de payload de comunicação simulada |
| Responsabilidade | Recebe um `RiskEvaluationResponse` já calculado e monta um payload compacto no formato que **um dia** poderia ser enviado por UniMesh/LoRa — sem enviar nada de verdade |
| Principais símbolos | `_LATENCY_BY_LEVEL_SECONDS: dict[str, float]` (latência simulada fixa por nível: 2.1/3.4/4.2/5.8 s); `build_mesh_payload(risk: RiskEvaluationResponse, region: str, municipio: str = "Blumenau/SC") -> MeshPayload` |
| Quem chama este arquivo | `app.routers.telemetry.build_mesh_payload()` (`POST /api/telemetry/mesh-payload`) — único chamador |
| O que este arquivo chama/importa | `app.schemas.risk.RiskEvaluationResponse`, `app.schemas.telemetry.MeshPayload` |
| Entrada esperada | Um `RiskEvaluationResponse` já pronto (não recalcula risco) + `region: str` |
| Saída gerada | `MeshPayload` com `implemented: False` fixo e `compact_payload` no formato `FG|{municipio}|{NIVEL}|{regiao}` |
| Dependências | Nenhuma além dos schemas |
| Status | **Simulado, explicitamente** — o próprio docstring do arquivo é enfático: "NÃO implementa LoRa, Meshtastic ou qualquer rádio real. Não há hardware, não há transmissão física, não há socket nem porta serial aberta." Testado (`tests/test_mesh_payload.py`, 4 testes, inclusive garantindo `implemented is False` mesmo em risco crítico) |
| Observações de risco | Nenhum risco técnico — o risco aqui é **de comunicação com stakeholder**: o nome "UniMesh/LoRa" no payload pode sugerir hardware real para quem não lê a documentação. `implemented: false` no schema e o aviso em `note` mitigam isso, mas vale reforçar em qualquer demo verbal. |

---

## 2. Backend — `services/api/app/routers/`

### 2.1 `services/api/app/routers/risk.py`

| Campo | Detalhe |
|---|---|
| Linguagem/formato | Python 3, `fastapi.APIRouter` |
| Camada | Interface HTTP |
| Responsabilidade | Expõe o motor de risco via HTTP |
| Endpoints | `GET /api/risk/status` (metadado estático); `POST /api/risk/evaluate` (1 leitura → 1 avaliação); `POST /api/risk/evaluate-batch` (N leituras → N avaliações) |
| Principais símbolos | `router = APIRouter(prefix="/api/risk", tags=["risk"])`; funções `risk_status()`, `evaluate_risk()`, `evaluate_risk_batch()` |
| Quem chama este arquivo | `app.main` (`app.include_router(risk.router)`); consumido por `apps/web/src/lib/api.ts` (`fetchRiskStatus`, `evaluateRisk`) — usado por `Dashboard.tsx` (indireto, via status) e `Telemetria.tsx` (`evaluateRisk`) |
| O que este arquivo chama/importa | `app.engine.risk_engine.{evaluate, evaluate_batch}`, `app.schemas.risk.*` |
| Entrada esperada | `RiskEvaluationRequest` (JSON) para `/evaluate`; `RiskBatchRequest` (lista) para `/evaluate-batch` |
| Saída gerada | `RiskEvaluationResponse` ou `RiskBatchResponse` — validação de schema automática pelo FastAPI (`response_model=`) |
| Dependências | `app.engine.risk_engine` |
| Status | Implementado, testado (`tests/test_risk_api.py`, 5 testes cobrindo status, shape 200, 422 por campo faltando, batch) |
| Observações de risco | Nenhuma validação de autenticação/autorização — qualquer cliente pode chamar `/evaluate` sem credencial. Aceitável para PoC local, não para exposição pública. |

### 2.2 `services/api/app/routers/telemetry.py`

| Campo | Detalhe |
|---|---|
| Linguagem/formato | Python 3, `fastapi.APIRouter` |
| Camada | Interface HTTP |
| Responsabilidade | Normaliza telemetria bruta e gera payload de comunicação simulada |
| Endpoints | `GET /api/telemetry/status`; `POST /api/telemetry/normalize` (payload bruto → `NormalizedTelemetryReading`); `POST /api/telemetry/mesh-payload` (payload bruto → normaliza → avalia risco → empacota mesh) |
| Principais símbolos | `router`; `telemetry_status()`, `normalize_telemetry(payload: dict[str, Any])`, `build_mesh_payload(payload: dict[str, Any])` |
| Quem chama este arquivo | `app.main`; consumido por `apps/web/src/lib/api.ts::buildMeshPayload()` — usado por `Telemetria.tsx` (botão "Gerar payload UniMesh/LoRa simulado"). `normalize_telemetry` **não tem consumidor no frontend hoje** (só testado via API diretamente) |
| O que este arquivo chama/importa | `app.engine.mesh_payload`, `app.engine.risk_engine`, `app.engine.telemetry_normalizer`, `app.schemas.risk.RiskEvaluationRequest`, `app.schemas.telemetry.{MeshPayload, NormalizedTelemetryReading}` |
| Entrada esperada | `dict[str, Any]` livre (não schema rígido) — validado internamente por `telemetry_normalizer.normalize()`, que levanta `ValueError` → convertido em `HTTPException(422)` |
| Saída gerada | `NormalizedTelemetryReading` ou `MeshPayload` |
| Dependências | `app.engine.telemetry_normalizer`, `app.engine.risk_engine`, `app.engine.mesh_payload` |
| Status | Implementado (normalização) / Simulado (mesh payload) — nenhuma leitura real de hardware, `source="simulation"` sempre |
| Observações de risco | `build_mesh_payload` reconstrói manualmente um `RiskEvaluationRequest` a partir do `NormalizedTelemetryReading` + campos crus do payload original (`hand_class_id`, `hand_risk_weight`, `region`) — duplica um pouco a superfície de campos entre `NormalizedTelemetryReading` e `RiskEvaluationRequest`. Funciona, mas é o tipo de lugar que quebra silenciosamente se um campo for renomeado só em um dos dois schemas. |

### 2.3 `services/api/app/routers/scenarios.py`

| Campo | Detalhe |
|---|---|
| Linguagem/formato | Python 3, `fastapi.APIRouter` |
| Camada | Interface HTTP / dados de demonstração |
| Responsabilidade | Define os 3 cenários fixos (seguro/alerta/crítico) e roda o motor de risco real sobre eles |
| Principais símbolos | `DEMO_SCENARIOS: dict[str, RiskEvaluationRequest]` (módulo-level, reexportado — ver `geo.py` abaixo); `scenarios_status()`; `demo_scenarios()` |
| Endpoints | `GET /api/scenarios/status`; `GET /api/scenarios/demo` |
| Quem chama este arquivo | `app.main`; **`app.routers.geo` importa `DEMO_SCENARIOS` diretamente** (`from app.routers.scenarios import DEMO_SCENARIOS`) — usado em `get_demo_points()`; consumido por `apps/web/src/lib/api.ts::fetchScenariosDemo()` — usado por `Dashboard.tsx` e `Alertas.tsx` |
| O que este arquivo chama/importa | `app.engine.risk_engine.evaluate`, `app.schemas.risk.RiskEvaluationRequest` |
| Entrada esperada | Nenhuma (GET sem parâmetros) |
| Saída gerada | `{"source": "simulation", "scenarios": {"seguro": {...}, "alerta": {...}, "critico": {...}}}` — cada valor é um `RiskEvaluationResponse` serializado |
| Dependências | `app.engine.risk_engine` |
| Status | Simulado (dados fixos), mas o **cálculo em si é real** — não é resposta hardcoded, é o motor rodando de verdade sobre 3 combinações representativas |
| Observações de risco | `DEMO_SCENARIOS` é importado por `geo.py` — acoplamento direto entre dois routers. Não é um problema hoje (módulo pequeno, estável), mas quer dizer que mudar a forma de `DEMO_SCENARIOS` em `scenarios.py` também afeta `/api/geo/demo-points` sem aviso explícito. |

### 2.4 `services/api/app/routers/geo.py`

| Campo | Detalhe |
|---|---|
| Linguagem/formato | Python 3, `fastapi.APIRouter`, SQL cru via SQLAlchemy `text()` |
| Camada | Interface HTTP / geoespacial |
| Responsabilidade | Serve as camadas geográficas (limite municipal, bacias, zonas HAND) lidas do PostGIS; contexto espacial de um ponto; metadados e pontos para o mapa de demonstração |
| Endpoints | `GET /api/geo/status` (não toca banco); `GET /api/geo/municipality/blumenau` (PostGIS); `GET /api/geo/basins/blumenau` (PostGIS); `GET /api/geo/hand-zones` (PostGIS, GeoJSON completo); `GET /api/geo/hand-zones/summary` (PostGIS, estatística agregada); `GET /api/geo/point-risk-context?lat&lon` (PostGIS, `ST_Contains`); `GET /api/geo/demo-map` (tenta PostGIS, cai em fallback estático — nunca 500); `GET /api/geo/demo-points` (nunca toca banco, roda `risk_engine` sobre `DEMO_SCENARIOS`) |
| Principais símbolos | `_STATIC_HAND_STATS` (lista fixa, espelha `HAND_CLASS_MAP`/`generate_web_geojson.py`, usada só quando PostGIS falha); `_rows_to_feature_collection()` (privada — converte linhas SQL com `ST_AsGeoJSON` em `FeatureCollection`); as 8 funções de endpoint |
| Quem chama este arquivo | `app.main`; consumido por `apps/web/src/lib/api.ts` (`fetchGeoStatus`, `fetchHandZonesSummary`, `fetchDemoMap`, `fetchDemoPoints`) — usado por `RiskMap.tsx` |
| O que este arquivo chama/importa | `app.database.engine` (conexão direta, sem `get_db()`/ORM), `app.engine.risk_engine`, `app.routers.scenarios.DEMO_SCENARIOS` |
| Entrada esperada | Nenhuma (a maioria) ou `lat`/`lon` como query params validados (`Query(..., ge=-90, le=90)` etc.) |
| Saída gerada | GeoJSON (`FeatureCollection`), estatísticas agregadas, ou objeto de contexto de ponto |
| Dependências | `sqlalchemy`, `app.database`, `app.engine.risk_engine`, `app.routers.scenarios` |
| Status | Misto — `status`/`demo-points` são Implementado/Simulado (não dependem de banco); `municipality/blumenau`, `basins/blumenau`, `hand-zones`, `hand-zones/summary`, `point-risk-context` são **PostGIS** (erro 404/500 tratado se banco vazio/indisponível); `demo-map` é o único com fallback automático embutido (`status: "degraded"`, `source: "static_fallback"`) |
| Observações de risco | `demo-map` captura só `SQLAlchemyError` — uma falha de outro tipo (ex.: erro de rede genérico, timeout do SO) não cairia no `except` e devolveria 500 mesmo assim; o comentário no código reconhece isso implicitamente ao logar só `type(exc).__name__`, nunca a mensagem completa (evita vazar host/porta/credencial do Postgres em log). Os demais endpoints PostGIS (`hand-zones` etc.) **não têm esse fallback** — se o banco cair, erro 500 cru do SQLAlchemy sobe para o cliente. |

### 2.5 `services/api/app/routers/alerts.py`

| Campo | Detalhe |
|---|---|
| Linguagem/formato | Python 3, `fastapi.APIRouter` |
| Camada | Interface HTTP |
| Responsabilidade | Placeholder — só sinaliza que o módulo existe |
| Endpoints | `GET /api/alerts/status` |
| Quem chama este arquivo | `app.main`; nenhum consumidor no frontend hoje (a tela `Alertas.tsx` usa `scenarios.py`, não este router) |
| O que este arquivo chama/importa | Nada além de `fastapi` |
| Entrada/saída | Nenhuma entrada; saída `{"module": "alerts", "status": "placeholder"}` |
| Dependências | Nenhuma |
| Status | Pendente — schema `Alert` existe (`app/schemas/alerts.py`) mas nenhum endpoint CRUD grava/lê da tabela `alerts` do banco |
| Observações de risco | Nenhuma — é um placeholder honesto, não finge funcionalidade que não existe. |

### 2.6 `services/api/app/routers/shelters.py`

| Campo | Detalhe |
|---|---|
| Linguagem/formato | Python 3, `fastapi.APIRouter` |
| Camada | Interface HTTP |
| Responsabilidade | Placeholder — idêntico em espírito a `alerts.py` |
| Endpoints | `GET /api/shelters/status` |
| Quem chama este arquivo | `app.main`; sem consumidor real no frontend (`Shelters.tsx` é texto estático) |
| Dependências | Nenhuma |
| Status | Pendente — schemas `Shelter`/`ShelterRequest` existem, sem CRUD |
| Observações de risco | Nenhuma. |

### 2.7 `services/api/app/routers/health.py` (não listado explicitamente no pedido, incluído por ser crítico para o boot)

`GET /health` — sem prefixo `/api`, único endpoint fora do padrão. Lê `settings.simulation_mode` para reportar `"mode": "simulation"|"production"`. Implementado, testado.

---

## 3. Backend — `services/api/app/schemas/`

Todos são modelos Pydantic — contrato de entrada/saída, sem lógica própria além de `Field(...)` (validação declarativa).

### 3.1 `services/api/app/schemas/risk.py`

- **Classes**: `RiskAssessment` (legado — schema da tabela `risk_assessments`, F1, não usado pelo motor F3 atual, mantido para não quebrar o schema do banco); `RiskEvaluationRequest` (entrada do motor — `latitude`/`longitude`/`rainfall_mm`/`water_level_m` obrigatórios, resto opcional); `RiskFactors` (os 4 fatores normalizados); `RiskEvaluationResponse` (saída completa do motor); `RiskBatchRequest`/`RiskBatchResponse` (wrappers de lista).
- **Quem usa**: `app.engine.risk_engine`, `app.routers.risk`, `app.routers.telemetry`, `app.routers.scenarios`, `app.routers.geo`.
- **Status**: Implementado.
- **Risco**: `RiskAssessment` (legado) e `RiskEvaluationResponse` (atual) coexistem no mesmo arquivo com propósitos diferentes — comentário no topo do arquivo já avisa disso, mas é fácil confundir os dois ao ler rápido.

### 3.2 `services/api/app/schemas/telemetry.py`

- **Classes**: `TelemetryReading` (espelha `services/simulator/simulated_payload_example.json` — **não é usado por nenhum router hoje**, é só o formato de referência do simulador); `NormalizedTelemetryReading` (saída de `telemetry_normalizer.normalize()`); `MeshPayload` (saída de `mesh_payload.build_mesh_payload()`).
- **Quem usa**: `app.engine.telemetry_normalizer`, `app.engine.mesh_payload`, `app.routers.telemetry`.
- **Status**: Implementado/Simulado.
- **Risco**: `TelemetryReading` órfão (nenhum código de produção o instancia) pode confundir quem procura o "schema de entrada real" da API — o schema de entrada real do `/normalize` é `dict[str, Any]` livre, validado por código, não por este modelo.

### 3.3 `services/api/app/schemas/common.py`

`RiskLevel = Literal["seguro", "atencao", "alerta", "critico"]` — usado por `risk.py` (schema) e espelhado manualmente em `apps/web/src/lib/api.ts::RiskLevel` e `apps/web/src/lib/riskTheme.ts`. Fonte de verdade dos 4 níveis. Implementado.

### 3.4 `services/api/app/schemas/alerts.py` / `shelters.py` / `health.py`

Schemas prontos (`Alert`, `Shelter`, `ShelterRequest`, `HealthResponse`) sem lógica de negócio associada além do que os routers placeholder (`alerts.py`, `shelters.py`, `health.py`) já expõem. Status: Pendente (alerts/shelters) / Implementado (health).

---

## 4. Backend — `services/api/tests/`

| Arquivo | O que testa | Toca banco? | Nº de testes (contagem na leitura atual) |
|---|---|---|---|
| `test_risk_engine.py` | Motor de risco isolado — score em `[0,1]`, classificação crítica/segura, fallback sem HAND, confiança menor no fallback, explicação muda com fatores, lookup por região, batch, eco de `region` na resposta | Não | 12 |
| `test_risk_api.py` | Integração via `TestClient` — `/health`, `/api/risk/status`, `/api/risk/evaluate` (200 e 422), `/api/risk/evaluate-batch`, `/api/scenarios/demo`, `/api/telemetry/normalize` (200 e 422), `/api/telemetry/mesh-payload` | Não | 9 |
| `test_telemetry_normalizer.py` | Normalização — chaves canônicas, aliases, clamp de negativo, campo obrigatório faltando, timestamp/communication_status default | Não | 6 |
| `test_mesh_payload.py` | Payload mesh — `implemented` sempre `False` (inclusive em crítico), `source` sempre `"simulation"`, nível/região presentes no payload compacto | Não | 4 |
| `test_geo_demo.py` | `/api/geo/demo-map` (nunca 500, shape correta, sem vazar credencial na mensagem) e `/api/geo/demo-points` (3 pontos fixos, níveis corretos, coordenadas válidas) | Tenta, com fallback — suíte não exige Postgres no ar | 6 |

Total observado nesta leitura: **37 testes** (o valor "27+" citado em `Sobre.tsx`/F5.0 está desatualizado — cresceu com a F6/geo-demo; ver recomendação em Parte G para manter esse número sincronizado). Nenhum teste depende de PostgreSQL/PostGIS estar no ar — `pytest.ini` roda `testpaths = tests` com `pythonpath = .`.

---

## 5. Frontend — `apps/web/src/`

### 5.1 `apps/web/src/main.tsx`

| Campo | Detalhe |
|---|---|
| Linguagem | TypeScript + React 19 (JSX) |
| Camada | Bootstrap |
| Responsabilidade | Ponto de entrada Vite — monta a árvore React no DOM |
| Símbolos | `createRoot(...).render(<StrictMode><BrowserRouter><AppRouter/></BrowserRouter></StrictMode>)` |
| Quem chama | `index.html` (`<script type="module" src="/src/main.tsx">`) |
| O que chama | `react-dom/client`, `react-router-dom.BrowserRouter`, `./router.AppRouter`, `./index.css` |
| Entrada | `#root` no DOM |
| Saída | Árvore React montada |
| Status | Implementado |
| Risco | Nenhum. |

### 5.2 `apps/web/src/router.tsx`

| Campo | Detalhe |
|---|---|
| Responsabilidade | Declara todas as rotas da SPA |
| Símbolos | `AppRouter()` — `<Routes>` com `/` (Landing, fora do `Layout`) e um grupo aninhado sob `<Layout/>` (`/painel`, `/mapa`, `/alertas`, `/alertas/:id`, `/telemetria`, `/abrigos`, `/sobre`) |
| Quem chama | `main.tsx` |
| O que chama | `react-router-dom.{Route, Routes}`, `./components/Layout`, `./pages/*` (8 páginas) |
| Status | Implementado |
| Risco | Nenhuma rota protegida por autenticação — esperado numa PoC pública de demonstração. |

### 5.3 `apps/web/src/lib/api.ts`

| Campo | Detalhe |
|---|---|
| Responsabilidade | Único cliente HTTP do frontend — todas as chamadas à API passam por aqui |
| Principais símbolos | `getJSON<T>()`/`postJSON<T>()` (genéricos privados, tratam erro HTTP lançando `Error` com status+detail); tipos `RiskLevel`, `RiskFactors`, `RiskEvaluationRequest/Response`, `ScenariosDemoResponse`, `HandZoneSummary`, `MeshPayload`, `DemoMapResponse`, `HandZoneStat`, `DemoPoint`; funções `fetchHealth`, `fetchGeoStatus`, `fetchHandZonesSummary`, `fetchRiskStatus`, `evaluateRisk`, `fetchScenariosDemo`, `buildMeshPayload`, `fetchDemoMap`, `fetchDemoPoints`, `fetchStaticGeoJSON` |
| Quem chama | `Dashboard.tsx`, `RiskMap.tsx`, `Alertas.tsx`, `Telemetria.tsx` |
| O que chama | `fetch()` nativo contra `API_BASE_URL` (`import.meta.env.VITE_API_URL ?? "http://localhost:8000"`); `fetchStaticGeoJSON` chama `/geo/{filename}` **relativo ao próprio frontend** (servido pelo Vite a partir de `public/geo/`, não pela API) |
| Entrada | Objetos JS tipados (requests) |
| Saída | Promises tipadas |
| Status | Implementado. Nesta rodada (F6.1) ganhou `fetchMunicipalityBlumenau()` e `fetchHandZonesGeoJSON()` (leitura PostGIS real, `GET /api/geo/municipality/blumenau` / `GET /api/geo/hand-zones`) — antes só `fetchDemoMap`/`fetchDemoPoints`/`fetchStaticGeoJSON` existiam sem consumidor; agora `RiskMap.tsx` usa as cinco |
| Risco | `getJSON`/`postJSON` não têm timeout nem retry — uma API travada deixa a Promise pendente indefinidamente; cada página trata isso com seu próprio `catch`, não há um interceptor central. |

### 5.4 `apps/web/src/components/Layout.tsx`

Shell com header fixo (nav com 6 itens + badge "Modo demo — dados simulados" sempre visível) e `<Outlet/>` para a rota ativa. Usado por todas as rotas exceto `/`. Implementado. Nenhum risco — é só apresentação.

### 5.5 `apps/web/src/components/RiskCard.tsx`

Card completo de um resultado de avaliação — badge de nível, score em %, confiança (com aviso "sem contexto HAND" se aplicável), 4 `FactorBar`, texto de explicação, ação recomendada. Consumido por `Dashboard.tsx` (3x) e `Telemetria.tsx` (1x, resultado do formulário). Depende de `FactorBar`, `StatusBadge`, `riskTheme.RISK_THEME`. Implementado.

### 5.6 `apps/web/src/components/StatusBadge.tsx`

Badge colorido por `RiskLevel`, puxando cor/label de `riskTheme.RISK_THEME`. Usado por `RiskCard`, `Alertas.tsx`. Implementado.

### 5.7 `apps/web/src/components/FactorBar.tsx`

Barra 0–100% para 1 fator, com `colorClassFor()` que **replica manualmente** os limiares `0.25/0.5/0.75` de `risk_rules.py::RISK_THRESHOLDS` (comentário no código reconhece a duplicação — usado só para colorir a barra de um fator individual, a classificação de risco real continua sendo sempre feita no backend). Usado por `RiskCard`. Implementado.

### 5.8 Demais componentes de apoio (`apps/web/src/components/`)

| Arquivo | Responsabilidade | Usado por | Status |
|---|---|---|---|
| `PageHeader.tsx` | Título + descrição + slot de ações, padrão de cabeçalho de página | Dashboard, Alertas, Telemetria, Sobre | Implementado |
| `SectionCard.tsx` | Container com título/subtítulo opcional | Dashboard, Telemetria, Sobre | Implementado |
| `MetricCard.tsx` | Card de métrica numérica (label/valor/hint) | Dashboard | Implementado |
| `DemoNotice.tsx` | Aviso "[DEMO]" reutilizável, texto default ou `children` customizado | Dashboard, Telemetria, Alertas, Sobre | Implementado |
| `RiskLegend.tsx` | Legenda horizontal dos 4 níveis de risco | Dashboard, Alertas | Implementado |
| `EmptyState.tsx` | Placeholder de "carregando"/"sem resultado" | Dashboard, Alertas | Implementado |
| `ErrorState.tsx` | Card de erro padronizado | Dashboard, Alertas, Telemetria | Implementado |
| `MapLegend.tsx` | Legenda flutuante para o mapa (suscetibilidade HAND + marcadores) | `RiskMap.tsx` — passou a ser consumido na F6.1 (estava pronto e órfão desde antes) | Implementado |

### 5.9 `apps/web/src/lib/riskTheme.ts`

Fonte única de cor/label por `RiskLevel` — `RISK_THEME` (hex, classes Tailwind para badge/dot/texto/barra), `RISK_LEVELS_ORDERED`, `riskWeight()` (índice numérico para comparar severidade). Consumido por `RiskCard`, `StatusBadge`, `FactorBar`, `RiskLegend`, `MapLegend`, `Dashboard`, `Alertas`. Implementado — é o único lugar que sabe a paleta; nenhum componente redefine cor por conta própria.

### 5.10 `apps/web/src/pages/Dashboard.tsx` (`/painel`)

| Campo | Detalhe |
|---|---|
| Responsabilidade | Painel operacional — resumo dos 3 cenários fixos + métricas agregadas + próxima ação recomendada |
| Ciclo de dados | `useEffect` dispara `fetchRiskStatus()` (só para o badge "online/offline") e `fetchScenariosDemo()` (dado real da página) em paralelo |
| Quem chama | `router.tsx` (rota `/painel`) |
| O que chama | `lib/api.{fetchRiskStatus, fetchScenariosDemo}`, `lib/riskTheme`, `components/{RiskCard, PageHeader, MetricCard, SectionCard, DemoNotice, RiskLegend, ErrorState, EmptyState}` |
| Entrada | Nenhuma (sem parâmetros de rota) |
| Saída | Tela renderizada — 4 `MetricCard`, 1 `SectionCard` de próxima ação, `RiskLegend`, grid de 3 `RiskCard` |
| Status | Implementado |
| Risco | Se `fetchScenariosDemo()` falhar, a tela mostra só `ErrorState` — não tenta fallback nenhum (diferente de `RiskMap.tsx`, que tem fallback estático). Coerente: o painel depende do motor de risco estar de pé, não há dado estático equivalente para substituir. |

### 5.11 `apps/web/src/pages/RiskMap.tsx` (`/mapa`)

| Campo | Detalhe |
|---|---|
| Responsabilidade (F6.1 — estado atual) | Mapa Leaflet real: `MapContainer` com `TileLayer` OpenStreetMap, camada de zonas HAND (`GeoJSON`, colorida por susceptibilidade via `themeForSusceptibility`), limite municipal (`GeoJSON` tracejado), marcadores dos 3 cenários simulados (`Marker` com ícone colorido por `RiskLevel`, popup com nome/score/explicação), `MapLegend` sobreposta |
| Estratégia de fonte de dados | **PostGIS primeiro, fallback estático automático**: `useEffect` chama `fetchDemoMap()` para saber `source` (`"postgis"` ou `"static_fallback"`); um segundo `useEffect` reage a essa mudança — se `"postgis"`, tenta `fetchMunicipalityBlumenau()` + `fetchHandZonesGeoJSON()` (dado real do banco); qualquer falha (banco indisponível, `demoMap` já veio `static_fallback`) cai em `fetchStaticGeoJSON()` para os dois mesmos arquivos estáticos gerados por `generate_web_geojson.py` |
| Quem chama | `router.tsx` (rota `/mapa`) |
| O que chama | `lib/api.{fetchDemoMap, fetchDemoPoints, fetchMunicipalityBlumenau, fetchHandZonesGeoJSON, fetchStaticGeoJSON}`, `lib/riskTheme.{RISK_THEME, RiskTheme}`, `components/{PageHeader, SectionCard, DemoNotice, MapLegend, ErrorState, EmptyState}`, `leaflet` (`L.divIcon` para os marcadores coloridos, evita o problema clássico de ícone padrão do Leaflet quebrado sob bundlers), `react-leaflet` (`GeoJSON`, `MapContainer`, `Marker`, `Popup`, `TileLayer`) |
| Status | **Implementado nesta rodada (F6.1)** — fechou exatamente o gap "mapa não é diferencial" identificado pela crítica da equipe. Ver Parte F (`docs/mapa-diferencial-plano.md`) para o diagnóstico completo e o que ainda falta (testar com PostGIS populado de verdade, depender de tile server externo). |
| Risco | `TileLayer` depende de `tile.openstreetmap.org` — sem internet, o mapa monta mas os tiles de fundo não carregam (as camadas de dado — HAND, limite, marcadores — continuam renderizando por cima, só o mapa-base fica em branco). Nenhum teste automatizado cobre esta página (é TSX de UI, fora do escopo de `pytest`); validação é manual/visual. |

### 5.12 `apps/web/src/pages/Telemetria.tsx` (`/telemetria`)

| Campo | Detalhe |
|---|---|
| Responsabilidade | Formulário manual de teste do motor de risco — não lê nenhum sensor, só envia o que o operador digitar ou um dos 3 exemplos rápidos |
| Ciclo de dados | Formulário controlado (`FormState`) → `buildRequestPayload()` monta o JSON → `handleEvaluate()` chama `evaluateRisk()` (`POST /api/risk/evaluate`) → `handleMeshPayload()` chama `buildMeshPayload()` (`POST /api/telemetry/mesh-payload`) |
| Quem chama | `router.tsx` (rota `/telemetria`) |
| O que chama | `lib/api.{evaluateRisk, buildMeshPayload}`, `components/{RiskCard, PageHeader, SectionCard, DemoNotice, ErrorState}` |
| Entrada | Digitação do operador ou um de 3 `QUICK_EXAMPLES` (espelham `DEMO_SCENARIOS` do backend) |
| Saída | `RiskCard` com o resultado + bloco JSON bruto do `MeshPayload` (com aviso `implemented: false` bem visível) |
| Status | Implementado |
| Risco | Nenhuma validação client-side além dos atributos HTML (`required`, `min`, `step`) — validação de negócio (ex.: `rainfall_mm ≥ 0`) só acontece no backend (Pydantic `Field(ge=0)`), retornando 422 tratado pelo `catch` do formulário. Funciona, mas o erro exibido é a mensagem crua do backend, não uma mensagem por campo. |

### 5.13 `apps/web/src/pages/Alertas.tsx` (`/alertas`)

Deriva os "alertas" diretamente de `fetchScenariosDemo()` — não existe fonte de alerta própria (o router `alerts.py` é placeholder). Tem filtro por nível (`RiskLevel | "todos"`) e link direto para `/telemetria`. Cada card mostra `simulado` explicitamente. Implementado, mas semanticamente é uma segunda visualização dos mesmos 3 cenários fixos — não alertas reais.

### 5.14 `apps/web/src/pages/AlertDetail.tsx` (`/alertas/:id`)

Placeholder — só ecoa o `id` da rota (`useParams()`), texto fixo dizendo que o histórico entra quando `alerts.py` estiver conectado ao banco. Pendente.

### 5.15 `apps/web/src/pages/Shelters.tsx` (`/abrigos`)

Placeholder — texto estático, nenhuma chamada de API. Pendente (espelha o backend `shelters.py`, também placeholder).

### 5.16 `apps/web/src/pages/Sobre.tsx` (`/sobre`)

Conteúdo 100% estático (nenhum `fetch`) — explica identidade do produto, por que Blumenau, por que HAND, motor de risco, e as 3 colunas "Implementado / Simulado / Roadmap". É a página de documentação embutida na UI. Implementado. Risco: como é texto solto, pode desalinhar de F5.0 sozinho conforme o backend evolui — ex.: hoje cita "27+ testes", a contagem real observada nesta auditoria já é 37 (ver seção 4).

### 5.17 `apps/web/src/pages/Landing.tsx` (`/`)

Página estática fora do `Layout` — hero simples, sem nav, sem chamada de API. Implementado.

---

## 6. Geo/Dados

### 6.1 `data/hand/` (artefatos versionados)

| Arquivo | Formato | O que é | Gerado/consumido por | Status |
|---|---|---|---|---|
| `blumenau_boundary.gpkg` | GeoPackage (vetor) | Limite municipal de Blumenau, 1 polígono, EPSG:4326 | Consumido por `export_to_postgis.py::cmd_export_boundary` e `generate_web_geojson.py::generate_boundary` | Artefato geoespacial |
| `ottobacias_blumenau_union.gpkg` | GeoPackage (vetor) | União das sub-bacias contribuintes (ANA/Ottobacias), 1 polígono | Consumido por `export_to_postgis.py::cmd_export_basins` e `generate_web_geojson.py::generate_basins` | Artefato geoespacial |
| `blumenau_hand_classes_vector.gpkg` | GeoPackage (vetor), ~19 MB | 4 zonas HAND vetorizadas (classes 0–3) com `class_id`/`area_m2` | Consumido por `export_to_postgis.py::cmd_export_hand_zones` e `generate_web_geojson.py::generate_hand_zones` | Artefato geoespacial |
| `hand_classes_stats.json` | JSON | Estatística de área por classe (`class_id`, `area_m2`, `percent_area`) — gerada junto com o vetor acima, referência independente da API | Lido só como referência/checagem manual — não é consumido por código de produção (a versão que a API usa é `_STATIC_HAND_STATS` em `geo.py`, hardcoded a partir destes mesmos números) | Artefato geoespacial |
| `previews/mapa_hand_transparent.png` | PNG | Mapa estático do raster HAND contínuo, fundo transparente | Visual — nenhum código lê este arquivo | Artefato geoespacial |
| `previews/mapa_suscetibilidade_blumenau.png` | PNG | Mapa estático de suscetibilidade classificada | Visual — nenhum código lê este arquivo | Artefato geoespacial |
| `README.md` | Markdown | Explica origem, o que não foi trazido (DEM bruto, raster original), licença | Documentação | Documentação |

### 6.2 `services/geo/scripts/export_to_postgis.py`

| Campo | Detalhe |
|---|---|
| Linguagem | Python 3, CLI via `argparse` |
| Camada | ETL geoespacial (fora da API — ambiente próprio com `geopandas`/`rasterio`) |
| Responsabilidade | Transporta os `.gpkg` de `data/hand/` para as tabelas PostGIS `municipalities`/`basins`/`hand_zones` |
| Comandos | `inspect`, `export-boundary`, `export-basins`, `export-hand-zones`, `export-all` |
| Principais símbolos | `HAND_CLASS_MAP` (mapeamento `class_id → {label, hand_min_m, hand_max_m, susceptibility, risk_weight}` — fonte de verdade, replicada em `spatial_context.py` e `generate_web_geojson.py`); `get_engine()`, `_require()`, `_to_multipolygon()`, `cmd_inspect/export_boundary/export_basins/export_hand_zones/export_all` |
| Quem chama | Operador via linha de comando (`scripts/dev/run_export.sh`) — **nunca executado contra um Postgres real nesta sessão de auditoria**, segundo o F5.0 |
| O que chama | `geopandas`, `shapely.MultiPolygon`, `sqlalchemy.create_engine/text`; lê `DATABASE_URL` do ambiente |
| Entrada | Os 3 `.gpkg` de `data/hand/` + `DATABASE_URL` |
| Saída | Linhas em `municipalities`/`basins`/`hand_zones` (PostGIS) |
| Dependências | `geopandas`, `rasterio`(indireto via geopandas), `shapely`, `pyproj`, `sqlalchemy`, `geoalchemy2`, `psycopg[binary]` — **não fazem parte de `services/api/requirements.txt`**, ambiente isolado (`services/geo/.venv`) |
| Status | Pendente/PostGIS — script correto e revisado, mas depende de banco disponível para rodar de fato; sem confirmação de execução bem-sucedida nesta auditoria |
| Observações de risco | `cmd_export_hand_zones` pula silenciosamente (com print de aviso, não exceção) qualquer `class_id` fora de `HAND_CLASS_MAP` — comportamento correto (não inventa rótulo), mas quer dizer que um erro de dado na origem produziria uma tabela `hand_zones` com **menos** zonas do que o raster original, sem falhar o script. |

### 6.3 `services/geo/scripts/inspect_hand_artifacts.py`

Somente leitura — inspeciona (tamanho, CRS, colunas, classes de pixel) os artefatos **no repositório legado `HAND`**, antes de decidir o que copiar para `data/hand/`. Não altera nada. Já executado com sucesso em sessão anterior segundo F5.0. Implementado. Sem risco — é uma ferramenta de auditoria, não de produção.

### 6.4 `services/geo/scripts/generate_web_geojson.py`

| Campo | Detalhe |
|---|---|
| Responsabilidade | Gera os GeoJSON leves servidos estaticamente pelo Vite (`apps/web/public/geo/`), simplificando a geometria de zonas HAND para caber num orçamento de tamanho razoável para web |
| Principais símbolos | `HAND_CLASS_MAP` (cópia duplicada intencional do mapeamento — comentário no código explica por quê: evitar puxar `sqlalchemy`/`geoalchemy2` só para isso); `HAND_ZONES_SIMPLIFY_TOLERANCE = 0.0005` (graus, ~55 m no equador); `write_geojson()`, `generate_boundary()`, `generate_basins()`, `generate_hand_zones()`, `write_stats()` |
| Quem chama | Operador via linha de comando (`cd services/geo && .venv/bin/python scripts/generate_web_geojson.py`) |
| O que chama | `geopandas` — lê os mesmos 3 `.gpkg` de `data/hand/` |
| Saída | `apps/web/public/geo/{blumenau_boundary,blumenau_basins,blumenau_hand_zones_simplified}.geojson` + `hand_classes_stats.json` — **já gerados e presentes no repo** (confirmado nesta auditoria: `blumenau_hand_zones_simplified.geojson` tem 6.6 MB) |
| Status | Implementado — script já rodou com sucesso, saída existe e está versionada |
| Observações de risco | `preserve_topology=False` na simplificação é uma escolha documentada (rodar com `True` travava >3 min) — aceitável para um polígono de fundo decorativo, mas **não deve ser usado para nenhum cálculo geométrico exato** (ex.: `ST_Contains` de produção continua usando a versão não simplificada no PostGIS, não este GeoJSON). |

### 6.5 `db/migrations/*.sql`

| Arquivo | Responsabilidade | Status |
|---|---|---|
| `001_postgis.sql` | `CREATE EXTENSION postgis, pgcrypto` | Pendente/PostGIS |
| `002_core_tables.sql` | Cria schema inicial (F1) — `municipalities`/`basins`/`rivers`/`hand_zones` em versão simples + `users`, `shelters`, `shelter_requests`, `alerts`, `telemetry_readings`, `risk_assessments` | Pendente/PostGIS — tabelas espaciais desta migration são **substituídas** pela 003; as demais (`users` etc.) continuam como criadas aqui |
| `003_hand_layers.sql` | Recria `municipalities`/`basins`/`rivers`/`hand_zones` com schema rico (índices GIST, colunas `class_id`/`susceptibility`/`risk_weight`/`area_m2`) e reata o FK de `risk_assessments.hand_zone_id` | Pendente/PostGIS |

Nenhuma migration foi confirmada como aplicada contra um Postgres real nesta auditoria (não há como confirmar isso lendo só o SQL — ver Parte G para o resultado real desta rodada).

### 6.6 `scripts/dev/*.sh`

| Arquivo | Responsabilidade | Status |
|---|---|---|
| `apply_migrations.sh` | Roda as 3 migrations em ordem via `psql`, normalizando o prefixo `postgresql+psycopg:` → `postgresql:` (psql não entende o dialeto SQLAlchemy) | Pendente/PostGIS |
| `run_export.sh` | Cria (se preciso) o venv de `services/geo` com as libs geoespaciais, roda `export_to_postgis.py inspect` seguido de `export-all` | Pendente/PostGIS |
| `test_geo_endpoints.sh` | `curl` sequencial nos 7 endpoints `/api/geo/*` + `/health`, formata com `jq` se disponível | Pendente/PostGIS (só é útil com API+banco no ar) |

---

## Parte B — Fluxos de execução do sistema

Esta seção existia só como lista de endpoints no F5.0. Aqui cada fluxo é
descrito **passo a passo**, com o arquivo exato e a função exata acionada em
cada etapa.

### Fluxo 1 — Abertura do frontend

```
Browser → GET /
  1. index.html carrega <script src="/src/main.tsx">
  2. main.tsx: createRoot(#root).render(<StrictMode><BrowserRouter><AppRouter/></BrowserRouter></StrictMode>)
  3. router.tsx: <AppRouter/> resolve a rota atual contra <Routes>
     - "/" → <Landing/> (fora do Layout, sem nav)
     - qualquer outra rota conhecida → <Layout/> (nav + <Outlet/>) → página correspondente
  4. Layout.tsx renderiza o header fixo (nav de 6 itens, badge "Modo demo")
     e injeta a página ativa no <Outlet/>
```

Nenhuma chamada de rede acontece neste fluxo em si — cada página, uma vez
montada, é quem dispara suas próprias chamadas (fluxos 2–5 abaixo).

### Fluxo 2 — Ciclo do painel (`/painel`)

```
Dashboard.tsx monta
  → useEffect dispara em paralelo:
     a) fetchRiskStatus()          [lib/api.ts]
          → GET /api/risk/status                    [routers/risk.py :: risk_status()]
          → resposta estática {"module":"risk","status":"active",...}
          → só usada para o badge "motor de risco: online/offline"
     b) fetchScenariosDemo()       [lib/api.ts]
          → GET /api/scenarios/demo                  [routers/scenarios.py :: demo_scenarios()]
          → para cada um dos 3 DEMO_SCENARIOS (seguro/alerta/critico):
               risk_engine.evaluate(request)          [engine/risk_engine.py]
                 → _resolve_spatial_context(request)   [engine/risk_engine.py]
                      → resolve_hand_class() / lookup_mock_region()  [engine/spatial_context.py]
                 → risk_rules.rainfall_factor / water_level_factor / trend_factor  [engine/risk_rules.py]
                 → fórmula de fusão (com ou sem fallback) → score, risk_level
                 → risk_explanation.build_explanation(...)  [engine/risk_explanation.py]
                 → monta RiskEvaluationResponse            [schemas/risk.py]
          → resposta: {"source":"simulation","scenarios":{seguro:{...}, alerta:{...}, critico:{...}}}
  → setScenarios(resposta) → re-render
     - 4 MetricCard (nº cenários, maior risco, confiança média, "Comunicação: Simulada")
     - SectionCard "Próxima ação recomendada" (derivada do cenário de maior risco, calculado no frontend com riskWeight())
     - RiskLegend
     - grid de 3 RiskCard (1 por cenário), cada um consumindo factors/explanation/recommended_action já prontos do backend
```

### Fluxo 3 — Ciclo da telemetria (`/telemetria`, avaliação manual)

```
Telemetria.tsx — operador preenche o formulário (ou clica um QUICK_EXAMPLE)
  → handleEvaluate(event) no submit
     → buildRequestPayload() monta o JSON a partir do FormState (strings → number/null)
     → evaluateRisk(payload)                          [lib/api.ts]
          → POST /api/risk/evaluate                    [routers/risk.py :: evaluate_risk()]
               → FastAPI valida o body contra RiskEvaluationRequest (Pydantic) — 422 se inválido
               → risk_engine.evaluate(request)          [engine/risk_engine.py]
                    → _resolve_spatial_context: prioridade
                         1) hand_risk_weight explícito no payload
                         2) hand_class_id explícito → resolve_hand_class()      [engine/spatial_context.py]
                         3) region explícito → lookup_mock_region()             [engine/spatial_context.py]
                         4) nenhum dos três → spatial_context_available=False (fallback)
                    → risk_rules.{rainfall_factor, water_level_factor, trend_factor}  [engine/risk_rules.py]
                    → score = fusão ponderada (pesos normais OU redistribuídos no fallback)
                    → risk_rules.classify_risk(score) → risk_level
                    → risk_explanation.build_explanation(...)  [engine/risk_explanation.py]
                    → risk_rules.recommended_action(risk_level)
                    → RiskEvaluationResponse             [schemas/risk.py]
     → setResult(response) → <RiskCard title="Resultado da avaliação" result={response}/>
```

### Fluxo 4 — Ciclo do payload UniMesh/LoRa simulado (`/telemetria`, botão mesh)

```
Telemetria.tsx — mesmo formulário, botão "Gerar payload UniMesh/LoRa simulado"
  → handleMeshPayload()
     → buildMeshPayload(payload)                       [lib/api.ts]
          → POST /api/telemetry/mesh-payload            [routers/telemetry.py :: build_mesh_payload()]
               → telemetry_normalizer.normalize(payload) [engine/telemetry_normalizer.py]
                    → aceita aliases de campo, clampa negativo, timestamp default
                    → ValueError se faltar rainfall_mm/water_level_m/latitude/longitude → HTTPException(422)
               → reconstrói RiskEvaluationRequest a partir do NormalizedTelemetryReading
                 + hand_class_id/hand_risk_weight/region crus do payload original
               → risk_engine.evaluate(risk_request)      [engine/risk_engine.py] (mesmo caminho do Fluxo 3)
               → mesh_payload.build_mesh_payload(risk, region)  [engine/mesh_payload.py]
                    → monta compact_payload = "FG|{municipio}|{NIVEL}|{regiao}"
                    → latência simulada por nível (_LATENCY_BY_LEVEL_SECONDS)
                    → implemented=False, source="simulation" (sempre, sem exceção)
     → setMeshPayload(response) → bloco JSON exibido com aviso "implemented: false" em destaque
```

### Fluxo 5 — Ciclo do mapa (`/mapa`, estado atual F6.1)

```
RiskMap.tsx monta
  → useEffect #1 dispara em paralelo:
     a) fetchDemoMap()     → GET /api/geo/demo-map          [routers/geo.py :: get_demo_map()]
          → tenta SELECT ... FROM hand_zones (PostGIS); nunca 500 — cai em _STATIC_HAND_STATS se falhar
          → guarda {status, source: "postgis"|"static_fallback", stats, message} em demoMap
     b) fetchDemoPoints()  → GET /api/geo/demo-points        [routers/geo.py :: get_demo_points()]
          → roda risk_engine.evaluate() sobre DEMO_SCENARIOS (nunca toca banco)
          → guarda os 3 pontos {id, name, lat, lon, risk_level, risk_score, explanation}

  → useEffect #2 reage a mudança de demoMap:
     SE demoMap.source === "postgis":
          → tenta fetchMunicipalityBlumenau() + fetchHandZonesGeoJSON()   [PostGIS real]
               → GET /api/geo/municipality/blumenau, GET /api/geo/hand-zones
          → SE qualquer uma falhar (banco caiu entre as duas chamadas): cai no bloco de fallback abaixo
     SENÃO (ou fallback do try acima):
          → fetchStaticGeoJSON("blumenau_boundary.geojson")
          → fetchStaticGeoJSON("blumenau_hand_zones_simplified.geojson")
               → arquivos servidos como estático pelo Vite (apps/web/public/geo/),
                 gerados por services/geo/scripts/generate_web_geojson.py — nunca dependem de banco

  → render:
     MapContainer (Leaflet, centro Blumenau, zoom 11)
       → TileLayer (OpenStreetMap, requer internet para os tiles de fundo)
       → GeoJSON de zonas HAND — cor por susceptibilidade (themeForSusceptibility → RISK_THEME)
            → popup por zona: classe, susceptibilidade, %área, peso de risco
       → GeoJSON do limite municipal — contorno tracejado, sem preenchimento
       → 3 Marker (ícone L.divIcon colorido por risk_level) — popup: nome, score, explicação
       → MapLegend sobreposta (susceptibilidade HAND + marcadores)
```

Este fluxo fechou o gap que a crítica da equipe apontou como **"o mapa não
é diferencial"**: antes (F5.0), mesmo no caminho feliz (PostGIS
respondendo), a página nunca desenhava um mapa — só números em cards.
`leaflet`/`react-leaflet` já estavam instalados e
`apps/web/public/geo/*.geojson` já existiam prontos, mas `RiskMap.tsx` não
os usava. Na F6.1 a página passou a consumir PostGIS quando disponível e o
fallback estático quando não — ver `docs/mapa-diferencial-plano.md` (Parte
F) para o diagnóstico completo, o plano original e o que ainda falta
validar (execução real contra PostGIS populado).

### Fluxo 6 — Ciclo HAND, do dado bruto ao mapa (fluxo completo, produção)

```
HAND/outputs/blumenau/blumenau_hand_classes.tif  (repositório externo, não versionado aqui)
  → [manual] inspect_hand_artifacts.py --hand-dir ...   (somente leitura, decide o que copiar)
  → [manual] cópia dos artefatos leves para FloodGuard/data/hand/*.gpkg
  → generate_web_geojson.py                              [services/geo/scripts/]
       → lê data/hand/*.gpkg
       → simplifica geometria de zonas HAND (tolerância 0.0005)
       → escreve apps/web/public/geo/*.geojson + hand_classes_stats.json
  → export_to_postgis.py export-all                       [services/geo/scripts/]
       → lê os mesmos data/hand/*.gpkg (sem simplificar)
       → grava em municipalities / basins / hand_zones (PostGIS)   [db/migrations/003_hand_layers.sql]
  → GET /api/geo/hand-zones, /api/geo/hand-zones/summary, /api/geo/point-risk-context
       → routers/geo.py lê PostGIS via SQL cru (ST_AsGeoJSON)
  → frontend RiskMap.tsx
       → caminho feliz: consome os endpoints PostGIS acima
       → caminho de fallback: consome os arquivos estáticos gerados por generate_web_geojson.py
         (fetchStaticGeoJSON, já existente em lib/api.ts)
       → legenda de zonas HAND + cores por susceptibilidade (MapLegend.tsx, riskTheme.ts)
```

Ver `docs/hand-processamento-detalhado.md` (Parte C) para a explicação
completa de cada etapa deste pipeline, inclusive o que é comprovado por
arquivo e o que é inferido.

### Fluxo 7 — Ciclo de testes

```
pytest (services/api/, pytest.ini: pythonpath=., testpaths=tests)
  → tests/test_risk_engine.py    → chama app.engine.risk_engine.evaluate()/evaluate_batch() diretamente (sem HTTP)
  → tests/test_telemetry_normalizer.py → chama app.engine.telemetry_normalizer.normalize() diretamente
  → tests/test_mesh_payload.py   → chama app.engine.mesh_payload.build_mesh_payload() diretamente
  → tests/test_risk_api.py       → TestClient(app) [app.main] → percorre o mesmo caminho HTTP real
                                     (routers → engine → schemas), sem mocks
  → tests/test_geo_demo.py       → TestClient(app) → GET /api/geo/demo-map, /api/geo/demo-points
                                     → demo-map tenta PostGIS de verdade; sem banco, cai no except
                                       SQLAlchemyError → fallback estático → teste aceita os dois
                                       caminhos (postgis|static_fallback), não força um deles
```

Nenhum teste sobe um Postgres de teste (nem `testcontainers`, nem SQLite
alternativo) — os testes que tocam `geo.py` são desenhados para funcionar
**com ou sem banco**, verificando forma da resposta, não a fonte dos dados.

---

## Observação final sobre honestidade documental

Todo status "Implementado" acima significa **o código roda e faz o que
descreve** — não significa "calibrado com dado real" nem "pronto para
produção". Onde a distinção importava (motor de risco, HAND, mesh payload),
o texto foi explícito. Para a lista formal de limitações do sistema, ver
`docs/limitacoes.md`.
